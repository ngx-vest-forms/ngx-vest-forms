import {
  computed,
  DestroyRef,
  effect,
  inject,
  Service,
  signal,
} from '@angular/core';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';

/**
 * App-wide light/dark theme.
 *
 * One root instance, so every theme switcher shows the same state. The app
 * follows the OS setting until the user picks a theme; picking the theme the
 * OS already uses clears the stored choice, so the app follows the OS again.
 * `index.html` applies the same rule before Angular boots to avoid a flash.
 */
@Service()
export class ThemeService {
  readonly #storedTheme = signal<Theme | null>(readStoredTheme());
  readonly #systemDark = signal(false);

  /** Whether the dark theme is active. */
  readonly isDark = computed(
    () =>
      (this.#storedTheme() ?? (this.#systemDark() ? 'dark' : 'light')) ===
      'dark'
  );

  constructor() {
    const media = globalThis.matchMedia?.(DARK_QUERY);
    if (media) {
      this.#systemDark.set(media.matches);
      const onChange = (event: MediaQueryListEvent): void =>
        this.#systemDark.set(event.matches);
      media.addEventListener('change', onChange);
      inject(DestroyRef).onDestroy(() =>
        media.removeEventListener('change', onChange)
      );
    }

    effect(() => {
      const isDark = this.isDark();
      document.documentElement.classList.toggle('dark', isDark);
      document.body?.classList.toggle('dark', isDark);
    });
  }

  toggle(): void {
    const next: Theme = this.isDark() ? 'light' : 'dark';
    const followsSystem = (next === 'dark') === this.#systemDark();
    this.#storedTheme.set(followsSystem ? null : next);
    writeStoredTheme(followsSystem ? null : next);
  }
}

function readStoredTheme(): Theme | null {
  try {
    const stored = globalThis.localStorage?.getItem(STORAGE_KEY);
    return stored === 'dark' || stored === 'light' ? stored : null;
  } catch {
    return null;
  }
}

function writeStoredTheme(theme: Theme | null): void {
  try {
    if (theme) {
      globalThis.localStorage?.setItem(STORAGE_KEY, theme);
    } else {
      globalThis.localStorage?.removeItem(STORAGE_KEY);
    }
  } catch {
    // Storage can be unavailable (private mode); the theme still applies.
  }
}
