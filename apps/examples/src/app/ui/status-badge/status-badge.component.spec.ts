import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StatusBadge } from './status-badge.component';

@Component({
  imports: [StatusBadge],
  template: `<ngx-status-badge
    [valid]="valid()"
    [pending]="pending()"
    [pristine]="pristine()"
  />`,
})
class HostComponent {
  readonly valid = signal(true);
  readonly pending = signal(false);
  readonly pristine = signal(false);
}

function render(
  state: Partial<Record<'valid' | 'pending' | 'pristine', boolean>>
) {
  const fixture = TestBed.createComponent(HostComponent);
  const host = fixture.componentInstance;
  host.valid.set(state.valid ?? true);
  host.pending.set(state.pending ?? false);
  host.pristine.set(state.pristine ?? false);
  fixture.detectChanges();
  return fixture.nativeElement.querySelector('span') as HTMLSpanElement;
}

describe('StatusBadge', () => {
  it('colours the pending state', () => {
    const badge = render({ pending: true, pristine: false });

    expect(badge.textContent?.trim()).toBe('Pending');
    expect(badge.classList).toContain('bg-gray-100');
    expect(badge.classList).toContain('text-gray-700');
    expect(badge.classList).toContain('dark:bg-gray-700');
    expect(badge.classList).toContain('dark:text-gray-200');
  });

  it('colours the pristine state', () => {
    const badge = render({ pristine: true });

    expect(badge.textContent?.trim()).toBe('Pristine');
    expect(badge.classList).toContain('bg-gray-100');
    expect(badge.classList).toContain('text-gray-700');
  });

  it('colours the valid and invalid states', () => {
    const valid = render({ valid: true });
    expect(valid.textContent?.trim()).toBe('Valid');
    expect(valid.classList).toContain('bg-green-100');
    expect(valid.classList).not.toContain('bg-gray-100');

    const invalid = render({ valid: false });
    expect(invalid.textContent?.trim()).toBe('Invalid');
    expect(invalid.classList).toContain('bg-red-100');
    expect(invalid.classList).toContain('dark:text-red-300');
  });
});
