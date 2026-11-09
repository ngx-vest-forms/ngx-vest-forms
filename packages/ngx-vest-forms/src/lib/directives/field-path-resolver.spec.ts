import {
  FormArray,
  FormControl,
  FormGroup,
  NgForm,
  NgModel,
  NgModelGroup,
} from '@angular/forms';
import { describe, expect, it } from 'vitest';
import {
  registerControlElement,
  registerGroupElement,
} from './field-element-registry';
import {
  readElementValueForBlur,
  resolveFieldFromBlur,
} from './field-path-resolver';

function createNgForm(form: FormGroup): NgForm {
  return { form } as unknown as NgForm;
}

function registerNgModel(
  ngForm: NgForm,
  path: string[],
  control: FormControl,
  element: HTMLElement
): void {
  registerControlElement(ngForm, element, {
    path,
    control,
    options: undefined,
    formDirective: ngForm,
  } as unknown as NgModel);
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

  it('resolves via the registered ngModel host element', () => {
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
      })
    );
    registerNgModel(ngForm, ['passwords', 'password'], control, input);

    expect(resolveFieldFromBlur(ngForm, input)).toEqual({
      field: 'passwords.password',
      control,
      element: input,
    });
  });

  it('resolves an inner element of a custom control to its ngModel host', () => {
    const control = new FormControl('');
    const form = document.createElement('form');
    const host = document.createElement('app-date-picker');
    const inner = document.createElement('input');
    host.append(inner);
    form.append(host);
    const ngForm = createNgForm(new FormGroup({ startDate: control }));
    registerNgModel(ngForm, ['startDate'], control, host);

    expect(resolveFieldFromBlur(ngForm, inner)).toEqual({
      field: 'startDate',
      control,
      element: host,
    });
  });

  it('skips an inner ngModel that is not part of this form', () => {
    const control = new FormControl('');
    const form = document.createElement('form');
    const host = document.createElement('app-date-picker');
    const inner = document.createElement('input');
    host.append(inner);
    form.append(host);
    const ngForm = createNgForm(new FormGroup({ startDate: control }));
    registerNgModel(ngForm, ['startDate'], control, host);
    // A custom control's own ngModel has no parent container.
    registerControlElement(ngForm, inner, {
      path: ['day'],
      control: new FormControl(''),
      options: undefined,
      formDirective: null,
    } as unknown as NgModel);

    expect(resolveFieldFromBlur(ngForm, inner)).toEqual({
      field: 'startDate',
      control,
      element: host,
    });
  });

  it('resolves a name under a registered dynamic ngModelGroup', () => {
    const control = new FormControl('');
    const form = document.createElement('form');
    const first = document.createElement('div');
    const second = document.createElement('div');
    const firstInput = document.createElement('input');
    firstInput.name = 'to';
    const secondInput = document.createElement('input');
    secondInput.name = 'to';
    first.append(firstInput);
    second.append(secondInput);
    form.append(first, second);
    const ngForm = createNgForm(
      new FormGroup({
        slots: new FormGroup({
          0: new FormGroup({ to: new FormControl('') }),
          1: new FormGroup({ to: control }),
        }),
      })
    );
    registerGroupElement(ngForm, first, {
      path: ['slots', '0'],
    } as unknown as NgModelGroup);
    registerGroupElement(ngForm, second, {
      path: ['slots', '1'],
    } as unknown as NgModelGroup);

    expect(resolveFieldFromBlur(ngForm, secondInput)).toEqual({
      field: 'slots.1.to',
      control,
      element: secondInput,
    });
  });

  it('stops matching a host element once it is unregistered', () => {
    const control = new FormControl('');
    const form = document.createElement('form');
    const input = document.createElement('input');
    form.append(input);
    const ngForm = createNgForm(new FormGroup({ nickname: control }));
    const unregister = registerControlElement(ngForm, input, {
      path: ['nickname'],
      control,
      formDirective: ngForm,
    } as unknown as NgModel);

    expect(resolveFieldFromBlur(ngForm, input)?.field).toBe('nickname');
    unregister();
    // No `name` attribute, so no fallback strategy can match either.
    expect(resolveFieldFromBlur(ngForm, input)).toBeNull();
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
      })
    );
    registerNgModel(ngForm, ['passwords', 'password'], control, input);

    expect(resolveFieldFromBlur(ngForm, input)).toBeNull();
  });

  it('falls back to the static ngModelGroup attribute walk when nothing is registered', () => {
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

  it('writes a FormArray index as a dot segment in the fallback path', () => {
    const control = new FormControl('Ada');
    const form = document.createElement('form');
    const input = document.createElement('input');
    input.name = 'name';
    form.append(input);

    const ngForm = createNgForm(
      new FormGroup({
        users: new FormArray([new FormGroup({ name: control })]),
      })
    );

    expect(resolveFieldFromBlur(ngForm, input)).toEqual({
      field: 'users.0.name',
      control,
      element: input,
    });
  });

  it('uses the DOM ngModelGroup index to pick between FormArray items', () => {
    const control = new FormControl('Grace');
    const form = document.createElement('form');
    const first = document.createElement('div');
    first.setAttribute('ngModelGroup', '0');
    const firstName = document.createElement('input');
    firstName.name = 'name';
    first.append(firstName);
    const second = document.createElement('div');
    second.setAttribute('ngModelGroup', '1');
    const secondName = document.createElement('input');
    secondName.name = 'name';
    second.append(secondName);
    const users = document.createElement('div');
    users.append(first, second);
    form.append(users);

    const ngForm = createNgForm(
      new FormGroup({
        users: new FormArray([
          new FormGroup({ name: new FormControl('Ada') }),
          new FormGroup({ name: control }),
        ]),
      })
    );

    expect(resolveFieldFromBlur(ngForm, secondName)).toEqual({
      field: 'users.1.name',
      control,
      element: secondName,
    });
  });

  it('does not match an index from a nested array to the outer array', () => {
    // Only the inner `lines` items carry ngModelGroup; the order items do
    // not. orders[1].lines[0]'s `ngModelGroup="0"` must not pick orders[0].
    const form = document.createElement('form');
    const orderElements = [0, 1].map(() => {
      const order = document.createElement('div');
      const line = document.createElement('div');
      line.setAttribute('ngModelGroup', '0');
      const sku = document.createElement('input');
      sku.name = 'sku';
      line.append(sku);
      order.append(line);
      form.append(order);
      return sku;
    });
    const target = orderElements[1];
    if (!target) throw new Error('missing input');

    const order = () =>
      new FormGroup({
        lines: new FormArray([new FormGroup({ sku: new FormControl('') })]),
      });
    const ngForm = createNgForm(
      new FormGroup({ orders: new FormArray([order(), order()]) })
    );

    // Both orders fit the DOM equally well: no unique answer, so null
    // rather than the wrong control.
    expect(resolveFieldFromBlur(ngForm, target)).toBeNull();
  });

  it('resolves nested array items when every level carries its index', () => {
    const form = document.createElement('form');
    const inputs: HTMLInputElement[] = [];
    for (const orderIndex of ['0', '1']) {
      const order = document.createElement('div');
      order.setAttribute('ngModelGroup', orderIndex);
      for (const lineIndex of ['0', '1']) {
        const line = document.createElement('div');
        line.setAttribute('ngModelGroup', lineIndex);
        const sku = document.createElement('input');
        sku.name = 'sku';
        line.append(sku);
        order.append(line);
        inputs.push(sku);
      }
      form.append(order);
    }

    const skus: FormControl[] = [];
    const order = () =>
      new FormGroup({
        lines: new FormArray(
          [0, 1].map(() => {
            const sku = new FormControl('');
            skus.push(sku);
            return new FormGroup({ sku });
          })
        ),
      });
    const ngForm = createNgForm(
      new FormGroup({ orders: new FormArray([order(), order()]) })
    );

    // orders[1].lines[0]
    const target = inputs[2];
    if (!target) throw new Error('missing input');
    expect(resolveFieldFromBlur(ngForm, target)).toEqual({
      field: 'orders.1.lines.0.sku',
      control: skus[2],
      element: target,
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

  it('reads checkbox, number, radio, textarea, select, and unsupported blur values', () => {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = true;

    const number = document.createElement('input');
    number.type = 'number';
    number.value = '42';

    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.value = 'male';

    const textarea = document.createElement('textarea');
    textarea.value = 'Notes';

    const select = document.createElement('select');
    const option = document.createElement('option');
    option.value = 'b';
    option.text = 'B';
    select.append(option);
    select.value = 'b';

    const div = document.createElement('div');

    expect(readElementValueForBlur(checkbox)).toBe(true);
    expect(readElementValueForBlur(number)).toBe(42);
    expect(readElementValueForBlur(radio)).toBeUndefined();
    expect(readElementValueForBlur(textarea)).toBe('Notes');
    expect(readElementValueForBlur(select)).toBe('b');
    expect(readElementValueForBlur(div)).toBeUndefined();
  });
});
