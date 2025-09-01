/**
 * Shared configuration and content for the Basic Validation example
 * Used by ExampleCardsComponent to maintain consistent educational content
 */

export const BASIC_VALIDATION_CONTENT = {
  demonstrated: {
    icon: '✅',
    title: 'Form Validation Essentials',
    sections: [
      {
        title: 'ngx-vest-forms Features',
        items: [
          '• <strong>Form directive:</strong> <code class="code-inline">ngxVestForm</code>',
          '• <strong>Validation suite:</strong> <code class="code-inline">[vestSuite]</code>',
          '• <strong>Data binding:</strong> <code class="code-inline">[(formValue)]</code>',
          '• <strong>Error display:</strong> <code class="code-inline">ngxFormErrorDisplay</code>',
          '• <strong>State access:</strong> <code class="code-inline">#vestForm="ngxVestForm"</code>',
        ],
      },
      {
        title: 'Validation Rules Showcased',
        items: [
          '• <strong>Required fields:</strong> Name, email, age, role, terms',
          '• <strong>Format validation:</strong> Email pattern matching',
          '• <strong>Range validation:</strong> Age between 18-100',
          '• <strong>Conditional fields:</strong> Bio appears for senior roles',
          '• <strong>Boolean validation:</strong> Terms agreement required',
        ],
      },
    ],
  },
  learning: {
    title: 'Learning Journey & Next Steps',
    sections: [
      {
        title: 'Vest.js Validation Patterns',
        items: [
          '• <strong>Test functions:</strong> <code class="code-inline">test()</code> for field validation',
          '• <strong>Enforce constraints:</strong> <code class="code-inline">enforce().isNotEmpty()</code>',
          '• <strong>Performance:</strong> <code class="code-inline">only(field)</code> optimization',
          '• <strong>Conditional logic:</strong> <code class="code-inline">omitWhen()</code> for dynamic rules',
        ],
      },
      {
        title: 'UX Best Practices',
        items: [
          '• <strong>Progressive disclosure:</strong> Show errors after user interaction',
          '• <strong>Accessibility:</strong> ARIA attributes and screen reader support',
          '• <strong>Clear messaging:</strong> User-friendly error descriptions',
          '• <strong>Visual feedback:</strong> Form state and submit button management',
        ],
      },
    ],
    nextStep: {
      text: 'Want to control when errors appear?',
      link: '/fundamentals/error-display-modes',
      linkText: 'Explore Error Display Modes →',
    },
  },
} as const;
