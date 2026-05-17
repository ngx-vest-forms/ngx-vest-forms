import type { Type } from '@angular/core';
import type { Routes } from '@angular/router';

/**
 * Single source of truth for the Examples App shell.
 *
 * Routes, nav labels, category placement, ordering, and page header copy all
 * live here. The router config ({@link toAppRoutes}) and the categorized nav
 * ({@link buildNavGroups}) are both derived from {@link EXAMPLE_ROUTES} — so
 * adding or re-grouping a demo is a data change in this file, never a template
 * change in the shell.
 */

/**
 * Curated taxonomy for ngx-vest-forms — intentionally curated for this
 * library, not a mirror of any other demo app's taxonomy. Array order is the
 * order categories appear in the nav.
 */
export const EXAMPLE_CATEGORIES = [
  'Getting Started',
  'Validation',
  'Schema',
  'Composition',
  'Controls',
  'Patterns',
] as const;

export type ExampleCategory = (typeof EXAMPLE_CATEGORIES)[number];

/** Optional nav badge. `start-here` marks the canonical onboarding demo. */
export type ExampleBadge = 'start-here' | 'new';

/** One demo's placement and metadata in the shell. */
export type ExampleRouteMeta = {
  /** Router path segment, e.g. `'starter'`. */
  readonly path: string;
  /** Short label shown in the categorized nav. */
  readonly label: string;
  /** Page `<h1>` rendered via `ngx-page-title`. */
  readonly title: string;
  /** Page subtitle rendered via `ngx-page-title`. */
  readonly subtitle: string;
  /** Category bucket in the nav. */
  readonly category: ExampleCategory;
  /** Sort order within the category (ascending). */
  readonly order: number;
  /** Optional nav badge. */
  readonly badge?: ExampleBadge;
  /** Lazy component loader for the router. */
  readonly loadComponent: () => Promise<Type<unknown>>;
}

/**
 * The curated demo catalog. Keep it intentionally lean — each entry must earn
 * its place. New first-wave demos are appended here as they land so the nav,
 * router, and default route stay in sync from one place.
 */
