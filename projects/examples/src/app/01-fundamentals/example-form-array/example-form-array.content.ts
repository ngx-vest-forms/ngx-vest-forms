/**
 * Shared configuration and content for the Form Arrays example
 * Demonstrates dynamic array management with ngx-vest-forms
 */

export const FORM_ARRAY_CONTENT = {
  demonstrated: {
    icon: '📝',
    title: 'Dynamic Array Management',
    sections: [
      {
        title: 'Array Operations',
        items: [
          '• <strong>Add items:</strong> <code class="code-inline">array.push(item)</code>',
          '• <strong>Remove items:</strong> <code class="code-inline">array.remove(index)</code>',
          '• <strong>Move items:</strong> <code class="code-inline">array.move(from, to)</code>',
          '• <strong>Insert items:</strong> <code class="code-inline">array.insert(index, item)</code>',
          '• <strong>Access items:</strong> <code class="code-inline">array.at(index)</code> returns field',
        ],
      },
      {
        title: 'Array Validation',
        items: [
          '• <strong>Item-level validation:</strong> Each array item validated independently',
          '• <strong>Array-level validation:</strong> Validate the array itself (min/max length)',
          '• <strong>Aggregate validity:</strong> <code class="code-inline">array.valid()</code> checks all items',
          '• <strong>Error tracking:</strong> <code class="code-inline">array.errors()</code> for array-level errors',
          '• <strong>Real-time feedback:</strong> Validation runs on add/remove/move operations',
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
          '• <strong>Type-safe:</strong> Full TypeScript support for array items',
          '• <strong>Reactive:</strong> Signals update automatically on array changes',
          '• <strong>Vest integration:</strong> Array mutations trigger validation',
          '• <strong>Performance:</strong> Efficient re-validation only for affected items',
        ],
      },
      {
        title: 'Implementation Pattern',
        items: [
          '• <strong>Create array:</strong> <code class="code-inline">form.array("path")</code>',
          '• <strong>Array state:</strong> <code class="code-inline">array.items()</code>, <code class="code-inline">array.length()</code>',
          '• <strong>Item access:</strong> <code class="code-inline">array.at(index).value()</code>',
          '• <strong>Validation:</strong> Suite handles both array and item validation',
          '• <strong>Cleanup:</strong> No manual subscription management needed',
        ],
      },
      {
        title: 'Next Steps',
        items: [
          '• Explore <strong>nested forms</strong> for complex object validation',
          '• Learn <strong>async validation</strong> for server-side checks',
          '• Discover <strong>form composition</strong> for multi-step forms',
          '• Check out <strong>error strategies</strong> for different UX patterns',
        ],
      },
    ],
    nextStep: {
      text: 'Ready to handle multi-section forms with nested objects?',
      link: '/fundamentals/nested-forms',
      linkText: 'Explore Nested Forms →',
    },
  },
};
