import {
  ApplicationRef,
  Component,
  ElementRef,
  inject,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import type { AriaAssociationMode } from '../utils/aria-association.utils';
import { createAriaAssociationController } from './aria-association-controller';

@Component({
  selector: 'ngx-test-aria-host',
  template: `
    <input id="first" aria-describedby="consumer-hint" />
    @if (showSecond()) {
      <select id="second" aria-required="true"></select>
    }
    <div id="combo" role="combobox" aria-controls="plain" aria-expanded="false">
      <input id="inner" />
    </div>
    <div id="slider" role="slider" aria-valuenow="0"></div>
    <div id="plain"><span>not a control</span></div>
  `,
})
class AriaHost {
  readonly mode = signal<AriaAssociationMode>('all-controls');
  readonly contentInitialized = signal(true);
  readonly shouldShowErrors = signal(false);
  readonly ariaDescribedBy = signal<string | null>(null);
  readonly ariaRequired = signal(false);
  readonly showSecond = signal(true);

  readonly controller = createAriaAssociationController({
    host: inject(ElementRef<HTMLElement>).nativeElement,
    mode: this.mode,
    contentInitialized: this.contentInitialized,
    shouldShowErrors: this.shouldShowErrors,
    ariaDescribedBy: this.ariaDescribedBy,
    ownedDescribedByIds: ['owned-error', 'owned-warning'],
    ariaRequired: this.ariaRequired,
  });
}

const stable = () => TestBed.inject(ApplicationRef).whenStable();

async function setup() {
  const fixture = TestBed.createComponent(AriaHost);
  await stable();
  const el = (id: string) =>
    fixture.nativeElement.querySelector(`#${id}`) as HTMLElement;
  return { host: fixture.componentInstance, el };
}

const ids = (controls: HTMLElement[]) => controls.map((c) => c.id);

describe('createAriaAssociationController', () => {
  it('discovers native controls and ARIA widgets, skipping widget internals', async () => {
    const { host } = await setup();

    expect(ids(host.controller.formControls())).toEqual([
      'first',
      'second',
      'combo',
      'slider',
    ]);
  });

  it('does nothing before content is initialized', async () => {
    const fixture = TestBed.createComponent(AriaHost);
    fixture.componentInstance.contentInitialized.set(false);
    fixture.componentInstance.shouldShowErrors.set(true);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(fixture.componentInstance.controller.formControls()).toEqual([]);
    expect(
      fixture.nativeElement.querySelector('#first').hasAttribute('aria-invalid')
    ).toBe(false);
  });

  it('merges owned describedby ids with consumer ids and toggles aria-invalid', async () => {
    const { host, el } = await setup();

    host.ariaDescribedBy.set('owned-error');
    host.shouldShowErrors.set(true);
    await stable();

    const describedBy = el('first').getAttribute('aria-describedby') ?? '';
    expect(new Set(describedBy.split(' '))).toEqual(
      new Set(['consumer-hint', 'owned-error'])
    );
    expect(el('first').getAttribute('aria-invalid')).toBe('true');
    expect(el('combo').getAttribute('aria-invalid')).toBe('true');
    expect(el('inner').hasAttribute('aria-invalid')).toBe(false);

    host.ariaDescribedBy.set(null);
    host.shouldShowErrors.set(false);
    await stable();

    expect(el('first').getAttribute('aria-describedby')).toBe('consumer-hint');
    expect(el('first').hasAttribute('aria-invalid')).toBe(false);
    expect(el('second').hasAttribute('aria-describedby')).toBe(false);
  });

  it('targets nothing in single-control mode when there are several controls', async () => {
    const { host, el } = await setup();
    host.shouldShowErrors.set(true);
    host.ariaDescribedBy.set('owned-error');
    await stable();
    expect(el('second').getAttribute('aria-invalid')).toBe('true');

    host.mode.set('single-control');
    await stable();

    for (const id of ['first', 'second', 'combo']) {
      expect(el(id).hasAttribute('aria-invalid')).toBe(false);
    }
    expect(el('first').getAttribute('aria-describedby')).toBe('consumer-hint');
    expect(el('second').hasAttribute('aria-describedby')).toBe(false);
  });

  it('targets the only control in single-control mode', async () => {
    const { host, el } = await setup();
    host.mode.set('single-control');
    host.shouldShowErrors.set(true);
    await stable();
    expect(el('first').hasAttribute('aria-invalid')).toBe(false);

    // Leave a single control in the host.
    for (const id of ['second', 'combo', 'slider']) {
      el(id).remove();
    }
    host.showSecond.set(false);
    await stable();

    await vi.waitFor(() => {
      expect(ids(host.controller.formControls())).toEqual(['first']);
      expect(el('first').getAttribute('aria-invalid')).toBe('true');
    });
  });

  it('releases every control and clears the list in none mode', async () => {
    const { host, el } = await setup();
    host.shouldShowErrors.set(true);
    host.ariaDescribedBy.set('owned-error');
    await stable();

    host.mode.set('none');
    await stable();

    expect(host.controller.formControls()).toEqual([]);
    expect(el('first').getAttribute('aria-describedby')).toBe('consumer-hint');
    expect(el('first').hasAttribute('aria-invalid')).toBe(false);
  });

  it('manages aria-required, skipping role="slider"', async () => {
    const { host, el } = await setup();

    host.ariaRequired.set(true);
    await stable();

    expect(el('first').getAttribute('aria-required')).toBe('true');
    expect(el('combo').getAttribute('aria-required')).toBe('true');
    expect(el('slider').hasAttribute('aria-required')).toBe(false);

    host.ariaRequired.set(false);
    await stable();

    expect(el('first').hasAttribute('aria-required')).toBe(false);
  });

  it('keeps a consumer-provided aria-required when the input turns off', async () => {
    const { host, el } = await setup();

    host.ariaRequired.set(true);
    await stable();
    host.ariaRequired.set(false);
    await stable();

    expect(el('second').getAttribute('aria-required')).toBe('true');
    expect(el('combo').hasAttribute('aria-required')).toBe(false);
  });

  it('refreshes the control list when controls are removed from the DOM', async () => {
    const { host } = await setup();

    host.showSecond.set(false);
    await stable();

    // MutationObserver callbacks are delivered as microtasks.
    await vi.waitFor(() => {
      expect(ids(host.controller.formControls())).toEqual([
        'first',
        'combo',
        'slider',
      ]);
    });
  });
});
