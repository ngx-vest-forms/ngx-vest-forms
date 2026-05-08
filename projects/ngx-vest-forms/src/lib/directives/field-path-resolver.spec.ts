import {
  ControlValueAccessor,
  FormControl,
  FormGroup,
  NgForm,
  NgModel,
} from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { resolveFieldFromBlur } from './field-path-resolver';

function createNgForm(
  form: FormGroup,
  directives: NgModel[] = []
): NgForm & { _directives: Set<NgModel> } {
  return {
    form,
    _directives: new Set(directives),
  } as unknown as NgForm & { _directives: Set<NgModel> };
}

function createAccessor(element: HTMLElement): ControlValueAccessor {
  return {
    writeValue(): void {},
    registerOnChange(): void {},
    registerOnTouched(): void {},
    _elementRef: { nativeElement: element },
  } as unknown as ControlValueAccessor;
}

function createNgModel(
  path: string[],
  control: FormControl,
  element: HTMLElement
): NgModel {
  return {
    path,
    control,
    valueAccessor: createAccessor(element),
  } as unknown as NgModel;
}

describe('resolveFieldFromBlur', () => {
  it('returns null for non-Element targets', () => {
    const ngForm = createNgForm(
      new FormGroup({ projectName: new FormControl('') })
    );

    expect(resolveFieldFromBlur(ngForm, null)).toBeNull();
  });

  it('returns null for elements without a name attribute', () => {
    const ngForm = createNgForm(
      new FormGroup({ projectName: new FormControl('') })
    );
    const form = document.createElement('form');
    const input = document.createElement('input');

    form.append(input);

    expect(resolveFieldFromBlur(ngForm, input)).toBeNull();
  });

  it('resolves via the NgModel-directive strategy', () => {
    const control = new FormControl('hunter2');
    const form = document.createElement('form');
    const input = document.createElement('input');
    input.name = 'password';
    form.append(input);
    const ngForm = createNgForm(
      new FormGroup({
        passwords: new FormGroup({
          password: control,
        }),
      }),
      [createNgModel(['passwords', 'password'], control, input)]
    );

    expect(resolveFieldFromBlur(ngForm, input)).toEqual({
      field: 'passwords.password',
      control,
      element: input,
    });
  });

  it('returns null when the named element is not inside a <form>', () => {
    const control = new FormControl('hunter2');
    const input = document.createElement('input');
    input.name = 'password';
    const ngForm = createNgForm(
      new FormGroup({
        passwords: new FormGroup({
          password: control,
        }),
      }),
      [createNgModel(['passwords', 'password'], control, input)]
    );

    expect(resolveFieldFromBlur(ngForm, input)).toBeNull();
  });

  it('falls back to the static ngModelGroup attribute walk when directive lookup misses', () => {
    const control = new FormControl('hunter2');
    const form = document.createElement('form');
    const group = document.createElement('div');
    group.setAttribute('ngModelGroup', 'passwords');
    const input = document.createElement('input');
    input.name = 'password';
    group.append(input);
    form.append(group);

    const ngForm = createNgForm(
      new FormGroup({
        passwords: new FormGroup({
          password: control,
        }),
      })
    );

    expect(resolveFieldFromBlur(ngForm, input)).toEqual({
      field: 'passwords.password',
      control,
      element: input,
    });
  });

  it('falls back to the DOM-ancestor probe when the static attribute is absent', () => {
    const control = new FormControl('hunter2');
    const form = document.createElement('form');
    const group = document.createElement('div');
    const input = document.createElement('input');
    input.name = 'password';
    group.append(input);
    form.append(group);

    const ngForm = createNgForm(
      new FormGroup({
        passwords: new FormGroup({
          password: control,
        }),
      })
    );

    expect(resolveFieldFromBlur(ngForm, input)).toEqual({
      field: 'passwords.password',
      control,
      element: input,
    });
  });

  it('returns null when no strategy matches', () => {
    const form = document.createElement('form');
    const input = document.createElement('input');
    input.name = 'email';
    form.append(input);

    const ngForm = createNgForm(
      new FormGroup({
        passwords: new FormGroup({
          password: new FormControl(''),
        }),
      })
    );

    expect(resolveFieldFromBlur(ngForm, input)).toBeNull();
  });

  it('disambiguates repeated leaf names across siblings', () => {
    const control = new FormControl('2026-05-10');
    const form = document.createElement('form');
    const section = document.createElement('div');
    const from = document.createElement('div');
    from.setAttribute('ngModelGroup', 'from');
    const fromDay = document.createElement('input');
    fromDay.name = 'day';
    from.append(fromDay);
    const to = document.createElement('div');
    to.setAttribute('ngModelGroup', 'to');
    const toDay = document.createElement('input');
    toDay.name = 'day';
    to.append(toDay);
    section.append(from, to);
    form.append(section);

    const ngForm = createNgForm(
      new FormGroup({
        section: new FormGroup({
          from: new FormGroup({
            day: new FormControl(''),
          }),
          to: new FormGroup({
            day: control,
          }),
        }),
      })
    );

    expect(resolveFieldFromBlur(ngForm, toDay)).toEqual({
      field: 'section.to.day',
      control,
      element: toDay,
    });
  });
});
