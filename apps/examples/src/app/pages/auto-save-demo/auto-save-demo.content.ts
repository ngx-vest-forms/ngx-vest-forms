import { defineExampleContent } from '../../shared/example-content';

export const autoSaveContent = defineExampleContent({
  demonstrates: {
    icon: '💾',
    title: 'What this demonstrates',
    points: [
      'Drafts auto-save when a changed field blurs, driven by the (fieldBlurred) NgxFieldBlurEvent payload (field, formValue, dirty).',
      'Draft persistence is decoupled from final validation: a draft can save even while the form is invalid.',
      'A serialized draft key dedupes saves so an unchanged blur or an already-queued draft is not re-sent.',
      'A generation counter dropped stale in-flight saves on Reset so a clear cannot be overwritten by a queued save.',
      'Dependent-pair validation: quantity ↔ quantityJustification are bidirectionally required, while untouched dependents stay visually quiet until their own blur.',
      'Conditional validation: email is only required when preferredContactMethod is "email".',
      'Non-blocking warnings: a short notes value warns without blocking the draft save.',
      'Restore-on-load: a previous draft is rehydrated from sessionStorage; project name "fail" simulates a save failure with retry.',
    ],
  },
  learn: {
    title: "What you'll learn",
    sections: [
      {
        title: 'Blur-driven persistence',
        points: [
          'Use NgxFieldBlurEvent to react to per-field blur with the current value and dirty flag.',
          'Separate "save a draft" from "submit a valid form" so persistence never implies validity.',
          'Queue and serialize saves with concatMap so blur storms collapse into ordered writes.',
        ],
      },
      {
        title: 'Coordinated validation',
        points: [
          'Wire bidirectional and whenChanged dependencies with createValidationConfig.',
          'Keep dependent errors calm: only revalidate the partner field, not the whole form.',
          'Model warnings with Vest warn() so they inform without blocking save or submit.',
        ],
      },
      {
        title: 'Resilient draft lifecycle',
        points: [
          'Use a generation counter to discard saves queued before a Reset.',
          'Dedupe writes with a stable serialized draft key.',
          'Rehydrate and surface restored drafts from sessionStorage on load.',
        ],
      },
    ],
    nextStep: { label: 'Next: Multi-form wizard', route: 'wizard' },
  },
});
