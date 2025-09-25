import {
  afterNextRender,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  signal,
} from '@angular/core';
import {
  ShikiHighlightService,
  SupportedLanguage,
  SupportedTheme,
} from './shiki-highlight.service';

/**
 * Modern Angular directive for syntax highlighting using Shiki
 *
 * Provides VS Code-quality highlighting with TextMate grammar support,
 * including Angular-specific languages (angular-html, angular-ts).
 *
 * Usage:
 * ```html
 * <pre ngxShikiHighlight language="typescript" theme="github-dark">
 *   const greeting = "Hello, World!";
 * </pre>
 *
 * <pre ngxShikiHighlight language="angular-html" theme="github-dark">
 *   <div *ngFor="let item of items">{{ item.name }}</div>
 * </pre>
 *
 * <pre ngxShikiHighlight language="angular-ts" theme="github-dark">
 *   @Component({ selector: 'app-example' })
 *   export class ExampleComponent {}
 * </pre>
 * ```
 */
@Directive({
  selector: '[ngxShikiHighlight]',
  standalone: true,
})
export class ShikiHighlightDirective {
  readonly language = input<SupportedLanguage>('typescript');
  readonly theme = input<SupportedTheme>('tokyo-night');
  // New: Allow passing code as an input so we can reactively re-highlight on changes
  readonly code = input<string | null>(null);

  private readonly element = inject(ElementRef<HTMLElement>);
  private readonly shikiService = inject(ShikiHighlightService);
  private readonly isHighlighted = signal(false);

  constructor() {
    // Initial pass for non-reactive static content (fallback)
    afterNextRender(async () => {
      // If code input is not provided, attempt to highlight existing textContent once
      if (this.code() == null) {
        await this.highlight(this.element.nativeElement.textContent || '');
      }
    });

    // Reactive highlighting whenever code/language/theme inputs change
    effect(() => {
      const code = this.code();
      const lang = this.language();
      const theme = this.theme();

      // When code input is provided, re-highlight on every change
      if (code != null) {
        // Reset previous state and re-render
        this.isHighlighted.set(false);
        this.highlight(code, lang, theme);
      }
    });
  }

  private async highlight(
    code: string,
    language: SupportedLanguage = this.language(),
    theme: SupportedTheme = this.theme(),
  ): Promise<void> {
    const trimmed = (code || '').trim();
    if (!trimmed) {
      this.element.nativeElement.innerHTML = '';
      return;
    }

    try {
      const highlightedHtml = await this.shikiService.highlightCode(
        trimmed,
        language,
        theme,
      );
      const hostElement = this.element.nativeElement;
      const isPre = hostElement.tagName?.toLowerCase() === 'pre';

      if (isPre && highlightedHtml.includes('<pre')) {
        // Parse the generated HTML and extract the <code> content
        const template = document.createElement('template');
        template.innerHTML = highlightedHtml.trim();
        const pre = template.content.querySelector('pre');
        const codeElement = pre?.querySelector('code');

        // Ensure host <pre> carries shiki classes
        hostElement.classList.add('shiki', theme);
        // Insert only code element into the existing <pre>, or fallback to full HTML
        hostElement.innerHTML = codeElement
          ? codeElement.outerHTML
          : highlightedHtml;
      } else {
        hostElement.innerHTML = highlightedHtml;
      }
      this.isHighlighted.set(true);
    } catch (error) {
      console.warn('Failed to highlight code:', error);
      // Keep original content as fallback
    }
  }
}
