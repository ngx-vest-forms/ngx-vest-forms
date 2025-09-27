import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';
import { NgxVestFormsSmartStateDirective } from './smart-state-extension.directive';
import { SmartStateOptions } from './smart-state-extension.types';

type UserProfile = {
  name: string;
  email: string;
};

describe('NgxVestFormsSmartStateDirective', () => {
  @Component({
    imports: [NgxVestFormsSmartStateDirective],
    template: `<form
      ngxSmartStateExtension
      [externalData]="externalData()"
      [formValue]="formValue()"
      [smartStateOptions]="smartStateOptions()"
      [isDirty]="isDirty()"
    ></form>`,
  })
  class TestHostComponent {
    externalData: WritableSignal<UserProfile | null> = signal(null);
    formValue: WritableSignal<UserProfile | null> = signal(null);
    smartStateOptions: WritableSignal<SmartStateOptions<UserProfile>> = signal(
      {},
    );
    isDirty = signal(false);
  }

  let fixture: ComponentFixture<TestHostComponent>;
  let directive: NgxVestFormsSmartStateDirective<UserProfile>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
    });
    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const directiveElement = fixture.debugElement.query(
      By.directive(NgxVestFormsSmartStateDirective),
    );
    directive = directiveElement.injector.get(NgxVestFormsSmartStateDirective);
  });

  it('should create the directive', () => {
    expect(directive).toBeTruthy();
  });

  describe('Merge Strategy: "replace"', () => {
    it('should replace formValue with externalData when form is not dirty', () => {
      // Scaffold for test
    });

    it('should not replace formValue with externalData when form is dirty', () => {
      // Scaffold for test
    });
  });

  describe('Merge Strategy: "preserve"', () => {
    it('should always preserve formValue, even when externalData changes', () => {
      // Scaffold for test
    });
  });

  describe('Merge Strategy: "smart"', () => {
    it('should merge non-conflicting changes from externalData', () => {
      // Scaffold for test
    });

    it('should preserve user-edited fields and not overwrite them', () => {
      // Scaffold for test
    });

    it('should respect the preserveFields option', () => {
      // Scaffold for test
    });
  });

  describe('Input reactivity', () => {
    it('should re-compute mergedValue when externalData changes', () => {
      // Scaffold for test
    });

    it('should re-compute mergedValue when formValue changes', () => {
      // Scaffold for test
    });

    it('should re-compute mergedValue when smartStateOptions change', () => {
      // Scaffold for test
    });
  });
});
