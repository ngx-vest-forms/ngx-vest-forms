import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { THEME_COLORS, ThemeService } from './theme.service';

describe('ThemeService', () => {
  let meta: HTMLMetaElement;

  /** Stubs prefers-color-scheme so the OS setting is known. */
  const stubSystemDark = (matches: boolean): void => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({
        matches,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })
    );
  };

  beforeEach(() => {
    localStorage.removeItem('theme');
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    meta.content = 'unset';
    document.head.append(meta);
  });

  afterEach(() => {
    meta.remove();
    localStorage.removeItem('theme');
    document.documentElement.classList.remove('dark');
    vi.unstubAllGlobals();
  });

  it('sets theme-color from the stored theme, not the OS setting', () => {
    stubSystemDark(false);
    localStorage.setItem('theme', 'dark');

    TestBed.inject(ThemeService);
    TestBed.tick();

    expect(document.documentElement.classList).toContain('dark');
    expect(meta.content).toBe(THEME_COLORS.dark);
  });

  it('follows the OS setting when nothing is stored', () => {
    stubSystemDark(true);

    TestBed.inject(ThemeService);
    TestBed.tick();

    expect(meta.content).toBe(THEME_COLORS.dark);
  });

  it('updates theme-color when the theme is toggled', () => {
    stubSystemDark(true);
    const theme = TestBed.inject(ThemeService);
    TestBed.tick();

    theme.toggle();
    TestBed.tick();

    expect(theme.isDark()).toBe(false);
    expect(document.documentElement.classList).not.toContain('dark');
    expect(meta.content).toBe(THEME_COLORS.light);

    theme.toggle();
    TestBed.tick();

    expect(meta.content).toBe(THEME_COLORS.dark);
  });
});
