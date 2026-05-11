import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { collectTouchedPaths } from './collect-touched-paths';

describe('collectTouchedPaths', () => {
  it('returns both touched leaf paths in a flat group', () => {
    const form = new FormGroup({
      firstName: new FormControl('Ada'),
      lastName: new FormControl('Lovelace'),
    });

    form.controls.firstName.markAsTouched();
    form.controls.lastName.markAsTouched();

    expect(collectTouchedPaths(form, false)).toEqual([
      'firstName',
      'lastName',
    ]);
  });

  it('returns the dotted path for a touched nested leaf', () => {
    const form = new FormGroup({
      profile: new FormGroup({
        email: new FormControl('ada@example.com'),
      }),
    });

    const email = form.controls.profile.controls.email;
    email.markAsTouched();

    expect(collectTouchedPaths(form, false)).toEqual(['profile.email']);
  });

  it('returns bracket notation paths for touched array leaves', () => {
    const form = new FormGroup({
      contacts: new FormArray([
        new FormControl('555-0100'),
        new FormGroup({
          label: new FormControl('Home'),
        }),
      ]),
    });

    const contacts = form.controls.contacts;
    contacts.at(0).markAsTouched();
    contacts.at(1).get('label')?.markAsTouched();

    expect(collectTouchedPaths(form, false)).toEqual([
      'contacts[0]',
      'contacts[1].label',
    ]);
  });

  it('returns every leaf path once the form is submitted', () => {
    const form = new FormGroup({
      firstName: new FormControl('Ada'),
      profile: new FormGroup({
        email: new FormControl('ada@example.com'),
      }),
      contacts: new FormArray([new FormControl('555-0100')]),
    });

    expect(collectTouchedPaths(form, true)).toEqual([
      'firstName',
      'profile.email',
      'contacts[0]',
    ]);
  });

  it('returns an empty array for an empty form', () => {
    expect(collectTouchedPaths(new FormGroup({}), false)).toEqual([]);
  });
});
