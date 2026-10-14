import { Component, inject } from '@angular/core';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'ngx-theme-switcher',
  templateUrl: './theme-switcher.component.html',
  styleUrl: './theme-switcher.component.scss',
  host: { style: 'display: block;' },
})
export class ThemeSwitcherComponent {
  readonly #theme = inject(ThemeService);
  protected readonly isDarkMode = this.#theme.isDark;

  protected toggleTheme(): void {
    this.#theme.toggle();
  }
}
