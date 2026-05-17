import { defineExampleContent } from '../../shared/example-content';

export const accessibleWrapperContent = defineExampleContent({
  demonstrates: {
    icon: '♿',
    title: 'What this demonstrates',
    points: [
      'FormErrorControlDirective gives custom wrappers the same error/warning/pending IDs and ARIA helpers as the built-in wrappers.',
      'ariaAssociationMode="single-control" merges generated error IDs into one existing aria-describedby chain automatically.',
      'ariaAssociationMode="none" lets multi-control wrappers opt out of automatic stamping and wire the relevant input manually.',
      'Inline error regions stay in the DOM with stable IDs, so manual aria-describedby wiring remains predictable.',
    ],
  },
  learn: {
    title: "What you'll learn",
    sections: [
      {
        title: 'Directive-based wrapper ergonomics',
        points: [
          'Use ngxErrorControl when you need custom markup but still want packaged state and generated region IDs.',
          'Pick ariaAssociationMode based on how many actual form controls live inside the wrapper.',
          'Keep hints in aria-describedby and let the directive merge its own IDs when appropriate.',
        ],
      },
      {
        title: 'Manual ARIA ownership',
        points: [
          'For mixed wrappers (for example an input plus a button), wire aria-describedby and aria-invalid only to the real form control.',
          'Do not leak validation state onto adjacent helper buttons or static content.',
        ],
      },
    ],
    nextStep: { label: 'Next: Custom controls', route: 'custom-controls' },
  },
});
