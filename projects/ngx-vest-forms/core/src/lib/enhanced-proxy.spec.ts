/**
 * Unit tests for createEnhancedProxy helper
 * Verifies dynamic accessor generation and field filtering behaviour.
 */

import { enforce, test as vestTest } from 'vest';
import { afterEach, describe, expect, it } from 'vitest';

import { runInAngular } from '../../../test-utilities';
import { createVestForm } from './create-vest-form';
import { staticSafeSuite } from './utils/safe-suite';
import type { VestFormOptions } from './vest-form.types';

type ProfileFormModel = {
  email: string;
  profile: {
    name: string;
    nickname: string;
  };
};

function createInitialModel(): ProfileFormModel {
  return {
    email: '',
    profile: {
      name: '',
      nickname: '',
    },
  };
}

function createValidationSuite() {
  return staticSafeSuite<ProfileFormModel>((data = {}) => {
    vestTest('email', 'Email is required', () => {
      enforce(data.email).isNotEmpty();
    });

    vestTest('profile.name', 'Name is required', () => {
      enforce(data.profile?.name).isNotEmpty();
    });
  });
}

function createForm(
  options: Pick<
    VestFormOptions<ProfileFormModel>,
    'includeFields' | 'excludeFields'
  > = {},
) {
  const initialModel = createInitialModel();
  const form = createVestForm(initialModel, {
    suite: createValidationSuite(),
    includeFields: options.includeFields,
    excludeFields: options.excludeFields,
  });

  return { form, initialModel };
}

describe('createEnhancedProxy', () => {
  const forms: { dispose: () => void }[] = [];

  afterEach(() => {
    for (const form of forms) {
      form.dispose();
    }

    forms.length = 0;
  });

  it('creates derived signals and methods for nested fields', async () => {
    const { form } = createForm();
    forms.push(form);

    // Initial derived accessors reflect default model values and validation state.
    expect(form.profileName()).toBe('');
    expect(form.profileNameValid()).toBe(false);
    expect(form.profileNameInvalid()).toBe(true);
    expect(form.profileNameDirty()).toBe(false);
    expect(form.profileNameTouched()).toBe(false);

    await runInAngular(() => {
      form.setProfileName('Ada');
    });

    expect(form.profileName()).toBe('Ada');
    expect(form.profileNameValid()).toBe(true);
    expect(form.profileNameInvalid()).toBe(false);
    expect(form.profileNameDirty()).toBe(true);
    expect(form.profileNameTouched()).toBe(false); // set() does not mark as touched

    await runInAngular(() => {
      form.markAsTouchedProfileName();
    });

    expect(form.profileNameTouched()).toBe(true);

    await runInAngular(() => {
      form.resetProfileName();
    });

    expect(form.profileName()).toBe('');
    expect(form.profileNameDirty()).toBe(false);
    expect(form.profileNameTouched()).toBe(false);

    await runInAngular(() => {
      form.markAsDirtyProfileName();
    });

    expect(form.profileNameDirty()).toBe(true);

    const profileField = form.profileNameField();
    expect(profileField.fieldName).toBe('profile.name');
  });

  it('preserves base vest form methods alongside enhanced accessors', () => {
    const { form, initialModel } = createForm();
    forms.push(form);

    expect(form.model()).toEqual(initialModel);
    expect(form.field('email').fieldName).toBe('email');
    expect(form.validate).toBeTypeOf('function');
  });

  it('respects includeFields allowlist when generating accessors', () => {
    const { form } = createForm({ includeFields: ['profile.name'] });
    forms.push(form);

    expect(form.profileName()).toBe('');

    const rawForm = form as Record<string, unknown>;
    expect(rawForm['profileNickname']).toBeUndefined();
    expect(rawForm['email']).toBeUndefined();

    // Base API should remain available even when enhanced accessors are filtered.
    expect(form.field('email').fieldName).toBe('email');
  });

  it('respects excludeFields denylist when generating accessors', () => {
    const { form } = createForm({ excludeFields: ['profile.*'] });
    forms.push(form);

    const rawForm = form as Record<string, unknown>;
    expect(rawForm['profileName']).toBeUndefined();
    expect(rawForm['profileNickname']).toBeUndefined();

    // Non-excluded fields continue to expose enhanced accessors.
    expect(form.email()).toBe('');
  });

  it('maps camelCase accessors back to field paths via resolveFieldPath', () => {
    const { form } = createForm();
    forms.push(form);

    expect(form.resolveFieldPath?.('profileName')).toBe('profile.name');
    expect(form.resolveFieldPath?.('setProfileName')).toBe('profile.name');
    expect(form.resolveFieldPath?.('markAsTouchedProfileName')).toBe(
      'profile.name',
    );
    expect(form.resolveFieldPath?.('markAsDirtyProfileName')).toBe(
      'profile.name',
    );
    expect(form.resolveFieldPath?.('resetProfileName')).toBe('profile.name');
    expect(form.resolveFieldPath?.('unknownAccessor')).toBeNull();
  });
});
