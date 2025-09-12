import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChild,
  computed,
  inject,
  OnDestroy,
  signal,
} from '@angular/core';

import { AbstractControl, NgModel, NgModelGroup } from '@angular/forms';
import { mergeWith, of, Subject, switchMap, takeUntil } from 'rxjs';
import { FormDirective } from '../../directives/form.directive';

@Component({
  selector: '[sc-control-wrapper]',
  templateUrl: './control-wrapper.component.html',
  styleUrls: ['./control-wrapper.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.sc-control-wrapper--invalid]': 'invalid()',
  },
})
export class ControlWrapperComponent implements AfterViewInit, OnDestroy {
  @ContentChild(NgModel) public ngModel?: NgModel; // Optional ngModel
  public readonly ngModelGroup: NgModelGroup | null = inject(NgModelGroup, {
    optional: true,
    self: true,
  });
  private readonly destroy$$ = new Subject<void>();
  private readonly cdRef = inject(ChangeDetectorRef);
  private readonly formDirective = inject(FormDirective);

  // Signal-based state management
  private readonly controlState = signal<{
    touched: boolean;
    pending: boolean;
    errors: string[] | undefined;
  }>({ touched: false, pending: false, errors: undefined });

  // Cache the previous error to avoid 'flickering'
  private previousError?: string[];

  // Computed signal for invalid state
  protected readonly invalid = computed(() => {
    const state = this.controlState();
    return state.touched && state.errors && state.errors.length > 0;
  });

  // Computed signal for errors with pending state handling
  protected readonly errors = computed(() => {
    const state = this.controlState();
    if (state.pending) {
      return this.previousError;
    } else {
      this.previousError = state.errors;
    }
    return state.errors;
  });

  private get control(): AbstractControl | undefined {
    return this.ngModelGroup
      ? this.ngModelGroup.control
      : this.ngModel?.control;
  }

  public ngOnDestroy(): void {
    this.destroy$$.next();
  }

  public ngAfterViewInit(): void {
    // Wait until the form is idle
    // Then, listen to all events of the ngModelGroup or ngModel
    // and update our signal-based state
    this.formDirective.idle$
      .pipe(
        switchMap(() => this.ngModelGroup?.control?.events || of(null)),
        mergeWith(this.control?.events || of(null)),
        takeUntil(this.destroy$$)
      )
      .subscribe(() => {
        this.updateControlState();
        this.cdRef.markForCheck();
      });
  }

  private updateControlState(): void {
    const control = this.control;
    if (control) {
      this.controlState.set({
        touched: control.touched,
        pending: control.pending,
        errors: control.errors?.['errors'],
      });
    }
  }
}
