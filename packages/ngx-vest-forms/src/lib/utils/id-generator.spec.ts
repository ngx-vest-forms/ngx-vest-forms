import { APP_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { NgxIdGenerator } from './id-generator';

// TestBed uses its own APP_ID; 'ng' is Angular's default in an application.
const useDefaultAppId = () =>
  TestBed.configureTestingModule({
    providers: [{ provide: APP_ID, useValue: 'ng' }],
  });

describe('NgxIdGenerator', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('numbers each prefix on its own, starting at 0', () => {
    useDefaultAppId();
    const ids = TestBed.inject(NgxIdGenerator);

    expect(ids.next('ngx-a')).toBe('ngx-a-0');
    expect(ids.next('ngx-a')).toBe('ngx-a-1');
    expect(ids.next('ngx-b')).toBe('ngx-b-0');
  });

  it('includes a non-default APP_ID so two applications cannot collide', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: APP_ID, useValue: 'shop' }],
    });
    const ids = TestBed.inject(NgxIdGenerator);

    expect(ids.next('ngx-a')).toBe('ngx-a-shop-0');
  });

  it('starts again at 0 for a new root injector, as on each SSR request', () => {
    useDefaultAppId();
    TestBed.inject(NgxIdGenerator).next('ngx-a');
    TestBed.resetTestingModule();
    useDefaultAppId();

    expect(TestBed.inject(NgxIdGenerator).next('ngx-a')).toBe('ngx-a-0');
  });
});
