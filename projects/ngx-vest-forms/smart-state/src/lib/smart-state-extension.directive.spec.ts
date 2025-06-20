import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { ngxVestFormsSmartStateDirective } from './smart-state-extension.directive';

describe('ngxVestFormsSmartStateDirective', () => {
  @Component({
    template: `<form
      ngxSmartStateExtension
      [externalData]="external"
      [formValue]="formValue"
    ></form>`,
  })
  class TestHostComponent {
    external = { foo: 'bar' };
    formValue = { foo: 'baz' };
  }

  let fixture: ComponentFixture<TestHostComponent>;
  let directive: ngxVestFormsSmartStateDirective<Record<string, unknown>>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ngxVestFormsSmartStateDirective],
      declarations: [TestHostComponent],
    });
    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const form = fixture.nativeElement.querySelector('form');
    directive = form.__ngContext__.find(
      (d: unknown) => d instanceof ngxVestFormsSmartStateDirective,
    ) as ngxVestFormsSmartStateDirective<Record<string, unknown>>;
  });

  it('should create the directive', () => {
    expect(directive).toBeTruthy();
  });

  it('should compute mergedValue', () => {
    expect(directive.mergedValue()).toBeDefined();
  });
});
