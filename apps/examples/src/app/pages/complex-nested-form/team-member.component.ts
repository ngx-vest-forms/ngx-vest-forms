import {
  Component,
  computed,
  input,
} from '@angular/core';
import { NgxVestForms, vestFormsViewProviders } from 'ngx-vest-forms';
import { TeamMemberModel } from '../../models/complex-nested.model';

/**
 * One team member's fields.
 *
 * Uses `vestFormsViewProviders` exactly like `ngx-address` so the inner
 * `[ngModel]` controls register against the parent form's `ngModelGroup`
 * (the host renders this inside `<ngx-form-group-wrapper ngModelGroup="...">`).
 * The component owns no state — values flow up via ngModel automatically.
 */
@Component({
  selector: 'ngx-team-member',
  imports: [NgxVestForms],
  templateUrl: './team-member.component.html',
  viewProviders: [vestFormsViewProviders],
  host: { style: 'display: block;' },
})
export class TeamMemberComponent {
  /** This member's current value (read-only projection of the parent model). */
  readonly member = input<TeamMemberModel>();

  /** Stable id used to build unique input `id`/`for` pairs. */
  readonly idPrefix = input.required<string>();

  protected readonly fieldIds = computed(() => ({
    fullName: `${this.idPrefix()}-fullName`,
    email: `${this.idPrefix()}-email`,
    role: `${this.idPrefix()}-role`,
  }));
}
