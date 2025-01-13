import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChild,
  HostBinding,
  inject,
  OnDestroy,
} from '@angular/core';

import { AbstractControl, NgModel, NgModelGroup } from '@angular/forms';
import { mergeWith, of, Subject, switchMap, takeUntil } from 'rxjs';
import { FormDirective } from '../../directives/form.directive';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: '[sc-control-wrapper]',
  standalone: true,
  templateUrl: './control-wrapper.component.html',
  styleUrls: ['./control-wrapper.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  // Cache the previous error to avoid 'flickering'
  private previousError?: string[];

  @HostBinding('class.sc-control-wrapper--invalid')
  public get invalid() {
    return this.control?.touched && this.errors;
  }

  public get errors(): string[] | undefined {
    if (this.control?.pending) {
      return this.previousError;
    } else {
      this.previousError = this.control?.errors?.['errors'];
    }
    return this.control?.errors?.['errors'];
  }

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
    // and mark the component and its ancestors as dirty
    // This allows us to use the OnPush ChangeDetection Strategy
    this.formDirective.idle$
      .pipe(
        switchMap(() => this.ngModelGroup?.control?.events || of(null)),
        mergeWith(this.control?.events || of(null)),
        takeUntil(this.destroy$$),
      )
      .subscribe(() => {
        this.cdRef.markForCheck();
      });
  }
}
