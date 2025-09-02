/**
 * Shared configuration and content for the Control Wrapper Introduction example
 * Used by ExampleCardsComponent to maintain consistent educational content
 */

export const CONTROL_WRAPPER_INTRO_CONTENT = {
  demonstrated: {
    icon: '🎯',
    title: 'NgxControlWrapper Introduction',
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
  learning: {
    icon: '📚',
    title: 'Learning Objectives',
    sections: [
      {
        title: 'NgxControlWrapper Mastery',
        items: [
          '• <strong>Wrapper fundamentals:</strong> How NgxControlWrapper automates error display',
          '• <strong>Manual vs. automated:</strong> Compare manual error handling with wrapper approach',
          '• <strong>Configuration understanding:</strong> Error display modes and timing options',
          '• <strong>Accessibility benefits:</strong> Built-in WCAG compliance and screen reader support',
          '• <strong>Integration patterns:</strong> Best practices for wrapper adoption in existing projects',
        ],
      },
      {
        title: 'Practical Applications',
        items: [
          '• <strong>Rapid prototyping:</strong> Quick form development with consistent error display',
          '• <strong>Production readiness:</strong> Enterprise-grade form validation patterns',
          '• <strong>Team collaboration:</strong> Standardized error handling across developers',
          '• <strong>Design system integration:</strong> Consistent styling and behavior patterns',
          '• <strong>Migration strategy:</strong> Moving from manual to automated error handling',
        ],
      },
    ],
    nextStep: {
      text: 'Ready to explore more advanced patterns? Try',
      link: '/async-validation-demo',
      linkText: 'Async Validation Demo →',
    },
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
