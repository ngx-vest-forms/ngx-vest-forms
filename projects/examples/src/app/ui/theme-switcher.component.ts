import { Component, signal } from '@angular/core';

@Component({
  selector: 'ngx-theme-switcher',

  imports: [], // No need for CommonModule with @if
  template: `
    <button
      type="button"
      aria-label="Toggle light/dark mode"
      class="rounded-full bg-gray-100 p-2 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
      (click)="toggleTheme()"
    >
      @if (isDark()) {
        <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"
          ></path>
        </svg>
      } @else {
        <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
          ></path>
        </svg>
      }
    </button>
  `,
})
export class NgxThemeSwitcherComponent {
  private readonly theme = signal(this.getInitialTheme());

  isDark() {
    return this.theme() === 'dark';
  }

  toggleTheme() {
    const newTheme = this.isDark() ? 'light' : 'dark';
    this.theme.set(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    localStorage.setItem('color-theme', newTheme);
  }

  private getInitialTheme(): 'light' | 'dark' {
    if (localStorage.getItem('color-theme')) {
      return localStorage.getItem('color-theme') as 'light' | 'dark';
    }
    return globalThis.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
}
