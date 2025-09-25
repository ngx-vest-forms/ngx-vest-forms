import { NgClass, TitleCasePipe } from '@angular/common';
import {
  Component,
  computed,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { NgxControlWrapper } from 'ngx-vest-forms/control-wrapper';
import { ngxVestForms } from 'ngx-vest-forms/core';
import { NgxVestFormWithSchemaDirective } from 'ngx-vest-forms/schemas';
import { ShikiHighlightDirective, type SupportedLanguage } from '../../ui';

import { userProfileValidations } from './schema-comparison.validations';
import { arktypeUserProfileSchema } from './schemas/user.arktype.schema';
import { customUserProfileSchema } from './schemas/user.custom.schema';
import { valibotUserProfileSchema } from './schemas/user.valibot.schema';
import { zodUserProfileSchema } from './schemas/user.zod.schema';
import type { SchemaType, UserProfile } from './user-profile.model';

// Simple map for bundle size (display only)
const SCHEMA_BUNDLE_SIZES: Record<SchemaType, string> = {
  zod: '~13.5kB gzipped',
  valibot: '~2.8kB gzipped',
  arktype: '~7.2kB gzipped',
  custom: '~0.5kB gzipped',
};

// Detailed model code snippets for display
const MODEL_CODE: Record<SchemaType, string> = {
  zod: `// Schema for type safety and structure validation
const zodUserProfileSchema = z.object({
  name: z.string(),
  email: z.string(),
  age: z.number(),
  website: z.string().optional().or(z.literal('')),
  bio: z.string(),
  preferences: z.object({
    newsletter: z.boolean(),
    notifications: z.boolean(),
  }),
});

type UserProfile = z.infer<typeof zodUserProfileSchema>;

// 🎯 Validation rules are handled by Vest.js,
// not the schema! Schema = type safety + structure.`,
  valibot: `// Schema for type safety and structure validation
const valibotUserProfileSchema = v.object({
  name: v.string(),
  email: v.string(),
  age: v.number(),
  website: v.optional(v.string()),
  bio: v.string(),
  preferences: v.object({
    newsletter: v.boolean(),
    notifications: v.boolean(),
  }),
});

type UserProfile = v.InferInput<typeof valibotUserProfileSchema>;

// 🎯 Validation rules are handled by Vest.js,
// not the schema! Schema = type safety + structure.`,
  arktype: `// Schema for type safety and structure validation
const arktypeUserProfileSchema = type({
  name: 'string',
  email: 'string',
  age: 'number',
  'website?': 'string',
  bio: 'string',
  preferences: {
    newsletter: 'boolean',
    notifications: 'boolean',
  },
});

type UserProfile = typeof arktypeUserProfileSchema.infer;

// 🎯 Validation rules are handled by Vest.js,
// not the schema! Schema = type safety + structure.`,
  custom: `// Schema for type safety and basic structure validation
const userProfileTemplate: UserProfile = {
  name: '',
  email: '',
  age: 0,
  website: '',
  bio: '',
  preferences: {
    newsletter: false,
    notifications: false,
  },
};

export const customUserProfileSchema =
  ngxModelToStandardSchema(userProfileTemplate);

// 🎯 Validation rules are handled by Vest.js,
// not the schema! Schema = type safety + structure.`,
};

@Component({
  selector: 'ngx-schema-comparison-form',
  imports: [
    TitleCasePipe,
    NgClass,
    NgxControlWrapper,
    ngxVestForms,
    NgxVestFormWithSchemaDirective,
    ShikiHighlightDirective,
  ],
  template: `
    <form
      ngxVestFormWithSchema
      [vestSuite]="suite"
      [formSchema]="activeSchema()"
      [(formValue)]="formModel"
      #vestForm="ngxVestForm"
      (ngSubmit)="onSubmit()"
      class="form-container"
    >
      <!-- Schema Switcher -->
      <fieldset
        class="rounded border bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
      >
        <legend class="px-1 text-sm font-medium dark:text-gray-200">
          Schema Library
        </legend>
        <div
          class="grid gap-2 sm:grid-cols-4"
          role="radiogroup"
          aria-label="Schema Library"
        >
          @for (type of schemaTypes; track type) {
            <label
              class="flex cursor-pointer items-center gap-2 rounded-md border bg-white p-2 text-sm transition-colors dark:bg-gray-800"
              [ngClass]="
                selectedSchema() === type
                  ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/30'
                  : ''
              "
            >
              <input
                type="radio"
                class="accent-blue-600"
                [value]="type"
                name="schemaType"
                [checked]="selectedSchema() === type"
                (change)="selectSchema(type)"
                aria-describedby="schema-hint"
                [attr.aria-label]="type + ' schema'"
              />
              <span class="font-medium">{{ type | titlecase }}</span>
              <span class="text-xs text-gray-500 dark:text-gray-400">
                {{ bundleSize(type) }}
              </span>
            </label>
          }
        </div>
        <p
          id="schema-hint"
          class="mt-2 text-xs text-gray-600 dark:text-gray-400"
        >
          Switch libraries to compare validation behavior.
        </p>
      </fieldset>

      <!-- Currently Showcasing Info -->
      <div
        class="rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 dark:border-blue-800 dark:from-blue-900/20 dark:to-indigo-900/20"
      >
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-blue-900 dark:text-blue-100">
            Currently Showcasing: {{ currentSchemaInfo().name }}
          </h2>
          <div class="text-sm text-blue-700 dark:text-blue-300">
            Bundle Size: {{ currentSchemaInfo().bundleSize }}
          </div>
        </div>
        <p class="mt-2 text-sm text-blue-800 dark:text-blue-200">
          {{ currentSchemaInfo().description }}
        </p>

        <!-- Model Code Display -->
        <div class="mt-4">
          <h3 class="mb-2 text-sm font-medium text-blue-900 dark:text-blue-100">
            Schema Purpose: Type Safety + Structure (not field validation rules)
          </h3>
          <div class="mb-2 text-xs text-blue-800 dark:text-blue-200">
            🎯 <strong>Schemas:</strong> Type inference, data shape validation
            on submit<br />
            ⚡ <strong>Vest.js:</strong> Interactive field validation rules
            (required, email format, etc.)
          </div>
          <div class="overflow-x-auto rounded-md bg-gray-900 p-4 text-xs">
            <pre
              ngxShikiHighlight
              [language]="schemaLanguage()"
              [code]="modelCode()"
              class="overflow-hidden rounded-lg"
            ></pre>
          </div>
        </div>
      </div>

      <!-- Basic Fields -->
      <div class="grid gap-4 md:grid-cols-2" aria-describedby="profile-desc">
        <p id="profile-desc" class="sr-only">
          User profile required fields and preferences.
        </p>

        <ngx-control-wrapper>
          <label for="name">Full Name *</label>
          <input
            id="name"
            name="name"
            [ngModel]="formModel().name"
            type="text"
            aria-required="true"
            class="form-input"
          />
        </ngx-control-wrapper>

        <ngx-control-wrapper>
          <label for="email">Email *</label>
          <input
            id="email"
            name="email"
            type="email"
            [ngModel]="formModel().email"
            aria-required="true"
            class="form-input"
          />
        </ngx-control-wrapper>

        <ngx-control-wrapper>
          <label for="age">Age *</label>
          <input
            id="age"
            name="age"
            type="number"
            [ngModel]="formModel().age"
            aria-required="true"
            class="form-input"
          />
        </ngx-control-wrapper>

        <ngx-control-wrapper>
          <label for="website">Website</label>
          <input
            id="website"
            name="website"
            type="url"
            [ngModel]="formModel().website"
            class="form-input"
          />
        </ngx-control-wrapper>

        <ngx-control-wrapper class="md:col-span-2">
          <label for="bio">Bio *</label>
          <textarea
            id="bio"
            name="bio"
            rows="3"
            [ngModel]="formModel().bio"
            aria-required="true"
            class="form-textarea"
          ></textarea>
        </ngx-control-wrapper>
      </div>

      <!-- Preferences -->
      <fieldset class="space-y-3 rounded border p-4">
        <legend class="px-1 text-sm font-medium">Preferences</legend>
        <div ngModelGroup="preferences" class="space-y-2">
          <label class="form-checkbox-label">
            <input
              type="checkbox"
              name="newsletter"
              [ngModel]="formModel().preferences.newsletter"
              class="form-checkbox mr-2"
            />
            <span>Subscribe to newsletter</span>
          </label>
          <label class="form-checkbox-label">
            <input
              type="checkbox"
              name="notifications"
              [ngModel]="formModel().preferences.notifications"
              class="form-checkbox mr-2"
            />
            <span>Enable notifications</span>
          </label>
        </div>
      </fieldset>

      <div class="form-actions">
        <button type="button" (click)="onReset()" class="btn-secondary">
          Reset
        </button>
        <button
          type="submit"
          [disabled]="
            !vestForm.formState().valid || vestForm.formState().pending
          "
          class="btn-primary"
        >
          Submit
        </button>
      </div>
    </form>
  `,
})
export class SchemaComparisonFormComponent {
  // Parent supplies a UserProfile signal value
  model = input.required<UserProfile>();
  // Local form-bound model (initialized empty; parent may hydrate externally)
  formModel = signal<UserProfile>({
    name: '',
    email: '',
    age: 0,
    website: '',
    bio: '',
    preferences: { newsletter: false, notifications: false },
  });
  formSubmitted = output<{
    data: UserProfile;
    valid: boolean;
    schemaType: SchemaType;
  }>();
  formReset = output();

  vestForm = viewChild.required<NgxVestFormWithSchemaDirective>('vestForm');

  readonly schemaTypes: SchemaType[] = ['zod', 'valibot', 'arktype', 'custom'];
  private readonly _selectedSchema = signal<SchemaType>('zod');
  selectedSchema = computed(() => this._selectedSchema());

  suite = userProfileValidations;

  activeSchema = computed(() => {
    switch (this._selectedSchema()) {
      case 'zod': {
        return zodUserProfileSchema;
      }
      case 'valibot': {
        return valibotUserProfileSchema;
      }
      case 'arktype': {
        return arktypeUserProfileSchema;
      }
      case 'custom': {
        return customUserProfileSchema;
      }
    }
  });

  // Model code for display in the currently showcasing section
  modelCode = computed(() => MODEL_CODE[this._selectedSchema()]);

  // Dynamic language mapping for better syntax highlighting
  schemaLanguage = computed((): SupportedLanguage => {
    // All schema types are TypeScript-based, so use 'typescript' for best highlighting
    return 'typescript';
  });

  // Current schema information for display
  currentSchemaInfo = computed(() => {
    const currentType = this._selectedSchema();
    switch (currentType) {
      case 'zod': {
        return {
          name: 'Zod',
          description:
            'TypeScript-first schema for type safety and structure validation (not field rules)',
          bundleSize: '~12KB',
        };
      }
      case 'valibot': {
        return {
          name: 'Valibot',
          description:
            'Modular schema for type safety and structure validation (not field rules)',
          bundleSize: '~8KB',
        };
      }
      case 'arktype': {
        return {
          name: 'ArkType',
          description:
            'Advanced schema for type safety and structure validation (not field rules)',
          bundleSize: '~15KB',
        };
      }
      case 'custom': {
        return {
          name: 'Custom Schema',
          description:
            'Lightweight schema for type safety and structure validation (not field rules)',
          bundleSize: '~1KB',
        };
      }
      default: {
        return {
          name: 'Unknown',
          description: 'Unknown schema type',
          bundleSize: 'Unknown',
        };
      }
    }
  });

  bundleSize(type: SchemaType): string {
    return SCHEMA_BUNDLE_SIZES[type];
  }

  selectSchema(type: SchemaType): void {
    this._selectedSchema.set(type);
  }

  onReset(): void {
    // Reset local model to initial empty values
    this.formModel.set({
      name: '',
      email: '',
      age: 0,
      website: '',
      bio: '',
      preferences: { newsletter: false, notifications: false },
    });

    this.formReset.emit();
  }

  onSubmit(): void {
    const formDirective = this.vestForm();
    const state = formDirective.formState();
    if (!state.valid) return;
    this.formSubmitted.emit({
      data: this.formModel(),
      valid: state.valid,
      schemaType: this._selectedSchema(),
    });
  }

  // Expose the vest form for parent component access (as computed to ensure reactive dependency)
  readonly formDirective = computed(() => this.vestForm());
  // TEMPORARILY DISABLED - Hydration effect might be causing infinite loop
  // TODO: Fix hydration logic to prevent infinite loops
  // private readonly _hydrate = effect(() => {
  //   const parentValue = this.model();
  //   const current = this.formModel();
  //
  //   // Only hydrate if form is in initial state
  //   if (!current.name && !current.email && current.age === 0 && current.bio === '') {
  //     this.formModel.set({
  //       ...parentValue,
  //       // Ensure preferences object is always defined
  //       preferences: parentValue.preferences || { newsletter: false, notifications: false }
  //     });
  //   }
  // });
}
