import {
  Component,
  effect,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
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
})
export class AppComponent {
  protected readonly navGroups = buildNavGroups();

  /** Mobile drawer visibility; ignored at `lg` breakpoint and above. */
  protected readonly drawerOpen = signal(false);

  /**
   * Desktop sidebar collapsed state (icon-rail mode). Persisted in
   * localStorage so the preference survives a page reload. Ignored on mobile.
   */
  protected readonly sidebarCollapsed = signal<boolean>(
    globalThis.localStorage?.getItem('sidebar-collapsed') === 'true'
  );

  /**
   * Tracks the `lg` breakpoint. At desktop the sidebar is always visible and
   * interactive regardless of {@link drawerOpen}; below it the off-canvas
   * drawer must be made `inert` when closed so keyboard users don't tab into
   * hidden links.
   */
  protected readonly isDesktop = signal(true);

  /** Tooltip label shown in collapsed-rail mode; empty string = hidden. */
  protected readonly tooltipLabel = signal('');
  protected readonly tooltipX = signal(0);
  protected readonly tooltipY = signal(0);

  /** Compute a 2-letter abbreviation from the first two words of a label. */
  protected navAbbr(label: string): string {
    return label
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0])
      .join('');
  }

  protected showNavTooltip(event: Event, label: string): void {
    if (!this.sidebarCollapsed() || !this.isDesktop()) return;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.tooltipX.set(rect.right + 8);
    this.tooltipY.set(rect.top + rect.height / 2);
    this.tooltipLabel.set(label);
  }

  protected hideNavTooltip(): void {
    this.tooltipLabel.set('');
  }

  private readonly sidebar = viewChild<ElementRef<HTMLElement>>('sidebar');
  private readonly menuToggle =
    viewChild<ElementRef<HTMLElement>>('menuToggle');

  /** Previous drawer state, used to drive focus only on actual transitions. */
  private wasOpen = false;

  constructor() {
    const router = inject(Router);
    const titleService = inject(Title);

    // Close the mobile drawer and update the document title whenever navigation completes.
    router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe(() => {
        this.drawerOpen.set(false);
        const routeData = router.routerState.snapshot.root.firstChild?.data;
        const pageTitle = routeData?.['title'] as string | undefined;
        titleService.setTitle(
          pageTitle ? `${pageTitle} | ngx-vest-forms` : 'ngx-vest-forms Examples'
        );
      });

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

  protected toggleSidebar(): void {
    const next = !this.sidebarCollapsed();
    this.sidebarCollapsed.set(next);
    globalThis.localStorage?.setItem('sidebar-collapsed', String(next));
  }
}
