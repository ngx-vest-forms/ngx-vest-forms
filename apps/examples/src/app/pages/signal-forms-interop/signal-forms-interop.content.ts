import { defineExampleContent } from '../../shared/example-content';

export const signalFormsInteropContent = defineExampleContent({
  demonstrates: {
    icon: '🔌',
    title: 'What this demonstrates',
    points: [
      'A seat stepper implementing FormValueControl<number> and a switch implementing FormCheckboxControl, both from @angular/forms/signals',
      'Both bound with plain [ngModel] inside ngx-control-wrapper inside an ngxVestForm, with no ControlValueAccessor and no NG_VALUE_ACCESSOR provider',
      'Per-field Vest validation, errors in the wrapper, aria-invalid and aria-describedby on the inner input and the switch button',
      'The touch output marking the field touched on blur, so errors appear on the usual on-blur timing',
      'A native checkbox disabling the stepper through ngModel; the disabled state reaches the control and the field drops out of the form value',
    ],
  },
  learn: {
    title: "What you'll learn",
    sections: [
      {
        title: 'The Signal Forms control contract',
        points: [
          'NgModel binds a value model (or a checked model for checkbox controls) when the host has no ControlValueAccessor',
          'It listens to a touch output for touched state, and writes disabled, invalid, touched and similar inputs when the control declares them',
          'Do not reuse contract input names such as name, required, min or max for other purposes',
        ],
      },
      {
        title: 'Accessibility with ngx-vest-forms',
        points: [
          'The wrapper finds native inputs and ARIA form-widget roles inside the control, so put the input or role on an element the wrapper can see',
          'Pass a label target id into the control so <label for> names the real input or switch',
          'First-invalid focus on a failed submit reaches the inner input or the switch without extra code',
        ],
      },
    ],
    nextStep: {
      label: 'Next: Accessible wrapper',
      route: 'accessible-wrapper',
    },
  },
});
