/**
 * Content configuration for the Form Field Showcase example.
 *
 * This example demonstrates the NgxVestFormField wrapper component
 * which provides automatic error display and consistent layout.
 */

export const FORM_FIELD_SHOWCASE_CONTENT = {
  demonstrated: {
    icon: '🎁',
    title: 'NgxVestFormField Wrapper Features',
    sections: [
      {
        title: 'Core Capabilities',
        items: [
          '• <strong>Automatic error display:</strong> No manual <code class="code-inline">&lt;ngx-form-error&gt;</code> components needed',
          '• <strong>Multiple field types:</strong> Text, email, URL, number, textarea, select, checkbox',
          '• <strong>Consistent layout:</strong> Standardized spacing via CSS custom properties',
          '• <strong>Clean markup:</strong> Reduced boilerplate and cleaner templates',
        ],
      },
      {
        title: 'Enhanced Developer Experience',
        items: [
          '• <strong>Optional validation:</strong> Works with or without <code class="code-inline">[field]</code> input',
          '• <strong>Accessibility:</strong> Maintains proper label/input associations and ARIA attributes',
          '• <strong>Error strategies:</strong> Compatible with immediate, on-touch, on-submit, and manual modes',
          '• <strong>Themeable:</strong> Override CSS custom properties to match your design system',
        ],
      },
    ],
  },

  learning: {
    title: 'Learning Journey & Next Steps',
    sections: [
      {
        title: 'Wrapper Benefits',
        items: [
          '• <strong>DRY principle:</strong> Write error display logic once, reuse everywhere',
          '• <strong>Consistency:</strong> Ensures uniform error display across your app',
          '• <strong>Maintainability:</strong> Update error styling in one place',
          '• <strong>Type-safe:</strong> Full TypeScript support with field signals',
        ],
      },
      {
        title: 'Usage Patterns',
        items: [
          '• <strong>Basic usage:</strong> Wrap inputs with <code class="code-inline">&lt;ngx-vest-form-field&gt;</code>',
          '• <strong>With validation:</strong> Pass <code class="code-inline">[field]="form.nameField()"</code> for automatic errors',
          '• <strong>Without validation:</strong> Use wrapper for layout consistency only',
          '• <strong>Custom styling:</strong> Override CSS properties for brand alignment',
        ],
      },
    ],
    nextStep: {
      text: 'Compare with manual error display patterns',
      link: '/fundamentals/basic-validation',
      linkText: 'View Basic Validation Example →',
    },
  },
} as const;
