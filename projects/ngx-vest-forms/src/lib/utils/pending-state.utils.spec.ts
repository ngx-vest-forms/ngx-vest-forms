import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  createDebouncedPendingState,
  DebouncedPendingStateOptions,
} from './pending-state.utils';

describe('pending-state.utils', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('createDebouncedPendingState', () => {
    it('should create debounced pending state with default options', () => {
      TestBed.runInInjectionContext(() => {
        const isPending = signal(false);
        const result = createDebouncedPendingState(isPending);

        expect(result.showPendingMessage).toBeDefined();
        expect(result.cleanup).toBeDefined();
        expect(typeof result.cleanup).toBe('function');
        expect(result.showPendingMessage()).toBe(false);
      });
    });

    it('should not show pending message immediately when validation starts', () => {
      TestBed.runInInjectionContext(() => {
        const isPending = signal(false);
        const result = createDebouncedPendingState(isPending);

        // Start validation
        isPending.set(true);

        // Should not show immediately
        expect(result.showPendingMessage()).toBe(false);
      });
    });

    it('should show pending message after showAfter delay (default 200ms)', () => {
      TestBed.runInInjectionContext(() => {
        const isPending = signal(false);
        const result = createDebouncedPendingState(isPending);

        // Start validation
        isPending.set(true);
        expect(result.showPendingMessage()).toBe(false);

        // Advance time by 199ms (just before threshold)
        vi.advanceTimersByTime(199);
        expect(result.showPendingMessage()).toBe(false);

        // Advance to 200ms (at threshold)
        vi.advanceTimersByTime(1);
        expect(result.showPendingMessage()).toBe(true);
      });
    });

    it('should use custom showAfter delay', () => {
      TestBed.runInInjectionContext(() => {
        const isPending = signal(false);
        const options: DebouncedPendingStateOptions = { showAfter: 300 };
        const result = createDebouncedPendingState(isPending, options);

        isPending.set(true);
        expect(result.showPendingMessage()).toBe(false);

        vi.advanceTimersByTime(299);
        expect(result.showPendingMessage()).toBe(false);

        vi.advanceTimersByTime(1);
        expect(result.showPendingMessage()).toBe(true);
      });
    });

    it('should not show pending message if validation completes before showAfter delay', async () => {
      await TestBed.runInInjectionContext(async () => {
        const isPending = signal(false);
        const result = createDebouncedPendingState(isPending);

        // Start validation
        isPending.set(true);
        await vi.advanceTimersByTimeAsync(0); // Flush effects
        expect(result.showPendingMessage()).toBe(false);

        // Complete validation before 200ms
        await vi.advanceTimersByTimeAsync(150);
        isPending.set(false);
        await vi.advanceTimersByTimeAsync(0); // Flush effects

        // Advance past the original showAfter delay
        await vi.advanceTimersByTimeAsync(100);
        expect(result.showPendingMessage()).toBe(false);
      });
    });

    it('should keep pending message visible for minimum duration after shown (default 500ms)', async () => {
      await TestBed.runInInjectionContext(async () => {
        const isPending = signal(false);
        const result = createDebouncedPendingState(isPending);

        // Start and show pending message
        isPending.set(true);
        await vi.advanceTimersByTimeAsync(200); // Show after delay
        expect(result.showPendingMessage()).toBe(true);

        // Complete validation immediately
        isPending.set(false);
        await vi.advanceTimersByTimeAsync(0); // Flush effects
        expect(result.showPendingMessage()).toBe(true); // Still visible

        // Advance 499ms (just before minimum)
        await vi.advanceTimersByTimeAsync(499);
        expect(result.showPendingMessage()).toBe(true);

        // Advance to 500ms (at minimum)
        await vi.advanceTimersByTimeAsync(1);
        expect(result.showPendingMessage()).toBe(false);
      });
    });

    it('should use custom minimumDisplay duration', async () => {
      await TestBed.runInInjectionContext(async () => {
        const isPending = signal(false);
        const options: DebouncedPendingStateOptions = {
          showAfter: 200,
          minimumDisplay: 1000,
        };
        const result = createDebouncedPendingState(isPending, options);

        // Show pending message
        isPending.set(true);
        await vi.advanceTimersByTimeAsync(200);
        expect(result.showPendingMessage()).toBe(true);

        // Complete validation
        isPending.set(false);
        await vi.advanceTimersByTimeAsync(0); // Flush effects

        // Should stay visible for 1000ms
        await vi.advanceTimersByTimeAsync(999);
        expect(result.showPendingMessage()).toBe(true);

        await vi.advanceTimersByTimeAsync(1);
        expect(result.showPendingMessage()).toBe(false);
      });
    });

    it('should handle multiple rapid validation cycles correctly', async () => {
      await TestBed.runInInjectionContext(async () => {
        const isPending = signal(false);
        const result = createDebouncedPendingState(isPending);

        // First validation - quick completion (no message shown)
        isPending.set(true);
        await vi.advanceTimersByTimeAsync(100);
        isPending.set(false);
        await vi.advanceTimersByTimeAsync(0); // Flush effects
        expect(result.showPendingMessage()).toBe(false);

        // Second validation - slow completion (message shown)
        isPending.set(true);
        await vi.advanceTimersByTimeAsync(200);
        expect(result.showPendingMessage()).toBe(true);

        isPending.set(false);
        await vi.advanceTimersByTimeAsync(500);
        expect(result.showPendingMessage()).toBe(false);

        // Third validation - quick completion (no message shown)
        isPending.set(true);
        await vi.advanceTimersByTimeAsync(50);
        isPending.set(false);
        await vi.advanceTimersByTimeAsync(500);
        expect(result.showPendingMessage()).toBe(false);
      });
    });

    it('should cancel showAfter timeout if validation restarts during delay', async () => {
      await TestBed.runInInjectionContext(async () => {
        const isPending = signal(false);
        const result = createDebouncedPendingState(isPending);

        // Start first validation
        isPending.set(true);
        await vi.advanceTimersByTimeAsync(150);

        // Restart validation (complete and start again)
        isPending.set(false);
        await vi.advanceTimersByTimeAsync(0); // Flush effects
        isPending.set(true);
        await vi.advanceTimersByTimeAsync(0); // Flush effects

        // Original timeout should be cancelled, new one starts
        await vi.advanceTimersByTimeAsync(100); // Total 250ms from first start, but only 100ms from restart
        expect(result.showPendingMessage()).toBe(false);

        // Advance to complete second delay
        await vi.advanceTimersByTimeAsync(100); // 200ms from restart
        expect(result.showPendingMessage()).toBe(true);
      });
    });

    it('should cancel minimumDisplay timeout if validation restarts', async () => {
      await TestBed.runInInjectionContext(async () => {
        const isPending = signal(false);
        const result = createDebouncedPendingState(isPending);

        // Show pending message
        isPending.set(true);
        await vi.advanceTimersByTimeAsync(200);
        expect(result.showPendingMessage()).toBe(true);

        // Complete validation
        isPending.set(false);
        await vi.advanceTimersByTimeAsync(100); // 100ms into minimum display

        // Restart validation - should cancel minimum display timeout
        isPending.set(true);
        await vi.advanceTimersByTimeAsync(0); // Flush effects
        expect(result.showPendingMessage()).toBe(true);

        // Complete quickly
        await vi.advanceTimersByTimeAsync(100);
        isPending.set(false);
        await vi.advanceTimersByTimeAsync(0); // Flush effects

        // Should still show because new validation was shown
        expect(result.showPendingMessage()).toBe(true);

        // Complete new minimum display
        await vi.advanceTimersByTimeAsync(500);
        expect(result.showPendingMessage()).toBe(false);
      });
    });

    it('should provide working cleanup function', () => {
      TestBed.runInInjectionContext(() => {
        const isPending = signal(false);
        const result = createDebouncedPendingState(isPending);

        // Start validation
        isPending.set(true);
        vi.advanceTimersByTime(100);

        // Call cleanup manually
        result.cleanup();

        // Advance past showAfter delay - message should not appear because cleanup was called
        vi.advanceTimersByTime(200);
        expect(result.showPendingMessage()).toBe(false);
      });
    });

    it('should handle cleanup during minimumDisplay timeout', () => {
      TestBed.runInInjectionContext(() => {
        const isPending = signal(false);
        const result = createDebouncedPendingState(isPending);

        // Show pending message
        isPending.set(true);
        vi.advanceTimersByTime(200);
        expect(result.showPendingMessage()).toBe(true);

        // Complete validation
        isPending.set(false);
        vi.advanceTimersByTime(100); // 100ms into minimum display

        // Call cleanup
        result.cleanup();

        // Message should remain true (cleanup doesn't reset the signal)
        // but advancing timers should not hide it (timeout was cleared)
        vi.advanceTimersByTime(1000);
        expect(result.showPendingMessage()).toBe(true);
      });
    });

    it('should work with custom options set to zero', async () => {
      await TestBed.runInInjectionContext(async () => {
        const isPending = signal(false);
        const options: DebouncedPendingStateOptions = {
          showAfter: 0,
          minimumDisplay: 0,
        };
        const result = createDebouncedPendingState(isPending, options);

        // Should show after 0ms delay (setTimeout with 0 still needs to execute)
        isPending.set(true);
        await vi.runAllTimersAsync(); // Run the 0ms timeout
        expect(result.showPendingMessage()).toBe(true);

        // Should hide after 0ms minimum
        isPending.set(false);
        await vi.runAllTimersAsync(); // Run the 0ms timeout
        expect(result.showPendingMessage()).toBe(false);
      });
    });

    it('should return readonly signal that cannot be modified externally', () => {
      TestBed.runInInjectionContext(() => {
        const isPending = signal(false);
        const result = createDebouncedPendingState(isPending);

        // The signal should be readonly (no .set method)
        expect((result.showPendingMessage as any).set).toBeUndefined();
      });
    });

    it('should handle long-running validations correctly', async () => {
      await TestBed.runInInjectionContext(async () => {
        const isPending = signal(false);
        const result = createDebouncedPendingState(isPending);

        // Start long validation
        isPending.set(true);

        // Show message after delay
        await vi.advanceTimersByTimeAsync(200);
        expect(result.showPendingMessage()).toBe(true);

        // Validation continues for a long time
        await vi.advanceTimersByTimeAsync(5000);
        expect(result.showPendingMessage()).toBe(true);

        // Finally complete
        isPending.set(false);
        await vi.advanceTimersByTimeAsync(0); // Flush effects
        expect(result.showPendingMessage()).toBe(true);

        // Hide after minimum display
        await vi.advanceTimersByTimeAsync(500);
        expect(result.showPendingMessage()).toBe(false);
      });
    });

    it('should work correctly with all custom options', async () => {
      await TestBed.runInInjectionContext(async () => {
        const isPending = signal(false);
        const options: DebouncedPendingStateOptions = {
          showAfter: 100,
          minimumDisplay: 300,
        };
        const result = createDebouncedPendingState(isPending, options);

        // Show after custom delay
        isPending.set(true);
        await vi.advanceTimersByTimeAsync(100);
        expect(result.showPendingMessage()).toBe(true);

        // Complete validation
        isPending.set(false);
        await vi.advanceTimersByTimeAsync(0); // Flush effects

        // Stay visible for custom minimum
        await vi.advanceTimersByTimeAsync(299);
        expect(result.showPendingMessage()).toBe(true);

        await vi.advanceTimersByTimeAsync(1);
        expect(result.showPendingMessage()).toBe(false);
      });
    });

    it('should handle edge case: validation completes exactly at showAfter delay', async () => {
      await TestBed.runInInjectionContext(async () => {
        const isPending = signal(false);
        const result = createDebouncedPendingState(isPending);

        isPending.set(true);
        await vi.advanceTimersByTimeAsync(200); // Exactly at showAfter
        expect(result.showPendingMessage()).toBe(true);

        // Complete immediately after showing
        isPending.set(false);
        await vi.advanceTimersByTimeAsync(0); // Flush effects
        expect(result.showPendingMessage()).toBe(true);

        // Should respect minimum display
        await vi.advanceTimersByTimeAsync(500);
        expect(result.showPendingMessage()).toBe(false);
      });
    });

    it('should handle state changes during component lifecycle', async () => {
      await TestBed.runInInjectionContext(async () => {
        const isPending = signal(false);
        const result = createDebouncedPendingState(isPending);

        // Simulate validation starting on component init
        isPending.set(true);
        await vi.advanceTimersByTimeAsync(200);
        expect(result.showPendingMessage()).toBe(true);

        // Simulate validation completing before component destroy
        isPending.set(false);
        await vi.advanceTimersByTimeAsync(500);
        expect(result.showPendingMessage()).toBe(false);

        // Cleanup (simulating ngOnDestroy)
        result.cleanup();

        // No errors should occur
        await expect(vi.runAllTimersAsync()).resolves.not.toThrow();
      });
    });
  });
});
