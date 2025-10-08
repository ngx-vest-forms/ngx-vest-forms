import {
  AfterViewInit,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  signal,
  ViewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import {
  NavigationEnd,
  Router,
  RouterModule,
  RouterOutlet,
} from '@angular/router';
import { filter, map } from 'rxjs';
import { NgxThemeSwitcherComponent } from './ui/theme-switcher/theme-switcher.component';

@Component({
  selector: 'ngx-root',
  imports: [NgxThemeSwitcherComponent, RouterOutlet, RouterModule],
  templateUrl: './app.component.html',
})
export class AppComponent implements AfterViewInit {
  private router = inject(Router);
  private title = inject(Title);
  private destroyRef = inject(DestroyRef);

  @ViewChild('mainScroll') private mainScroll?: ElementRef<HTMLDivElement>;
  protected readonly scrolled = signal(false);

  protected readonly pageTitle = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.#currentRouteTitle()),
    ),
    { initialValue: this.#currentRouteTitle() },
  );

  #currentRouteTitle(): string {
    let route = this.router.routerState.root;
    while (route.firstChild) {
      route = route.firstChild;
    }
    return route.snapshot.title || 'Examples';
  }

  // Keep the browser tab title in sync with the current route title
  // eslint-disable-next-line no-unused-private-class-members -- allowed for effect()
  #syncTitle = effect(() => {
    const t = this.pageTitle();
    if (t) this.title.setTitle(t);
  });

  // Category + link metadata (single source of truth for sidebar + top nav labels if needed later)
  // Simplified categories to only include currently active examples
  // Other categories are temporarily hidden while examples are in backup
  private readonly categories = [
    {
      id: 'fundamentals',
      label: 'Fundamentals',
      pattern:
        /^\/fundamentals\/(minimal-form|basic-validation|error-display-modes|form-arrays|nested-forms)/,
      links: [
        { path: '/fundamentals/minimal-form', label: 'Minimal Form' },
        { path: '/fundamentals/basic-validation', label: 'Basic Validation' },
        {
          path: '/fundamentals/error-display-modes',
          label: 'Error Display Modes',
        },
        { path: '/fundamentals/form-arrays', label: 'Form Arrays' },
        { path: '/fundamentals/nested-forms', label: 'Nested Forms' },
      ],
    },
    {
      id: 'form-field',
      label: 'Form Field Wrapper',
      pattern: /^\/form-field\//,
      links: [
        {
          path: '/form-field/form-field-showcase',
          label: 'Form Field Showcase',
        },
      ],
    },
    {
      id: 'schemas',
      label: 'Schema Integration',
      pattern: /^\/schemas\//,
      links: [
        {
          path: '/schemas/zod-basic',
          label: 'Zod Basic',
        },
      ],
    },
    // {
    //   id: 'form-field',
    //   label: 'Control Wrapper',
    //   pattern: /^\/form-field\//,
    //   links: [
    //     {
    //       path: '/form-field/form-field-intro',
    //       label: 'Control Wrapper Introduction',
    //     },
    //   ],
    // },
    // {
    //   id: 'schema-integration',
    //   label: 'Schema Integration',
    //   pattern: /^\/schema-integration\//,
    //   links: [
    //     {
    //       path: '/schema-integration/schema-comparison',
    //       label: 'Schema Comparison',
    //     },
    //   ],
    // },
    // {
    //   id: 'advanced-patterns',
    //   label: 'Advanced Patterns',
    //   pattern: /^\/advanced-patterns\//,
    //   links: [
    //     {
    //       path: '/advanced-patterns/multi-step-form',
    //       label: 'Multi-Step Form',
    //     },
    //     {
    //       path: '/advanced-patterns/dynamic-arrays',
    //       label: 'Dynamic Arrays',
    //     },
    //   ],
    // },
    // TODO: Restore these categories as examples are moved back from _backup/
    // {
    //   id: 'core',
    //   label: 'Core Features',
    //   pattern: /^\/core\//,
    //   links: [
    //     // Will be restored from _backup/02-core-features/
    //   ],
    // },
    // {
    //   id: 'smart',
    //   label: 'Smart State',
    //   pattern: /^\/smart\//,
    //   links: [
    //     // Will be restored from _backup/05-smart-state/
    //   ],
    // },
  ] as const;

  protected readonly categoriesList = this.categories;

  protected readonly currentPath = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.router.url.split('?')[0]),
    ),
    { initialValue: this.router.url.split('?')[0] },
  );

  protected readonly currentCategory = computed(() => {
    const path = this.currentPath();
    return (
      this.categories.find((c) => c.pattern.test(path)) ?? this.categories[0]
    );
  });

  protected readonly currentCategoryLinks = computed(
    () => this.currentCategory().links,
  );

  ngAfterViewInit(): void {
    const element = this.mainScroll?.nativeElement;
    if (!element) return;

    let ticking = false;
    const update = () => {
      const run = () => {
        const isScrolled = element.scrollTop > 4;
        if (this.scrolled() !== isScrolled) this.scrolled.set(isScrolled);
        ticking = false;
      };
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(run);
      }
    };

    // Initial state
    update();

    // Scroll listener (passive for perf)
    element.addEventListener('scroll', update, { passive: true });

    // Clean up
    this.destroyRef.onDestroy(() =>
      element.removeEventListener('scroll', update),
    );
  }

  // Reset scroll position on navigation (after view init ensures element exists)
  // eslint-disable-next-line no-unused-private-class-members -- kept as reactive effect
  #resetScrollEffect = effect(() => {
    this.currentPath();
    queueMicrotask(() => {
      const element = this.mainScroll?.nativeElement;
      if (element) element.scrollTo({ top: 0 });
      // Also reset scrolled state
      if (this.scrolled()) this.scrolled.set(false);
    });
  });
  // ngOnDestroy not required: DestroyRef handles listener cleanup.
}
