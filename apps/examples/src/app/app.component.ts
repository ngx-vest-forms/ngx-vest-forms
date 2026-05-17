import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { filter } from 'rxjs';
import { buildNavGroups } from './shared/routes.metadata';
import { ThemeSwitcherComponent } from './ui/theme-switcher/theme-switcher.component';

/**
 * Examples App shell.
 *
 * The categorized sidebar is rendered entirely from {@link buildNavGroups} —
 * re-grouping or adding a demo is a data change in `routes.metadata.ts`, never
 * a template change here.
 */
@Component({
  selector: 'ngx-root',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, ThemeSwitcherComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  protected readonly navGroups = buildNavGroups();

  /** Mobile drawer visibility; ignored at `lg` breakpoint and above. */
  protected readonly drawerOpen = signal(false);

  constructor() {
    // Close the mobile drawer whenever navigation completes.
    inject(Router)
      .events.pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe(() => this.drawerOpen.set(false));
  }

  protected toggleDrawer(): void {
    this.drawerOpen.update((open) => !open);
  }

  protected closeDrawer(): void {
    this.drawerOpen.set(false);
  }
}
