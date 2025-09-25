/**
 * Shared configuration and content for the Control Wrapper Introduction example
 * Used by ExampleCardsComponent to maintain consistent educational content
 */

export const CONTROL_WRAPPER_INTRO_CONTENT = {
  demonstrated: {
    icon: '🎯',
    title: 'NgxControlWrapper Features & Automation',
    sections: [
      {
        title: 'Core ngx-vest-forms Features',
        items: [
          '• <strong>Form directive:</strong> <code class="code-inline">ngxVestForm</code>',
          '• <strong>Wrapper component:</strong> <code class="code-inline">&lt;ngx-control-wrapper&gt;</code>',
          '• <strong>Data binding:</strong> <code class="code-inline">[(formValue)]</code>',
          '• <strong>Validation suite:</strong> <code class="code-inline">[vestSuite]</code>',
          '• <strong>Auto error display:</strong> Built-in error handling and timing',
          '• <strong>Warning system:</strong> Non-blocking progressive feedback with <code class="code-inline">warn()</code>',
        ],
      },
      {
        title: 'Key Benefits Over Manual Approach',
        items: [
          '• <strong>Maintenance reduction:</strong> No more repetitive error display code',
          '• <strong>Consistency guarantee:</strong> Uniform error presentation across all forms',
          '• <strong>Developer experience:</strong> Focus on validation logic, not error UI',
          '• <strong>Team standardization:</strong> Consistent patterns across team projects',
          '• <strong>Template reduction:</strong> ~70% less code for error handling',
        ],
      },
    ],
  },
  learning: {
    title: 'Developer Experience & Best Practices',
    sections: [
      {
        title: 'Warning System Features',
        items: [
          '• <strong>Progressive feedback:</strong> Non-blocking warnings for better UX',
          '• <strong>Display modes:</strong> <code class="code-inline">"on-change"</code> (180ms debounce while typing) or <code class="code-inline">"on-blur"</code> (conservative)',
          '• <strong>Email providers:</strong> Suggests professional domains (try gmail.com, yahoo.com)',
          '• <strong>Password strength:</strong> Tips for stronger security (try without special chars)',
          '• <strong>Opt-in control:</strong> <code class="code-inline">showWarnings</code> enables warnings selectively',
          '• <strong>Accessibility compliant:</strong> Uses <code class="code-inline">role="status"</code> for screen readers',
          '• <strong>Visual distinction:</strong> Different styling from errors (yellow vs red)',
        ],
      },
      {
        title: 'Automated Error Handling Benefits',
        items: [
          '• <strong>Zero configuration:</strong> <code class="code-inline">&lt;ngx-control-wrapper&gt;</code> works out of the box',
          '• <strong>Automatic detection:</strong> Finds form controls and validation state automatically',
          '• <strong>Consistent timing:</strong> Follows configured error display mode (blur, submit, etc.)',
          '• <strong>Built-in accessibility:</strong> Proper ARIA attributes and screen reader support',
          '• <strong>Reduced boilerplate:</strong> Eliminates repetitive error handling templates',
          '• <strong>Progressive warnings:</strong> Shows <code class="code-inline">warn()</code> messages with <code class="code-inline">role="status"</code>',
        ],
      },
    ],
    nextStep: {
      text: 'Ready to explore more advanced patterns?',
      link: '/advanced-forms',
      linkText: 'Advanced Forms →',
    },
  },
};
