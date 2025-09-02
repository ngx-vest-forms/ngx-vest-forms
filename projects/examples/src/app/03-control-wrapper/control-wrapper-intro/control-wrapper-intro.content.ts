/**
 * Shared configuration and content for the Control Wrapper Introduction example
 * Used by ExampleCardsComponent to maintain consistent educational content
 */

export const CONTROL_WRAPPER_INTRO_CONTENT = {
  demonstrated: {
    icon: '🎯',
    title: 'Control Wrapper Automation',
    sections: [
      {
        title: 'ngx-vest-forms Features',
        items: [
          '• <strong>Form directive:</strong> <code class="code-inline">ngxVestForm</code>',
          '• <strong>Wrapper component:</strong> <code class="code-inline">&lt;ngx-control-wrapper&gt;</code>',
          '• <strong>Data binding:</strong> <code class="code-inline">[(formValue)]</code>',
          '• <strong>Validation suite:</strong> <code class="code-inline">[vestSuite]</code>',
          '• <strong>Auto error display:</strong> Built-in error handling and timing',
        ],
      },
      {
        title: 'Manual vs Wrapper Patterns',
        items: [
          '• <strong>Manual approach:</strong> <code class="code-inline">ngxFormErrorDisplay</code> + conditional rendering',
          '• <strong>Wrapper approach:</strong> Zero-config <code class="code-inline">&lt;ngx-control-wrapper&gt;</code>',
          '• <strong>Side-by-side demo:</strong> Same form, different implementation',
          '• <strong>Code comparison:</strong> ~70% template reduction with wrapper',
          '• <strong>Consistent behavior:</strong> Same validation, different UX automation',
        ],
      },
    ],
  },
  learning: {
    title: 'Learning Journey & Next Steps',
    sections: [
      {
        title: 'Implementation Patterns',
        items: [
          '• <strong>Manual pattern:</strong> <code class="code-inline">ngxFormErrorDisplay</code> with conditional rendering',
          '• <strong>Wrapper pattern:</strong> <code class="code-inline">&lt;ngx-control-wrapper&gt;</code> automation',
          '• <strong>Template reduction:</strong> ~70% less code for error handling',
          '• <strong>Consistent timing:</strong> Automatic error display mode following',
        ],
      },
      {
        title: 'Developer Experience Benefits',
        items: [
          '• <strong>Zero configuration:</strong> Works out of the box with any form control',
          '• <strong>Automatic detection:</strong> Finds controls and validation state automatically',
          '• <strong>Built-in accessibility:</strong> WCAG 2.2 compliance without extra effort',
          '• <strong>Team standardization:</strong> Consistent patterns across projects',
        ],
      },
    ],
    nextStep: {
      text: 'Ready to explore more advanced patterns?',
      link: '/advanced-forms',
      linkText: 'Advanced Forms →',
    },
  },
  keyBenefits: {
    icon: '💡',
    title: 'Key Benefits & Best Practices',
    sections: [
      {
        title: 'Automated Error Handling',
        items: [
          '• <strong>Zero configuration:</strong> <code class="code-inline">&lt;ngx-control-wrapper&gt;</code> works out of the box',
          '• <strong>Automatic detection:</strong> Finds form controls and validation state automatically',
          '• <strong>Consistent timing:</strong> Follows configured error display mode (blur, submit, etc.)',
          '• <strong>Built-in accessibility:</strong> Proper ARIA attributes and screen reader support',
          '• <strong>Reduced boilerplate:</strong> Eliminates repetitive error handling templates',
        ],
      },
      {
        title: 'Key Benefits Over Manual Approach',
        items: [
          '• <strong>Maintenance reduction:</strong> No more repetitive error display code',
          '• <strong>Consistency guarantee:</strong> Uniform error presentation across all forms',
          '• <strong>Accessibility built-in:</strong> WCAG 2.2 compliance without extra effort',
          '• <strong>Developer experience:</strong> Focus on validation logic, not error UI',
          '• <strong>Team standardization:</strong> Consistent patterns across team projects',
        ],
      },
    ],
  },
  implementation: {
    icon: '🛠️',
    title: 'Implementation Details',
    sections: [
      {
        title: 'Manual Error Display Pattern',
        items: [
          '• <strong>Error directive:</strong> <code class="code-inline">ngxFormErrorDisplay</code>',
          '• <strong>Conditional rendering:</strong> <code class="code-inline">@if (display.shouldShowErrors())</code>',
          '• <strong>Error iteration:</strong> <code class="code-inline">@for (error of display.errors())</code>',
          '• <strong>Manual timing:</strong> Developer controls when errors appear',
          '• <strong>Custom styling:</strong> Full control over error presentation',
        ],
      },
      {
        title: 'NgxControlWrapper Pattern',
        items: [
          '• <strong>Wrapper element:</strong> <code class="code-inline">&lt;ngx-control-wrapper&gt;</code>',
          '• <strong>Automatic detection:</strong> Finds form control automatically',
          '• <strong>Built-in timing:</strong> Follows configured error display mode',
          '• <strong>Consistent styling:</strong> Uses standardized error classes',
          '• <strong>Zero configuration:</strong> Works out of the box with any form control',
        ],
      },
      {
        title: 'Key Differences',
        items: [
          '• <strong>Template reduction:</strong> ~70% less template code for error handling',
          '• <strong>Consistency improvement:</strong> Eliminates copy-paste error patterns',
          '• <strong>Accessibility guarantee:</strong> No forgotten ARIA attributes',
          '• <strong>Maintenance simplification:</strong> Update error styling in one place',
          '• <strong>Testing benefits:</strong> Consistent selectors and behavior patterns',
        ],
      },
    ],
  },
  keyTakeaways: {
    icon: '💡',
    title: 'Key Takeaways',
    sections: [
      {
        title: 'Best Practices',
        items: [
          '• <strong>Start with manual:</strong> Understand the fundamentals first',
          '• <strong>Migrate gradually:</strong> Wrap one field at a time for safety',
          '• <strong>Keep validation unchanged:</strong> Business logic stays in Vest suites',
          '• <strong>Use for production:</strong> NgxControlWrapper reduces maintenance overhead',
          '• <strong>Accessibility focus:</strong> Wrapper ensures WCAG compliance automatically',
        ],
      },
      {
        title: 'When to Use Each Approach',
        items: [
          '• <strong>Manual:</strong> Learning, custom error layouts, special requirements',
          '• <strong>Wrapper:</strong> Production forms, consistent UX, reduced maintenance',
          '• <strong>Mixed approach:</strong> Use both in same form based on field needs',
          '• <strong>Team consistency:</strong> Standardize on wrapper for team projects',
          '• <strong>Migration path:</strong> Manual → wrapper as understanding grows',
        ],
      },
    ],
  },
};
