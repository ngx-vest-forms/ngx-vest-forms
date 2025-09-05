/**
 * Shared configuration and content for the Minimal Form example
 * Used by ExampleCardsComponent to maintain consistent educational content
 */

export const MINIMAL_FORM_CONTENT = {
  demonstrated: {
    icon: '🏁',
    title: 'Minimal ngx-vest-forms Setup',
    sections: [
      {
        title: 'ngx-vest-forms Features',
        items: [
          '• <strong>Form directive:</strong> <code class="code-inline">ngxVestForm</code>',
          '• <strong>Validation binding:</strong> <code class="code-inline">[vestSuite]</code>',
          '• <strong>Two-way data:</strong> <code class="code-inline">[(formValue)]</code>',
          '• <strong>Error display:</strong> <code class="code-inline">ngxFormErrorDisplay</code>',
          '• <strong>Form state access:</strong> <code class="code-inline">#vestForm="ngxVestForm"</code>',
        ],
      },
      {
        title: 'Validation Rules Showcased',
        items: [
          '• <strong>Required field:</strong> Email cannot be empty',
          '• <strong>Email format:</strong> Must be valid email address',
          '• <strong>Real-time validation:</strong> Immediate feedback on blur',
          '• <strong>Form state tracking:</strong> Submit button disabled until valid',
        ],
      },
    ],
  },
  learning: {
    title: 'Learning Journey & Next Steps',
    sections: [
      {
        title: 'Key Benefits Demonstrated',
        items: [
          '• <strong>Zero boilerplate:</strong> No FormControl or FormGroup setup',
          '• <strong>Type safety:</strong> Full TypeScript support with signals',
          '• <strong>Template-driven:</strong> HTML-first approach with Angular forms',
          '• <strong>Accessibility:</strong> Built-in ARIA attributes and error handling',
        ],
      },
      {
        title: 'Implementation Pattern',
        items: [
          '• <strong>Model signal:</strong> <code class="code-inline">signal&lt;FormModel&gt;()</code> for reactive state',
          '• <strong>Validation suite:</strong> <code class="code-inline">staticSuite()</code> with Vest.js rules',
          '• <strong>Template binding:</strong> <code class="code-inline">[ngModel]</code> on form controls',
          '• <strong>Error timing:</strong> <code class="code-inline">shouldShowErrors()</code> for UX control',
        ],
      },
    ],
    nextStep: {
      text: 'Ready to add custom validation rules?',
      link: '/fundamentals/basic-validation',
      linkText: 'Try Basic Validation →',
    },
  },
} as const;
