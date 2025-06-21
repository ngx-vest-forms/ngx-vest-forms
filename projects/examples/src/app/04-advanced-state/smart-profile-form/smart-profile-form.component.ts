import { JsonPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgxFormDirective, NgxFormState, ngxVestForms } from 'ngx-vest-forms';
import { NgxControlWrapper } from 'ngx-vest-forms/control-wrapper';
import { NgxVestFormsSmartStateDirective } from 'ngx-vest-forms/smart-state';

import { initialUserProfile, UserProfile } from './user-profile.model';
import { userProfileSuite } from './user-profile.validations';

@Component({
  selector: 'ngx-smart-profile-page', // Updated selector to ngx- prefix
  standalone: true,
  imports: [
    FormsModule,
    JsonPipe,
    ngxVestForms,
    NgxControlWrapper,
    NgxVestFormsSmartStateDirective, // Corrected directive name
  ],
  templateUrl: './smart-profile-form.component.html',
  styleUrl: './smart-profile-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SmartProfileFormComponent {
  protected readonly userProfileSuite = userProfileSuite;

  readonly userProfile = signal<UserProfile>({ ...initialUserProfile });
  readonly externalUserData = signal<UserProfile>({ ...initialUserProfile });

  protected profileFormDirective = viewChild.required(NgxFormDirective);

  readonly smartOptions = {
    mergeStrategy: 'smart',
    preserveFields: ['bio', 'notificationPreferences.sms'],
    conflictResolution: true,
    onConflict: (
      local: UserProfile,
      external: UserProfile,
    ): 'prompt-user' | 'local' | 'external' | UserProfile => {
      console.warn('Conflict detected in SmartProfileFormComponent:', {
        local,
        external,
      });
      return 'prompt-user';
    },
  };

  constructor() {
    setTimeout(() => {
      const serverData: UserProfile = {
        ...initialUserProfile,
        id: 'server-123',
        firstName: 'Alice',
        lastName: 'Smith',
        email: 'alice.smith@example.com',
        bio: 'Initial bio from server.',
        receiveNewsletter: true,
        notificationPreferences: {
          ...initialUserProfile.notificationPreferences,
          email: false,
        },
      };
      this.externalUserData.set(serverData);
      this.userProfile.set({ ...serverData });
      console.log(
        'Initial external data loaded and form initialized:',
        serverData,
      );
    }, 500);
  }

  onSubmit(formState: NgxFormState<UserProfile>): void {
    console.log(
      'Form Submitted. Valid:',
      formState.valid,
      'Value:',
      formState.value,
    );
    if (formState.valid && formState.value) {
      alert('Profile saved successfully! (Check console for data)');
      this.externalUserData.set({ ...formState.value });
    } else {
      alert('Form is invalid. Please check errors.');
      console.error('Form errors:', formState.errors);
    }
  }

  resetFormToExternal(): void {
    const currentExternal = this.externalUserData();
    this.userProfile.set({ ...currentExternal });
    console.log('Form reset to external data:', currentExternal);
  }

  resetFormToInitial(): void {
    this.userProfile.set({ ...initialUserProfile });
    console.log('Form reset to initial data.');
  }

  simulateExternalChangeMajor(): void {
    const updatedExternalData: UserProfile = {
      ...this.externalUserData(),
      id: 'server-456-major',
      firstName: 'Robert',
      lastName: 'Jones',
      email: 'robert.jones.new@example.com',
      bio: 'Admin updated bio.',
      receiveNewsletter: false,
      notificationPreferences: {
        push: false,
        email: true,
        sms: true,
      },
    };
    this.externalUserData.set(updatedExternalData);
    console.log('Simulated MAJOR external data change:', updatedExternalData);
  }

  simulateExternalChangeMinor(): void {
    const updatedExternalData: UserProfile = {
      ...this.externalUserData(),
      bio: `External minor update at ${new Date().toLocaleTimeString()}`,
      notificationPreferences: {
        ...this.externalUserData().notificationPreferences,
        push: !this.externalUserData().notificationPreferences.push,
      },
    };
    this.externalUserData.set(updatedExternalData);
    console.log('Simulated MINOR external data change:', updatedExternalData);
  }

  // --- Smart State Resolution Handlers ---
  resolveWithLocal(): void {
    console.log(
      'Conflict resolved: User chose LOCAL data. Form reflects current edits.',
    );
  }

  resolveWithExternal(): void {
    const externalData = this.externalUserData();
    this.userProfile.set({ ...externalData });
    console.log('Conflict resolved: User chose EXTERNAL data. Form updated.');
  }

  resolveWithCustomMerge(): void {
    const local = this.userProfile();
    const external = this.externalUserData();
    const merged: UserProfile = {
      ...external,
      firstName: local.firstName,
      lastName: local.lastName,
      bio: local.bio || external.bio,
    };
    this.userProfile.set(merged);
    console.log(
      'Conflict resolved: User chose CUSTOM MERGE. Form updated.',
      merged,
    );
  }
}
