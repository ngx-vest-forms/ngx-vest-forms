import { Component } from '@angular/core';

// Import all example components
import { ContactFormComponent } from './01-getting-started/contact-form/contact-form.component';
import { RegistrationFormComponent } from './01-getting-started/registration-form/registration-form.component';
import { SimpleFormComponent } from './01-getting-started/simple-form/simple-form.component';

import { AsyncValidationFormComponent } from './02-standard-forms/async-validation-form/async-validation-form.component';
import { BusinessHoursFormComponent } from './02-standard-forms/business-hours-form/business-hours-form.component';
import { ProfileFormComponent } from './02-standard-forms/profile-form/profile-form.component';
import { SurveyFormComponent } from './02-standard-forms/survey-form/survey-form.component';

import { ZodSchemaFormComponent } from './03-schema-integration/zod-schema-form/zod-schema-form.component';

// import { PhoneNumbersFormComponent } from './04-advanced-state/phone-numbers-form/phone-numbers-form.component';
// import { SmartProfileFormComponent } from './04-advanced-state/smart-profile-form/smart-profile-form.component';

// import { PurchaseFormComponent } from './05-complex-integrations/purchase-form/purchase-form.component';
import { WizardFormComponent } from './05-complex-integrations/wizard-form/wizard-form.component';

@Component({
  selector: 'ngx-root',
  imports: [
    // Tier 1: Getting Started
    SimpleFormComponent,
    ContactFormComponent,
    RegistrationFormComponent,
    // Tier 2: Standard Forms
    ProfileFormComponent,
    BusinessHoursFormComponent,
    SurveyFormComponent,
    AsyncValidationFormComponent,
    // Tier 3: Schema Integration
    ZodSchemaFormComponent,
    // Tier 4: Advanced State
    // SmartProfileFormComponent,
    // PhoneNumbersFormComponent,
    // Tier 5: Complex Integrations
    // PurchaseFormComponent,
    WizardFormComponent,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'ngx-vest-forms Examples';
}
