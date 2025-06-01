import { Component, signal } from '@angular/core';
import { ngxVestForms } from 'ngx-vest-forms';
import { enforce, staticSuite, test } from 'vest';

type ContactForm = {
  name: string;
  email: string;
};

const contactFormSuite = staticSuite((data = {}) => {
  test('name', 'Name is required', () => {
    enforce(data.name).isNotEmpty();
  });
  test('email', 'Email is required', () => {
    enforce(data.email).isNotEmpty();
    enforce(data.email).matches(/^[^@]+@[^@]+\.[^@]+$/);
  });
});

@Component({
  selector: 'ngx-contact-form',
  imports: [ngxVestForms],
  template: `
    <form
      ngxVestForm
      [vestSuite]="suite"
      [(formValue)]="formValue"
      validateRootForm="false"
      #vestForm="ngxVestForm"
    >
      <ngx-control-wrapper>
        <label>
          Name:
          <input name="name" ngModel />
        </label>
      </ngx-control-wrapper>
      <ngx-control-wrapper>
        <label>
          Email:
          <input name="email" ngModel />
        </label>
      </ngx-control-wrapper>
      <button type="submit">Submit</button>
    </form>
  `,
})
export class ContactFormComponent {
  protected readonly suite = contactFormSuite;
  protected readonly formValue = signal<ContactForm>({ name: '', email: '' });
}
