import { Injectable } from '@angular/core';
import { codeToHtml } from 'shiki';

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
  async highlightCode(
    code: string,
    language: SupportedLanguage = 'html',
    theme: SupportedTheme = 'vitesse-dark',
  ): Promise<string> {
    try {
      return await codeToHtml(code, {
        lang: language,
        theme: theme,
      });
    } catch (error) {
      console.error('Error highlighting code:', error);
      // Fallback to plain code with basic styling
      return `<pre class="shiki-fallback p-4 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto"><code>${this.escapeHtml(code)}</code></pre>`;
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
