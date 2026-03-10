import { expect, type Page } from '@playwright/test';
import { expectFieldValid, fillAndBlur } from './form-helpers';

export type WizardStep = 1 | 2 | 3;

export type ValidStep1Values = {
  email: string;
  password: string;
};

export type ValidStep2Values = {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  dateOfBirth: string;
};

export const STEP_HEADINGS = {
  1: /step 1: account setup/i,
  2: /step 2: profile information/i,
  3: /review.*confirm/i,
} satisfies Record<WizardStep, RegExp>;

export const DEFAULT_VALID_STEP_1_VALUES = {
  email: 'test@example.com',
  password: 'SecurePass123!',
} as const satisfies ValidStep1Values;

export const DEFAULT_VALID_STEP_2_VALUES = {
  firstName: 'John',
  lastName: 'Doe',
  phoneNumber: '123-456-7890',
  dateOfBirth: '1990-01-15',
} as const satisfies ValidStep2Values;

export async function navigateToWizard(page: Page): Promise<void> {
  await page.goto('/wizard');
  await expect(
    page.getByRole('heading', { name: /multi-form wizard/i, level: 1 })
  ).toBeVisible();
}

export async function waitForValidationsToSettle(
  page: Page,
  timeout = 20_000
): Promise<void> {
  await expect(page.getByText('Validating…')).toHaveCount(0, { timeout });
}

async function clickWizardNavigationButton(
  page: Page,
  name: RegExp
): Promise<void> {
  await waitForValidationsToSettle(page, 10_000);

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const button = page.getByRole('button', { name });
      await expect(button).toBeEnabled();
      await button.click({ timeout: 10_000 });
      break;
    } catch (error) {
      if (
        attempt === 1 ||
        !(error instanceof Error) ||
        !error.message.includes('detached')
      ) {
        throw error;
      }

      await waitForValidationsToSettle(page, 10_000);
    }
  }

  await waitForValidationsToSettle(page, 10_000);
}

export async function clickNext(page: Page): Promise<void> {
  await clickWizardNavigationButton(page, /save & continue/i);
}

export async function clickPrevious(page: Page): Promise<void> {
  await clickWizardNavigationButton(page, /previous/i);
}

export async function clickSubmitAll(page: Page): Promise<void> {
  await clickWizardNavigationButton(page, /submit all/i);
}

export async function expectWizardStep(
  page: Page,
  step: WizardStep,
  headingName: RegExp,
  timeout = 30_000
): Promise<void> {
  await expect(
    page.getByRole('navigation', {
      name: new RegExp(`progress:\\s*step\\s+${step}\\s+of\\s+3`, 'i'),
    })
  ).toBeVisible({ timeout });
  await expect(page.getByRole('heading', { name: headingName })).toBeVisible({
    timeout,
  });
}

export async function fillValidStep1(
  page: Page,
  values: ValidStep1Values = DEFAULT_VALID_STEP_1_VALUES
): Promise<void> {
  await fillAndBlur(page.getByLabel(/email address/i), values.email);
  await fillAndBlur(page.getByLabel(/confirm email/i), values.email);
  await fillAndBlur(
    page.getByLabel('Password', { exact: true }),
    values.password
  );
  await fillAndBlur(
    page.getByLabel('Confirm Password', { exact: true }),
    values.password
  );
  await waitForValidationsToSettle(page);
}

export async function expectValidStep1(page: Page): Promise<void> {
  await expectFieldValid(page.getByLabel(/email address/i));
  await expectFieldValid(page.getByLabel(/confirm email/i));
  await expectFieldValid(page.getByLabel('Password', { exact: true }));
  await expectFieldValid(page.getByLabel('Confirm Password', { exact: true }));
}

export async function fillValidStep2(
  page: Page,
  values: ValidStep2Values = DEFAULT_VALID_STEP_2_VALUES
): Promise<void> {
  await fillAndBlur(page.getByLabel(/first name/i), values.firstName);
  await fillAndBlur(page.getByLabel(/last name/i), values.lastName);
  await fillAndBlur(page.getByLabel(/phone number/i), values.phoneNumber);
  await fillAndBlur(page.getByLabel(/date of birth/i), values.dateOfBirth);
  await waitForValidationsToSettle(page);
}

export async function expectValidStep2(page: Page): Promise<void> {
  await expectFieldValid(page.getByLabel(/first name/i));
  await expectFieldValid(page.getByLabel(/last name/i));
  await expectFieldValid(page.getByLabel(/phone number/i));
  await expectFieldValid(page.getByLabel(/date of birth/i));
}

export async function goToProfileStep(page: Page): Promise<void> {
  const step2HeadingName = STEP_HEADINGS[2];
  const step2Heading = page.getByRole('heading', { name: step2HeadingName });

  const step1Nav = page.getByRole('navigation', {
    name: /progress:\s*step\s+1\s+of\s+3/i,
  });
  const step3Nav = page.getByRole('navigation', {
    name: /progress:\s*step\s+3\s+of\s+3/i,
  });

  for (let attempt = 0; attempt < 3; attempt++) {
    if (await step2Heading.isVisible().catch(() => false)) {
      await expectWizardStep(page, 2, step2HeadingName);
      return;
    }

    if (await step1Nav.isVisible().catch(() => false)) {
      await clickNext(page);
      continue;
    }

    if (await step3Nav.isVisible().catch(() => false)) {
      await page
        .getByRole('button', { name: /edit profile details/i })
        .click({ timeout: 10_000 });
    }
  }

  await expectWizardStep(page, 2, step2HeadingName);
}
