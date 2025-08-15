import { Component, computed, isDevMode, signal } from '@angular/core';
import { ngxVestForms } from 'ngx-vest-forms';
import { NgxControlWrapper } from 'ngx-vest-forms/control-wrapper';
import { createSurveyValidationSuite } from './survey-form.validations';

type SurveyForm = {
  // Basic Info
  name: string;
  email: string;
  age: number | null;

  // Product Usage
  usesProduct: boolean;
  productRating?: number;
  productFeatures?: string[];

  // Experience Rating
  overallRating: number | null;
  recommendationLikelihood: number | null;

  // Conditional Questions
  hasComplaint: boolean;
  complaintDescription?: string;
  complaintUrgency?: 'low' | 'medium' | 'high';

  // Contact Preferences
  preferredContact: 'email' | 'phone' | 'none' | '';
  phoneNumber?: string;

  // Additional Feedback
  suggestions: string;
  allowFollowUp: boolean;
};

@Component({
  selector: 'ngx-survey-form',
  imports: [ngxVestForms, NgxControlWrapper],
  templateUrl: './survey-form.component.html',
  styleUrl: './survey-form.component.scss',
})
export class SurveyFormComponent {
  /**
   * Signal holding the form value.
   */
  protected readonly formValue = signal<SurveyForm>({
    name: '',
    email: '',
    age: null,
    usesProduct: false,
    overallRating: null,
    recommendationLikelihood: null,
    hasComplaint: false,
    preferredContact: '',
    suggestions: '',
    allowFollowUp: false,
  });

  /**
   * Vest validation suite with conditional validation.
   */
  protected readonly suite = createSurveyValidationSuite();

  /**
   * Available product features for selection.
   */
  protected readonly productFeatures = [
    { value: 'ease-of-use', label: 'Ease of Use' },
    { value: 'performance', label: 'Performance' },
    { value: 'design', label: 'Design' },
    { value: 'reliability', label: 'Reliability' },
    { value: 'support', label: 'Customer Support' },
    { value: 'price', label: 'Price' },
  ];

  /**
   * Contact preference options.
   */
  protected readonly contactOptions = [
    { value: '', label: 'Select preference' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'none', label: 'Do not contact me' },
  ];

  /**
   * Complaint urgency options.
   */
  protected readonly urgencyOptions = [
    { value: 'low', label: 'Low - General feedback' },
    { value: 'medium', label: 'Medium - Needs attention' },
    { value: 'high', label: 'High - Urgent issue' },
  ];

  /**
   * Computed property to determine if product questions should be shown.
   */
  protected readonly showProductQuestions = computed(
    () => this.formValue().usesProduct,
  );

  /**
   * Computed property to determine if complaint section should be shown.
   */
  protected readonly showComplaintSection = computed(
    () => this.formValue().hasComplaint,
  );

  /**
   * Computed property to determine if phone number field should be shown.
   */
  protected readonly showPhoneNumber = computed(
    () => this.formValue().preferredContact === 'phone',
  );

  /**
   * Generate array for rating scales.
   */
  protected readonly ratingScale = Array.from(
    { length: 10 },
    (_, index) => index + 1,
  );
  protected readonly recommendationScale = Array.from(
    { length: 11 },
    (_, index) => index,
  );

  /**
   * Handle form submission.
   */
  protected onSubmit(): void {
    const formData = this.formValue();
    alert('Survey submitted successfully! Thank you for your feedback.');
    if (isDevMode()) {
      console.log('Survey data:', formData);
    }
  }

  /**
   * Handle checkbox changes for product features.
   */
  protected onFeatureChange(feature: string, checked: boolean): void {
    this.formValue.update((value) => {
      const features = value.productFeatures || [];
      return checked
        ? {
            ...value,
            productFeatures: [...features, feature],
          }
        : {
            ...value,
            productFeatures: features.filter((f) => f !== feature),
          };
    });
  }

  /**
   * Check if a feature is selected.
   */
  protected isFeatureSelected(feature: string): boolean {
    return this.formValue().productFeatures?.includes(feature) || false;
  }

  /**
   * Set the overall rating value.
   */
  protected setOverallRating(rating: number): void {
    this.formValue.update((value) => ({
      ...value,
      overallRating: rating,
    }));
  }

  /**
   * Safely extract the checked flag from a change event.
   */
  isChecked(event: Event): boolean {
    const target = event.target as HTMLInputElement | null;
    return !!target?.checked;
  }
}
