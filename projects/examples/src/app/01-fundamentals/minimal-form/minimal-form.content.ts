/**
 * Shared configuration and content for the Minimal Form example
 * Used by ExampleCardsComponent to maintain consistent educational content
 */

export const MINIMAL_FORM_CONTENT = {
  demonstrated: {
    icon: '🏁',
    title: 'Minimal Vest.js-first Setup',
    sections: [
      {
        title: 'V2 Core Features',
        items: [
          '• <strong>Form factory:</strong> <code class="code-inline">createVestForm()</code>',
          '• <strong>Enhanced Field Signals:</strong> <code class="code-inline">form.email()</code>, <code class="code-inline">form.emailValid()</code>',
          '• <strong>Native HTML:</strong> <code class="code-inline">[value]</code> and <code class="code-inline">(input)</code> bindings',
          '• <strong>No directives:</strong> Pure Vest.js + Angular signals',
          '• <strong>Type safety:</strong> Full TypeScript support with path-based typing',
        ],
      },
      {
        title: 'Validation Rules Showcased',
        items: [
          '• <strong>Required field:</strong> Email cannot be empty',
          '• <strong>Email format:</strong> Must be valid email address',
          '• <strong>Real-time validation:</strong> Immediate feedback on input',
          '• <strong>Form state tracking:</strong> Submit button responds to validation state',
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
          '• <strong>Zero boilerplate:</strong> No FormControl, FormGroup, or directives needed',
          '• <strong>Type safety:</strong> Path-based field access with full TypeScript support',
          '• <strong>Native HTML:</strong> Works with standard HTML form elements',
          '• <strong>Performance:</strong> Enhanced Field Signals API with proxy-based field access',
        ],
      },
      {
        title: 'Implementation Pattern',
        items: [
          '• <strong>Form creation:</strong> <code class="code-inline">createVestForm(model, { suite })</code> factory',
          '• <strong>Validation suite:</strong> <code class="code-inline">staticSuite()</code> with Vest.js rules',
          '• <strong>Field binding:</strong> <code class="code-inline">[value]="form.field()"</code> + <code class="code-inline">(input)="form.setField($event)"</code>',
          '• <strong>Error display:</strong> <code class="code-inline">form.fieldShowErrors()</code> + <code class="code-inline">form.fieldErrors()</code>',
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
