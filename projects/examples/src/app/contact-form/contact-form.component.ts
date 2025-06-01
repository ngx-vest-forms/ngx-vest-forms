import { Component, signal } from '@angular/core';
import { vestForms } from 'ngx-vest-forms';
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
  selector: 'sc-contact-form',
  imports: [vestForms],
  template: `
    <form
      scVestForm
      [vestSuite]="suite"
      [(formValue)]="formValue"
      validateRootForm="false"
      #vestForm="scVestForm"
    >
      <sc-control-wrapper>
        <label>
          Name:
          <input name="name" ngModel />
        </label>
      </sc-control-wrapper>
      <sc-control-wrapper>
        <label>
          Email:
          <input name="email" ngModel />
        </label>
      </sc-control-wrapper>
      <button type="submit">Submit</button>
    </form>
  `,
})
export class ContactFormComponent {
  protected readonly suite = contactFormSuite;
  protected readonly formValue = signal<ContactForm>({ name: '', email: '' });
}
