import { defineExampleContent } from '../../shared/example-content';

export const travelContent = defineExampleContent({
  demonstrates: {
    icon: '🗓️',
    title: 'What this demonstrates',
    points: [
      'Mapping one composite date-range UI control to two flat model fields (departureDate + returnDate) with split-field validation',
      'Two switchable approaches: independent <ngx-control-wrapper> fields vs. a single composite adapter component',
      'Composite adapter fan-out using setValueAtPath to write the widget value back to separate model fields',
      'Hidden proxy [ngModel] fields registering departureDate and returnDate in the form tree for the adapter approach',
      'Bidirectional cross-field validation via createValidationConfig().bidirectional(departureDate, returnDate) so changing one date revalidates the other',
      'Manual on-blur-or-submit display gating and error/warning aggregation inside the adapter, since one wrapper cannot bind to multiple NgModels',
      'A non-blocking Vest warn() suggesting at least 3 days between dates, alongside blocking date-order errors',
    ],
  },
  learn: {
    title: "What you'll learn",
    sections: [
      {
        title: 'Composite control adapters',
        points: [
          'Why <ngx-control-wrapper> binds to a single NgModel, so a one-widget/many-fields control needs a custom adapter',
          'Fan a composite value out to flat model paths with setValueAtPath and re-emit the model',
          'Trigger validation after the hidden proxy [ngModel]s sync using afterNextRender + triggerFormValidation',
        ],
      },
      {
        title: 'Split-field cross validation',
        points: [
          'Wire interdependent fields with createValidationConfig().bidirectional() so each date change re-runs the other',
          'Use omitWhen + warn() in the Vest suite for conditional ordering errors and soft advance-notice warnings',
        ],
      },
      {
        title: 'Accessible custom widgets',
        points: [
          'Reproduce the library’s on-blur-or-submit display mode and aria-describedby wiring by hand when no wrapper applies',
        ],
      },
    ],
    nextStep: { label: 'Next: Complex nested form', route: 'complex-nested' },
  },
});
