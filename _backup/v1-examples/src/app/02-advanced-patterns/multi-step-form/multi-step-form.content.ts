/**
 * Shared configuration and content for the Multi-Step Form example
 * Used by ExampleCardsComponent to maintain consistent educational content
 */

export const MULTI_STEP_FORM_CONTENT = {
  demonstrated: {
    icon: '🚀',
    title: 'Multi-Step Form with Vest.js Groups',
    sections: [
      {
        title: 'Advanced Vest.js Features',
        items: [
          '• <strong>Group validation:</strong> <code class="code-inline">group()</code> for step isolation',
          '• <strong>Conditional execution:</strong> <code class="code-inline">only.group(step)</code>',
          '• <strong>TypeScript generics:</strong> Type-safe field and group names',
          '• <strong>Performance optimization:</strong> Step-specific validation',
          '• <strong>Complex validation:</strong> Cross-step dependencies',
        ],
      },
      {
        title: 'Multi-Step Patterns',
        items: [
          '• <strong>Step validation:</strong> Real-time step completion feedback',
          '• <strong>Navigation control:</strong> Block invalid step transitions',
          '• <strong>Progress tracking:</strong> Visual step completion indicators',
          '• <strong>Final validation:</strong> All-step validation before submit',
          '• <strong>Async validation:</strong> Username availability per step',
        ],
      },
      {
        title: 'Form Structure',
        items: [
          '• <strong>Step 1:</strong> Personal info (name, date, email)',
          '• <strong>Step 2:</strong> Account setup (username, passwords)',
          '• <strong>Step 3:</strong> Profile & preferences (bio, website)',
          '• <strong>Validation:</strong> Each step has independent validation',
          '• <strong>Dependencies:</strong> Step 3 validates against Step 1 data',
        ],
      },
    ],
  },
  technical: {
    icon: '⚙️',
    title: 'Implementation Highlights',
    sections: [
      {
        title: 'Vest.js Group() Function',
        items: [
          '• Groups organize validation by logical sections',
          '• <code class="code-inline">only.group(currentStep)</code> validates only active step',
          '• Perfect for wizard-style forms and tabbed interfaces',
          '• Each group can have independent async validations',
          '• Groups can reference data from other groups',
        ],
      },
      {
        title: 'TypeScript Integration',
        items: [
          '• <code class="code-inline">FormSteps</code> union type for step names',
          '• Generic validation suite with typed parameters',
          '• Compile-time validation of step names and field paths',
          '• Type-safe step validation helper functions',
          '• Full IntelliSense support for validation rules',
        ],
      },
      {
        title: 'Performance Optimizations',
        items: [
          '• Step-specific validation prevents unnecessary checks',
          '• Async validations only run for active step',
          '• Memoization for expensive validation operations',
          '• Conditional validation based on step data',
          '• Smart re-validation on step changes',
        ],
      },
    ],
  },
  patterns: {
    icon: '📋',
    title: 'Real-World Applications',
    sections: [
      {
        title: 'Use Cases',
        items: [
          '• User registration workflows',
          '• Multi-page checkout processes',
          '• Survey and questionnaire forms',
          '• Application and onboarding flows',
          '• Configuration wizards',
        ],
      },
      {
        title: 'Business Benefits',
        items: [
          '• Improved user experience with guided flow',
          '• Better conversion rates with step-by-step validation',
          '• Reduced form abandonment with progress tracking',
          '• Clear error messaging per section',
          '• Mobile-friendly progressive disclosure',
        ],
      },
      {
        title: 'Technical Benefits',
        items: [
          '• Modular validation logic per step',
          '• Easy to add/remove/reorder steps',
          '• Independent testing per step',
          '• Scalable for complex multi-step flows',
          '• Maintainable code organization',
        ],
      },
    ],
  },
  learning: {
    title: 'Try These Validation Scenarios',
    sections: [
      {
        title: 'Step 1: Personal Information Tests',
        items: [
          '• <strong>Required fields:</strong> Leave firstName empty and move to next field',
          '• <strong>Length validation:</strong> Try "A" for firstName (too short)',
          '• <strong>Age validation:</strong> Enter birth date from this year (too young)',
          '• <strong>Email format:</strong> Try "invalid-email" format',
          '• <strong>Step completion:</strong> Fill all fields and see green checkmark',
        ],
      },
      {
        title: 'Step 2: Account Setup Tests',
        items: [
          '• <strong>Username taken:</strong> Try "admin", "user", "test", or "demo"',
          '• <strong>Username format:</strong> Try special characters (e.g., "user@123")',
          '• <strong>Password strength:</strong> Try "weak" vs "StrongPass123"',
          '• <strong>Password confirmation:</strong> Enter different passwords',
          '• <strong>Async validation:</strong> Watch loading state for username check',
        ],
      },
      {
        title: 'Step 3: Profile & Preferences Tests',
        items: [
          '• <strong>Optional bio:</strong> Enter 5 characters (too short if provided)',
          '• <strong>Website URL:</strong> Try "invalid-url" vs "https://example.com"',
          '• <strong>Required language:</strong> Leave dropdown empty',
          '• <strong>Terms agreement:</strong> Try submitting without checking terms',
          '• <strong>Step navigation:</strong> Go back to edit previous steps',
        ],
      },
      {
        title: 'Advanced Patterns to Explore',
        items: [
          '• <strong>Step validation:</strong> Try navigating to Step 2 with Step 1 incomplete',
          '• <strong>Cross-step validation:</strong> Notice how username affects all steps',
          '• <strong>Performance:</strong> Only current step validates (check browser dev tools)',
          "• <strong>Group isolation:</strong> Errors from Step 1 don't block Step 3 editing",
          '• <strong>Final submission:</strong> All steps must be valid to submit',
        ],
      },
    ],
    nextStep: {
      text: 'Ready to explore server-side validation?',
      link: '/advanced-patterns/server-side-validation',
      linkText: 'Server-Side Validation Patterns →',
    },
  },
};
