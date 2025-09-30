/**
 * Shared configuration and content for the Nested Forms example
 * Demonstrates multi-section forms with nested object validation
 */

export const NESTED_FORM_CONTENT = {
  demonstrated: {
    icon: '🏗️',
    title: 'Nested Object Validation',
    sections: [
      {
        title: 'Multi-Section Form',
        items: [
          '• <strong>Personal Info:</strong> firstName, lastName, email',
          '• <strong>Address Info:</strong> street, city, zipCode, country',
          '• <strong>Preferences:</strong> newsletter, notifications',
          '• <strong>Path-based access:</strong> <code class="code-inline">form.personalInfoEmail()</code>',
          '• <strong>Nested validation:</strong> Each section validated independently',
        ],
      },
      {
        title: 'Enhanced Field Signals',
        items: [
          '• <strong>Dot-path fields:</strong> <code class="code-inline">form.addressInfoStreet()</code>',
          '• <strong>Automatic camelCase:</strong> <code class="code-inline">personalInfo.email</code> → <code class="code-inline">personalInfoEmail()</code>',
          '• <strong>Field setters:</strong> <code class="code-inline">form.setPersonalInfoEmail($event)</code>',
          '• <strong>Validation state:</strong> <code class="code-inline">form.personalInfoEmailValid()</code>',
          '• <strong>Error tracking:</strong> <code class="code-inline">form.personalInfoEmailErrors()</code>',
        ],
      },
    ],
  },
  learning: {
    title: 'Learning Journey & Next Steps',
    sections: [
      {
        title: 'Key Benefits',
        items: [
          '• <strong>Type-safe paths:</strong> Full TypeScript support for nested fields',
          '• <strong>Auto-generated signals:</strong> No manual field creation needed',
          '• <strong>Flexible structure:</strong> Any nesting level supported',
          '• <strong>Independent validation:</strong> Validate sections or entire form',
        ],
      },
      {
        title: 'Implementation Pattern',
        items: [
          '• <strong>Model structure:</strong> Nested TypeScript interfaces',
          '• <strong>Validation suite:</strong> Test nested paths like <code class="code-inline">"personalInfo.email"</code>',
          '• <strong>Field binding:</strong> Use flattened signals <code class="code-inline">personalInfoEmail()</code>',
          '• <strong>Error display:</strong> <code class="code-inline">form.fieldShowErrors()</code> works at any depth',
          '• <strong>Form state:</strong> Overall validity reflects all nested fields',
        ],
      },
      {
        title: 'Next Steps',
        items: [
          '• Explore <strong>form composition</strong> for multi-step wizards',
          '• Learn <strong>async validation</strong> for server-side checks',
          '• Check out <strong>error strategies</strong> for different UX patterns',
          '• Discover <strong>cross-field validation</strong> for dependent fields',
        ],
      },
    ],
    nextStep: {
      text: 'Ready to compose multiple forms into wizards?',
      link: '/advanced-patterns/multi-step-wizard',
      linkText: 'Explore Multi-Step Wizards →',
    },
  },
};
