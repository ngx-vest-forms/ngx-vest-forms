/**
 * Educational content for the Server-Side Validation example.
 * Used by ExampleCardsComponent to maintain consistent educational content
 * structure across all ngx-vest-forms examples.
 */

export const SERVER_SIDE_VALIDATION_CONTENT = {
  demonstrated: {
    icon: '🌐',
    title: 'Server-Side Validation Integration',
    sections: [
      {
        title: 'Real-time Validation',
        items: [
          '<strong>Username availability</strong> - Live backend checks',
          '<strong>Email verification</strong> - Real-time domain validation',
          '<strong>Async debouncing</strong> - Performance-optimized requests',
          '<strong>Error handling</strong> - Network failure recovery',
        ],
      },
      {
        title: 'API Integration',
        items: [
          '<strong>Angular HttpClient</strong> - Type-safe API calls',
          '<strong>AbortSignal support</strong> - Request cancellation',
          '<strong>Response caching</strong> - Optimized validation requests',
          '<strong>Error state handling</strong> - User-friendly error messages',
        ],
      },
      {
        title: 'Advanced Patterns',
        items: [
          '<strong>Validation factories</strong> - Reusable async validators',
          '<strong>Signal integration</strong> - Reactive validation state',
          '<strong>Loading indicators</strong> - User experience optimization',
          '<strong>Retry mechanisms</strong> - Resilient validation logic',
        ],
      },
      {
        title: 'Production Features',
        items: [
          '<strong>API mocking</strong> - Development and testing support',
          '<strong>Rate limiting</strong> - Server-friendly validation patterns',
          '<strong>Offline fallbacks</strong> - Progressive enhancement',
          '<strong>Security headers</strong> - CSRF and authentication',
        ],
      },
    ],
  },
  learning: {
    title: 'Master Server-Side Validation',
    sections: [
      {
        title: 'Core Concepts',
        items: [
          'Understanding async validation with Vest.js',
          'Implementing AbortSignal for request cancellation',
          'Building reactive validation with Angular signals',
          'Handling loading and error states effectively',
        ],
      },
      {
        title: 'Implementation Skills',
        items: [
          'Creating reusable async validation factories',
          'Optimizing validation requests with debouncing',
          'Building user-friendly loading experiences',
          'Implementing proper error handling patterns',
        ],
      },
      {
        title: 'Architecture Patterns',
        items: [
          'Designing validation service layers',
          'Implementing caching strategies for validation',
          'Building offline-capable validation',
          'Creating validation middleware patterns',
        ],
      },
      {
        title: 'Production Considerations',
        items: [
          'Performance optimization for async validation',
          'Security best practices for validation APIs',
          'Testing async validation logic',
          'Monitoring and debugging validation requests',
        ],
      },
    ],
    nextStep: {
      text: 'Need dynamic forms? Explore',
      link: '/dynamic-arrays',
      linkText: 'Dynamic Array Forms →',
    },
  },
} as const;
