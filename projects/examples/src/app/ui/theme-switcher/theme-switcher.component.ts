import {
  Component,
  computed,
  effect,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';

@Component({
  selector: 'ngx-theme-switcher',
  host: { class: 'theme-toggle-wrapper' },
  imports: [],
  template: `
    <button
      type="button"
      class="theme-toggle group flex items-center justify-center rounded-md p-2 text-gray-800 transition-colors hover:bg-gray-200/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 dark:text-white dark:hover:bg-white/10 dark:focus-visible:ring-white/50"
      (click)="cyclePreference()"
      [attr.aria-label]="'Change theme: ' + preference() + ' (click to change)'"
    >
      <span class="sr-only">Change theme: {{ preference() }}</span>
      @if (preference() === 'system') {
        <!-- Auto/System icon (computer) -->
        <svg
          class="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      } @else if (effectiveTheme() === 'dark') {
        <!-- Moon icon -->
        <svg
          class="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path
            d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
            fill="currentColor"
          />
        </svg>
      } @else {
        <!-- Sun icon -->
        <svg
          class="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      }
    </button>
  `,
})
export class NgxThemeSwitcherComponent implements OnInit, OnDestroy {
  // User preference: 'system' | 'light' | 'dark'
  readonly preference = signal<'system' | 'light' | 'dark'>(
    this.getInitialPreference(),
  );
  // Derived effective theme (light/dark) respecting system when in system mode
  private readonly systemDark = signal<boolean>(
    globalThis.matchMedia('(prefers-color-scheme: dark)').matches,
  );
  readonly effectiveTheme = computed<'light' | 'dark'>(() => {
    const pref = this.preference();
    if (pref === 'system') return this.systemDark() ? 'dark' : 'light';
    return pref; // pref is 'light' | 'dark'
  });
  private mediaQuery?: MediaQueryList;
  private mediaListener?: (event: MediaQueryListEvent) => void;
  private storageListener?: (event: StorageEvent) => void;

  // Apply classes reactively
  // eslint-disable-next-line no-unused-private-class-members -- side-effect effect
  #apply = effect(() => {
    const theme = this.effectiveTheme();
    const root = document.documentElement;

    // Apply/remove dark class
    root.classList.toggle('dark', theme === 'dark');

    // Force color-scheme for better DevTools compatibility
    root.style.colorScheme = theme === 'dark' ? 'dark' : 'light';
  });

  ngOnInit(): void {
    // Listen for system preference changes only if user hasn't explicitly chosen
    this.mediaQuery = globalThis.matchMedia('(prefers-color-scheme: dark)');
    this.mediaListener = (event) => this.systemDark.set(event.matches);
    this.mediaQuery.addEventListener('change', this.mediaListener);

    // Listen for storage changes from other tabs
    this.storageListener = (event) => {
      if (event.key === 'color-theme') {
        if (event.newValue === 'light' || event.newValue === 'dark') {
          this.preference.set(event.newValue);
        } else if (event.newValue === null) {
          // Theme was removed from storage, switch to system
          this.preference.set('system');
        }
      }
    };
    globalThis.addEventListener('storage', this.storageListener);

    // Ensure component is synchronized with localStorage
    const stored = localStorage.getItem('color-theme');
    if (stored === 'light' || stored === 'dark') {
      this.preference.set(stored);
    }
  }

  ngOnDestroy(): void {
    if (this.mediaQuery && this.mediaListener) {
      this.mediaQuery.removeEventListener('change', this.mediaListener);
    }
    if (this.storageListener) {
      globalThis.removeEventListener('storage', this.storageListener);
    }
  }

  cyclePreference(): void {
    const order: ('system' | 'light' | 'dark')[] = ['system', 'light', 'dark'];
    const index = order.indexOf(this.preference());
    const next = order[(index + 1) % order.length];
    this.preference.set(next);
    if (next === 'system') {
      localStorage.removeItem('color-theme');
    } else {
      localStorage.setItem('color-theme', next);
    }
  }

  private getInitialPreference(): 'system' | 'light' | 'dark' {
    const stored = localStorage.getItem('color-theme');
    if (stored === 'light' || stored === 'dark') return stored;
    return 'system';
  }
}
