import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgxFormCoreDirective } from 'ngx-vest-forms/core';
import { enforce, staticSuite, test } from 'vest';

@Component({
  selector: 'ngx-minimal-form',
  imports: [FormsModule, NgxFormCoreDirective],
  template: `
    <section class="prose max-w-none">
      <h2>Minimal Form (no control wrapper)</h2>
      <p>Goal: Smallest working setup using ngxVestFormCore.</p>
    </section>

    <form
      ngxVestFormCore
      [vestSuite]="suite"
      [(formValue)]="model"
      #core="ngxVestFormCore"
      (ngSubmit)="onSubmit(core.formState().valid)"
      class="simple-form"
      autocomplete="off"
    >
      <div class="form-group">
        <label for="email" class="form-label">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          class="form-input"
          ngModel
          required
          aria-describedby="email-help"
          [attr.aria-invalid]="
            (core.formState().errors['email']?.length || 0) > 0
              ? 'true'
              : 'false'
          "
        />
        <span id="email-help" class="form-help">Enter a valid email.</span>
        <ul class="form-errors" aria-live="polite">
          @for (msg of core.formState().errors['email'] || []; track msg) {
            <li class="text-red-600">{{ msg }}</li>
          }
        </ul>
      </div>

      <button
        type="submit"
        class="form-submit"
        [disabled]="!core.formState().valid"
      >
        Submit
      </button>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MinimalFormComponent {
  protected readonly model = signal<{ email: string }>({ email: '' });

  protected readonly suite = staticSuite((data = {}) => {
    test('email', 'Email is required', () => {
      enforce(data.email).isNotEmpty();
    });
    test('email', 'Must be a valid email', () => {
      enforce(data.email).matches(/^[^@]+@[^@]+\.[^@]+$/);
    });
  });

  protected onSubmit(valid: boolean): void {
    if (!valid) return;
    alert('Submitted');
  }
}
