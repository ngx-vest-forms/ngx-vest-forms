import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  signal,
  viewChild,
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

  /**
   * Tracks the `lg` breakpoint. At desktop the sidebar is always visible and
   * interactive regardless of {@link drawerOpen}; below it the off-canvas
   * drawer must be made `inert` when closed so keyboard users don't tab into
   * hidden links.
   */
  protected readonly isDesktop = signal(true);

  private readonly sidebar = viewChild<ElementRef<HTMLElement>>('sidebar');
  private readonly menuToggle =
    viewChild<ElementRef<HTMLElement>>('menuToggle');

  /** Previous drawer state, used to drive focus only on actual transitions. */
  private wasOpen = false;

  constructor() {
    // Close the mobile drawer whenever navigation completes.
    inject(Router)
      .events.pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe(() => this.drawerOpen.set(false));

    const media = globalThis.matchMedia?.('(min-width: 1024px)');
    if (media) {
      this.isDesktop.set(media.matches);
      media.addEventListener('change', (event) =>
        this.isDesktop.set(event.matches)
      );
    }

    // Mobile drawer focus management: move focus into the drawer on open,
    // return it to the toggle on close. Skipped entirely at desktop where the
    // sidebar is persistent.
    effect(() => {
      const open = this.drawerOpen();
      if (this.isDesktop()) {
        this.wasOpen = open;
        return;
      }
      if (open && !this.wasOpen) {
        this.sidebar()
          ?.nativeElement.querySelector<HTMLElement>('a[routerLink]')
          ?.focus();
      } else if (!open && this.wasOpen) {
        this.menuToggle()?.nativeElement.focus();
      }
      this.wasOpen = open;
    });
  }

  protected toggleDrawer(): void {
    this.drawerOpen.update((open) => !open);
  }

  protected closeDrawer(): void {
    this.drawerOpen.set(false);
  }
}