export const EXAMPLE_ROUTES: readonly ExampleRouteMeta[] = [
  // ── Getting Started ───────────────────────────────────────────────────────
  {
    path: 'starter',
    label: 'Starter Contact Form',
    title: 'Starter Contact Form',
    subtitle:
      'The canonical ngx-vest-forms setup — copy this as a trustworthy baseline.',
    category: 'Getting Started',
    order: 1,
    badge: 'start-here',
    loadComponent: () =>
      import('../pages/starter-form/starter.page').then(
        (m) => m.StarterPageComponent
      ),
  },

  // ── Validation ────────────────────────────────────────────────────────────
  {
    path: 'validation-config-demo',
    label: 'Validation Config',
    title: 'Validation Config Demo',
    subtitle:
      'Explore dependency-aware revalidation patterns with a single configuration map.',
    category: 'Validation',
    order: 1,
    loadComponent: () =>
      import(
        '../pages/validation-config-demo/validation-config-demo.page'
      ).then((m) => m.ValidationConfigDemoPageComponent),
  },
  {
    path: 'display-modes-demo',
    label: 'Display Modes',
    title: 'Display Modes Demo',
    subtitle:
      'Compare error and warning visibility timing across display modes.',
    category: 'Validation',
    order: 2,
    loadComponent: () =>
      import('../pages/display-modes-demo/display-modes-demo.page').then(
        (m) => m.DisplayModesDemoPageComponent
      ),
  },
  {
    path: 'business-hours',
    label: 'Business Hours',
    title: 'Business Hours Form',
    subtitle:
      'Validate dynamic time ranges with cross-field and form-level rules.',
    category: 'Validation',
    order: 3,
    loadComponent: () =>
      import('../pages/business-hours-form/business-hours.page').then(
        (m) => m.BusinessHoursPageComponent
      ),
  },
  {
    path: 'async-username',
    label: 'Async Username',
    title: 'Async Username Availability',
    subtitle:
      'Validate a username against a mock remote endpoint with calm pending, success, and failure states.',
    category: 'Validation',
    order: 4,
    badge: 'new',
    loadComponent: () =>
      import('../pages/async-username-form/async-username.page').then(
        (m) => m.AsyncUsernamePageComponent
      ),
  },
  {
    path: 'business-policy',
    label: 'Business Policy',
    title: 'Vest-First Business Policy',
    subtitle:
      'Conditional rules and advisory warnings that stay native to Vest — guidance modelled separately from errors.',
    category: 'Validation',
    order: 5,
    badge: 'new',
    loadComponent: () =>
      import('../pages/business-policy-form/business-policy.page').then(
        (m) => m.BusinessPolicyPageComponent
      ),
  },

  // ── Schema ────────────────────────────────────────────────────────────────
  {
    path: 'native-schema-demo',
    label: 'Native Vest Schema',
    title: 'Native Vest Schema Demo',
    subtitle:
      'Use create(..., enforce.shape(...)) for built-in schema validation alongside field-level business rules.',
    category: 'Schema',
    order: 1,
    loadComponent: () =>
      import('../pages/native-schema-demo/native-schema-demo.page').then(
        (m) => m.NativeSchemaDemoPageComponent
      ),
  },
  {
    path: 'zod-schema-demo',
    label: 'Zod Schema',
    title: 'Zod Schema Demo',
    subtitle:
      'Combine a Zod schema alongside Vest per-field business rules in one example flow.',
    category: 'Schema',
    order: 2,
    loadComponent: () =>
      import('../pages/zod-schema-demo/zod-schema-demo.page').then(
        (m) => m.ZodSchemaDemoPageComponent
      ),
  },

  // ── Composition ───────────────────────────────────────────────────────────
  {
    path: 'date-range-adapter',
    label: 'Composite Adapter',
    title: 'Composite Adapter Recipe',
    subtitle:
      'Map one composite UI control to multiple form fields with split-field validation.',
    category: 'Composition',
    order: 1,
    loadComponent: () =>
      import('../pages/date-range-adapter/travel.page').then(
        (m) => m.TravelPageComponent
      ),
  },
  {
    path: 'complex-nested',
    label: 'Complex Nested & Repeatable',
    title: 'Complex Nested & Repeatable Form',
    subtitle:
      'Nested ngModelGroup sections and dynamic add/remove rows composed from reusable child components.',
    category: 'Composition',
    order: 2,
    badge: 'new',
    loadComponent: () =>
      import('../pages/complex-nested-form/complex-nested.page').then(
        (m) => m.ComplexNestedPageComponent
      ),
  },

  // ── Controls ──────────────────────────────────────────────────────────────
  {
    path: 'custom-controls',
    label: 'Custom Controls',
    title: 'Custom Controls (ControlValueAccessor)',
    subtitle:
      'A non-native control participating in validation, warnings, touched state, and submission.',
    category: 'Controls',
    order: 1,
    badge: 'new',
    loadComponent: () =>
      import('../pages/custom-controls-form/custom-controls.page').then(
        (m) => m.CustomControlsPageComponent
      ),
  },

  // ── Patterns ──────────────────────────────────────────────────────────────
  {
    path: 'purchase',
    label: 'Purchase Checkout',
    title: 'Purchase Form',
    subtitle:
      'Complete a full checkout flow with conditional and cross-field validation.',
    category: 'Patterns',
    order: 1,
    loadComponent: () =>
      import('../pages/purchase-form/purchase.page').then(
        (m) => m.PurchasePageComponent
      ),
  },
  {
    path: 'submission-patterns',
    label: 'Submission Patterns',
    title: 'Submission Patterns',
    subtitle:
      'Submit-time invalid handling, server-error messaging, success state, and retry — modelled distinctly.',
    category: 'Patterns',
    order: 2,
    badge: 'new',
    loadComponent: () =>
      import('../pages/submission-patterns-form/submission-patterns.page').then(
        (m) => m.SubmissionPatternsPageComponent
      ),
  },
  {
    path: 'auto-save-demo',
    label: 'Auto-Save Draft',
    title: 'Auto-Save Draft Demo',
    subtitle:
      'Persist draft changes on blur while keeping validation and final submission separate.',
    category: 'Patterns',
    order: 3,
    loadComponent: () =>
      import('../pages/auto-save-demo/auto-save-demo.page').then(
        (m) => m.AutoSaveDemoPageComponent
      ),
  },
  {
    path: 'wizard',
    label: 'Multi-Form Wizard',
    title: 'Multi-Form Wizard',
    subtitle:
      'Run three coordinated forms with per-step validation and one final submission flow.',
    category: 'Patterns',
    order: 4,
    loadComponent: () =>
      import('../pages/wizard-form/wizard-form.page').then(
        (m) => m.WizardFormPageComponent
      ),
  },
];

/** A nav category plus its demos, ready for the shell template. */
export type NavGroup = {
  readonly category: ExampleCategory;
  readonly items: readonly ExampleRouteMeta[];
}

/** Demos sorted by category order, then by intra-category `order`. */
function sortedRoutes(): ExampleRouteMeta[] {
  return [...EXAMPLE_ROUTES].sort((a, b) => {
    const byCategory =
      EXAMPLE_CATEGORIES.indexOf(a.category) -
      EXAMPLE_CATEGORIES.indexOf(b.category);
    return byCategory !== 0 ? byCategory : a.order - b.order;
  });
}

/**
 * The canonical onboarding demo: the `start-here` badge if present, otherwise
 * the first demo in catalog order. Drives the app's default redirect.
 */
export function defaultRoutePath(): string {
  const sorted = sortedRoutes();
  const startHere = sorted.find((route) => route.badge === 'start-here');
  return startHere?.path ?? sorted[0]?.path ?? '';
}

/** Build the categorized nav structure consumed by the shell. */
export function buildNavGroups(): NavGroup[] {
  const sorted = sortedRoutes();
  return EXAMPLE_CATEGORIES.map((category) => ({
    category,
    items: sorted.filter((route) => route.category === category),
  })).filter((group) => group.items.length > 0);
}

/** Map the metadata catalog into Angular router config. */
export function toAppRoutes(): Routes {
  return [
    {
      path: '',
      redirectTo: defaultRoutePath(),
      pathMatch: 'full',
    },
    ...EXAMPLE_ROUTES.map((route) => ({
      path: route.path,
      loadComponent: route.loadComponent,
      data: { title: route.title, subtitle: route.subtitle },
    })),
    {
      path: '**',
      redirectTo: defaultRoutePath(),
    },
  ];
}
