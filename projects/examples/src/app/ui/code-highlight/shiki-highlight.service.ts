import { Injectable, signal } from '@angular/core';
import { BundledLanguage, BundledTheme, codeToHtml } from 'shiki';

export type SupportedLanguage =
  | 'typescript'
  | 'html'
  | 'css'
  | 'json'
  | 'javascript';
export type SupportedTheme =
  | 'vitesse-dark'
  | 'vitesse-light'
  | 'github-dark'
  | 'github-light';

@Injectable({
  providedIn: 'root',
})
export class ShikiHighlightService {
  private readonly isReady = signal(false);
  private readonly loadingPromise: Promise<void>;

  constructor() {
    // Pre-warm Shiki to ensure fast highlighting
    this.loadingPromise = this.initializeShiki();
  }

  /**
   * Check if Shiki is ready for highlighting
   */
  ready() {
    return this.isReady();
  }

  /**
   * Highlight code using Shiki
   *
   * @param code - The code to highlight
   * @param language - Programming language
   * @param theme - Theme to use (defaults to vitesse-dark)
   * @returns Promise with highlighted HTML
   */
  async highlightCode(
    code: string,
    language: SupportedLanguage,
    theme: SupportedTheme = 'vitesse-dark',
  ): Promise<string> {
    await this.loadingPromise;

    try {
      return await codeToHtml(code.trim(), {
        lang: language as BundledLanguage,
        theme: theme as BundledTheme,
        transformers: [
          {
            // Remove Shiki's default styling to use our Tailwind classes
            pre(node) {
              // Keep the pre element but remove inline styles
              delete node.properties['style'];
              // Add our custom classes
              node.properties['class'] = 'shiki-code-block';
            },
          },
        ],
      });
    } catch (error) {
      console.warn('Shiki highlighting failed:', error);
      // Fallback to escaped code
      return `<pre class="shiki-code-block"><code>${this.escapeHtml(code)}</code></pre>`;
    }
  }

  private async initializeShiki(): Promise<void> {
    try {
      // Pre-load a small snippet to initialize Shiki
      await codeToHtml('const x = 1;', {
        lang: 'typescript',
        theme: 'vitesse-dark',
      });
      this.isReady.set(true);
    } catch (error) {
      console.warn('Failed to initialize Shiki:', error);
      // Mark as ready anyway for fallback behavior
      this.isReady.set(true);
    }
  }

  private escapeHtml(text: string): string {
    return text
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }
}
