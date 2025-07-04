import { JsonPipe } from '@angular/common';
import { Component, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ngxVestForms } from '../../../exports';
import { NgxFormCompatibleDeepRequired } from '../../../utils/deep-required';
import { NgxFormDirective } from '../../form.directive';
import { NgxValidationOptions } from '../../validation-options';
import { EventFormModel } from '../models/event-form.model';
import { dateFormValidations } from '../validations/date-form.validations';

/**
 * DateFormComponent demonstrates NgxFormCompatibleDeepRequired<T> utility type
 * with actual Date fields to show form initialization compatibility
 */
@Component({
  selector: 'ngx-date-form',
  imports: [FormsModule, ngxVestForms, JsonPipe],
  template: `
    <form
      ngxVestForm
      [vestSuite]="dateVestSuite"
      [(formValue)]="formValue"
      [validationOptions]="validationOptions"
      #vestForm="ngxVestForm"
    >
      <label for="title">Event Title</label>
      <input
        id="title"
        name="title"
        type="text"
        [ngModel]="formValue().title"
        placeholder="Enter event title"
      />

      <label for="startDate">Start Date</label>
      <input
        id="startDate"
        name="startDate"
        type="date"
        [ngModel]="formValue().startDate"
      />

      <label for="endDate">End Date</label>
      <input
        id="endDate"
        name="endDate"
        type="date"
        [ngModel]="formValue().endDate"
      />

      <!-- Nested object with Date -->
      <fieldset>
        <legend>Event Details</legend>

        <label for="createdAt">Created At</label>
        <input
          id="createdAt"
          name="details.createdAt"
          type="datetime-local"
          [ngModel]="formValue().details.createdAt"
        />

        <label for="category">Category</label>
        <input
          id="category"
          name="details.category"
          type="text"
          [ngModel]="formValue().details.category"
          placeholder="Enter category"
        />

        <label for="lastUpdated">Last Updated</label>
        <input
          id="lastUpdated"
          name="details.metadata.lastUpdated"
          type
          [ngModel]="formValue().details.metadata.lastUpdated"
        />
      </fieldset>

      <button type="submit">Submit</button>

      <!-- Display form state for testing -->
      <div data-testid="form-status">{{ vestForm.formState().status }}</div>
      <div data-testid="form-valid">{{ vestForm.formState().valid }}</div>
      <div data-testid="form-dirty">{{ vestForm.formState().dirty }}</div>
      <div data-testid="form-pending">{{ vestForm.formState().pending }}</div>
      <div data-testid="form-errors">
        {{ vestForm.formState().errors | json }}
      </div>
      <div data-testid="form-warnings">
        {{ vestForm.formState().warnings | json }}
      </div>
      <div data-testid="form-root-issues">
        Root Errors: {{ vestForm.formState().root?.errors | json }} Root
        Warnings: {{ vestForm.formState().root?.warnings | json }} Root
        Internal: {{ vestForm.formState().root?.internalError }}
      </div>
    </form>
  `,
})
export class DateFormComponent {
  readonly vestForm = viewChild<NgxFormDirective>('vestForm');

  // Use NgxFormCompatibleDeepRequired to make all fields required and Date fields compatible with strings
  formValue = signal<NgxFormCompatibleDeepRequired<EventFormModel>>({
    title: '',
    startDate: '', // ✅ Should work with NgxFormCompatibleDeepRequired
    endDate: '',
    details: {
      createdAt: '', // ✅ Should work with NgxFormCompatibleDeepRequired
      category: '',
      metadata: {
        lastUpdated: '', // ✅ Should work with NgxFormCompatibleDeepRequired
        version: 0,
      },
    },
  } satisfies NgxFormCompatibleDeepRequired<EventFormModel>); // Type assertion to work around TS strictness

  validationOptions: NgxValidationOptions = { debounceTime: 50 };

  // Use the extracted date form validation suite
  dateVestSuite = dateFormValidations;

  // Method to demonstrate setting actual Date objects
  setActualDates(): void {
    this.formValue.set({
      title: 'Conference 2024',
      startDate: new Date('2024-12-01'), // ✅ Can also use actual Date objects
      endDate: new Date('2024-12-03'),
      details: {
        createdAt: new Date(), // ✅ Current date
        category: 'Technology',
        metadata: {
          lastUpdated: new Date(),
          version: 1,
        },
      },
    });
  }
}
