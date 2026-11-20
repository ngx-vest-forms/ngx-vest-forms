import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { injectPendingLabel, NGX_PENDING_LABEL } from './pending-label.token';

describe('NGX_PENDING_LABEL', () => {
  it('returns a signal-valued provider directly without an extra computed wrapper', () => {
    const label = signal('Checking…');

    TestBed.configureTestingModule({
      providers: [{ provide: NGX_PENDING_LABEL, useValue: label }],
    });

    const resolved = TestBed.runInInjectionContext(() => injectPendingLabel());

    expect(resolved).toBe(label);
    expect(resolved()).toBe('Checking…');

    label.set('Still checking…');
    expect(resolved()).toBe('Still checking…');
  });

  it('wraps a static string provider in a readable signal', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: NGX_PENDING_LABEL, useValue: 'Bezig…' }],
    });

    const resolved = TestBed.runInInjectionContext(() => injectPendingLabel());

    expect(resolved()).toBe('Bezig…');
  });

  it('defaults to "Validating…" when no custom provider is configured', () => {
    const resolved = TestBed.runInInjectionContext(() => injectPendingLabel());

    expect(resolved()).toBe('Validating…');
  });
});
