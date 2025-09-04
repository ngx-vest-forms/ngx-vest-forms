import { Directive, effect, ElementRef, inject, Input } from '@angular/core';

/**
 * Minimal code highlight directive.
 * Avoids dependency on external highlighters; simply applies consistent monospace styling
 * and optional language-based data attribute for future progressive enhancement.
 */
@Directive({
  selector: '[ngxCodeHighlight]',
  standalone: true,
})
export class CodeHighlightDirective {
  private readonly el = inject(ElementRef<HTMLElement>);

  // Accept a language hint (not used for parsing here, but exposed for a11y / future hooks)
  @Input('ngxCodeHighlight') lang: string | undefined;

  constructor() {
    effect(() => {
      const element = this.el.nativeElement;
      element.classList.add('font-mono', 'text-xs', 'leading-relaxed');
      if (this.lang) {
        element.dataset.lang = this.lang;
        // Provide an accessible label hook if not already present
        if (!element.hasAttribute('aria-label')) {
          element.setAttribute('aria-label', `${this.lang} code sample`);
        }
      }
    });
  }
}
