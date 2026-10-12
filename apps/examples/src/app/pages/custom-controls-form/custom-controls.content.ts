import { defineExampleContent } from '../../shared/example-content';

export const customControlsContent = defineExampleContent({
  demonstrates: {
    icon: '🎛️',
    title: 'What this demonstrates',
    points: [
      'Three non-native controls built on ControlValueAccessor: a star rating, a segmented selector, and an inline tag editor',
      'Each control registered via NG_VALUE_ACCESSOR (useExisting, multi:true) and bound with plain [ngModel]',
      'A custom control participates in a Vest suite — required, range, min-count errors and a non-blocking warning',
      'onTouched fired on blur so ngx-vest-forms tracks touched state and shows errors on time',
      'Full keyboard accessibility: radiogroup/radio roles, arrow/Home/End navigation, focus-visible styling',
    ],
  },
  learn: {
    title: "What you'll learn",
    sections: [
      {
        title: 'The CVA contract',
        points: [
          'Why writeValue/registerOnChange/registerOnTouched/setDisabledState is all ngx-vest-forms needs',
          'How NG_VALUE_ACCESSOR makes a custom widget indistinguishable from a native input to the form directive',
          'That the Vest suite never knows the value came from a non-native control — it stays a plain spec',
        ],
      },
      {
        title: 'Touched + accessibility',
        points: [
          'How onTouched → ngx-vest-forms blur tracking drives on-blur error display',
          'Wrapping custom controls in ngx-control-wrapper to render errors and warnings',
          'Building keyboard-operable, ARIA-correct widgets that still feel like the rest of the app',
        ],
      },
    ],
    nextStep: {
      label: 'Next: Submission patterns',
      route: 'submission-patterns',
    },
  },
});
