import { JsonPipe } from '@angular/common';
import { Component, signal } from '@angular/core';
import { ngxVestForms } from 'ngx-vest-forms';
import { NgxControlWrapper } from 'ngx-vest-forms/control-wrapper';
import { createProfileValidationSuite } from './profile-form.validations';

type Address = {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
};

type ProfileForm = {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;

  // Address
  address: Address;

  // Preferences
  gender: 'male' | 'female' | 'other' | '';
  genderOther?: string;
  newsletter: boolean;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };

  // Bio
  bio: string;
  website?: string;

  // Profile Picture
  profilePicture?: File;
};

@Component({
  selector: 'ngx-profile-form',
  imports: [JsonPipe, ngxVestForms, NgxControlWrapper],
  templateUrl: './profile-form.component.html',
  styleUrl: './profile-form.component.scss',
})
export class ProfileFormComponent {
  /**
   * Signal holding the form value.
   */
  protected readonly formValue = signal<ProfileForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US',
    },
    gender: '',
    newsletter: false,
    notifications: {
      email: true,
      sms: false,
      push: false,
    },
    bio: '',
    website: '',
  });

  /**
   * Vest validation suite for the profile form.
   * Includes nested object validation and conditional validation.
   */
  protected readonly suite = createProfileValidationSuite();

  /**
   * Available gender options for the select dropdown.
   */
  protected readonly genderOptions = [
    { value: '', label: 'Select gender' },
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
  ];

  /**
   * Available countries for the address.
   */
  protected readonly countries = [
    { value: 'US', label: 'United States' },
    { value: 'CA', label: 'Canada' },
    { value: 'UK', label: 'United Kingdom' },
    { value: 'DE', label: 'Germany' },
    { value: 'FR', label: 'France' },
  ];

  /**
   * Called on form submit.
   */
  protected onSubmit(): void {
    const formData = this.formValue();
    alert('Profile saved successfully!');
    console.log('Profile data:', formData);
  }

  /**
   * Handle file upload for profile picture.
   */
  protected onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (file) {
      this.formValue.update((value) => ({
        ...value,
        profilePicture: file,
      }));
    }
  }
}
