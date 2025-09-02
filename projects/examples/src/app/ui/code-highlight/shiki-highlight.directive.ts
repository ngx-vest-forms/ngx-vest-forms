import {
  afterNextRender,
  Directive,
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
 * Provides VS Code-quality highlighting with TextMate grammar support.
 *
 * Usage:
 * ```html
 * <pre ngxShikiHighlight language="typescript" theme="vitesse-dark">
 *   const greeting = "Hello, World!";
 * </pre>
 * ```
 */
@Directive({
  selector: '[ngxShikiHighlight]',
  standalone: true,
})
export class ShikiHighlightDirective {
  readonly language = input<SupportedLanguage>('typescript');
  readonly theme = input<SupportedTheme>('vitesse-dark');

  private readonly element = inject(ElementRef<HTMLElement>);
  private readonly shikiService = inject(ShikiHighlightService);
  private readonly isHighlighted = signal(false);

  constructor() {
    afterNextRender(async () => {
      await this.highlightCode();
    });
  }

  private async highlightCode(): Promise<void> {
    if (this.isHighlighted()) {
      return;
    }

    const code = this.element.nativeElement.textContent || '';
    if (!code.trim()) {
      return;
    }

    try {
      const highlightedHtml = await this.shikiService.highlightCode(
        code,
        this.language(),
        this.theme(),
      );

      this.element.nativeElement.innerHTML = highlightedHtml;
      this.isHighlighted.set(true);
    } catch (error) {
      console.warn('Failed to highlight code:', error);
      // Keep original content as fallback
    }
  }
}
