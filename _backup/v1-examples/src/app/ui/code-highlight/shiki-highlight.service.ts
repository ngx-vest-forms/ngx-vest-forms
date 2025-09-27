import { Injectable, signal } from '@angular/core';

// Import from shiki v1.x using the shorthand approach for better compatibility
import { codeToHtml } from 'shiki';

export type SupportedLanguage =
  | 'typescript'
  | 'html'
  | 'css'
  | 'json'
  | 'javascript'
  | 'angular-html'
  | 'angular-ts'
  | 'text'
  | 'markdown'
  | 'zod'
  | 'valibot'
  | 'arktype';

export type SupportedTheme =
  | 'github-dark'
  | 'github-light'
  | 'min-light'
  | 'nord'
  | 'tokyo-night'
  | 'vitesse-light'
  | 'vitesse-dark';

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
   * Highlight code using Shiki with Angular language support
   *
   * @param code - The code to highlight
   * @param language - Programming language (including angular-html, angular-ts)
   * @param theme - Theme to use (defaults to tokyo-night)
   * @returns Promise with highlighted HTML
   */
  async highlightCode(
    code: string,
    language: SupportedLanguage,
    theme: SupportedTheme = 'tokyo-night',
  ): Promise<string> {
    await this.loadingPromise;

    try {
      // Map angular languages to ensure proper highlighting
      const mappedLanguage = this.mapLanguage(language);

      return await codeToHtml(code.trim(), {
        lang: mappedLanguage,
        theme: theme,
        transformers: [
          {
            // Remove Shiki's default styling to use our Tailwind classes
            pre(node: { properties?: Record<string, unknown> }) {
              // Keep the pre element but remove inline styles
              if (node.properties) {
                delete node.properties['style'];
                // Add our custom classes for proper styling
                node.properties['class'] = `shiki ${theme}`;
              }
            },
          },
        ],
      });
    } catch (error) {
      console.warn(
        `Shiki highlighting failed for language "${language}":`,
        error,
      );
      // Fallback to escaped code with proper structure
      return `<pre class="shiki ${theme}"><code>${this.escapeHtml(code)}</code></pre>`;
    }
  }

  /**
   * Map custom language names to Shiki bundled languages
   */
  private mapLanguage(language: SupportedLanguage): string {
    const languageMap: Record<string, string> = {
      'angular-html': 'angular-html',
      'angular-ts': 'angular-ts',
      typescript: 'typescript',
      javascript: 'javascript',
      html: 'html',
      css: 'css',
      json: 'json',
      text: 'text',
      markdown: 'markdown',
      // Schema languages map to TypeScript since they're TS-based
      zod: 'typescript',
      valibot: 'typescript',
      arktype: 'typescript',
    };

    return languageMap[language] || 'text';
  }

  private async initializeShiki(): Promise<void> {
    try {
      // Pre-load a small snippet to initialize Shiki
      await codeToHtml('const x = 1;', {
        lang: 'typescript',
        theme: 'tokyo-night',
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
