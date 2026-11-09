import {
  afterNextRender,
  DestroyRef,
  ElementRef,
  inject,
  Injector,
  signal,
} from '@angular/core';

/**
 * Marks the per-row Remove buttons that {@link RemovalFeedback} moves focus
 * between. Put it on every row's Remove button inside the component.
 */
export const REMOVE_BUTTON_ATTRIBUTE = 'data-row-remove';

/** How long a removal message stays in the live region. */
const MESSAGE_LIFETIME_MS = 5000;
/** Gap between clearing and setting a message, so a repeat is announced. */
const ANNOUNCE_DELAY_MS = 50;

/**
 * Focus and announcement after a row is removed from a list editor.
 *
 * Create one in a component's field initialiser, render `message()` in a
 * `role="status"` element, and call {@link removed} from the remove handler.
 *
 * Focus rule, the same in every editor: once the list has re-rendered, focus
 * the Remove button now at the removed row's index; if the last row was
 * removed, the previous row's Remove button; with no rows left, the add
 * control. Focus never falls to `<body>`.
 *
 * The live region is cleared before each message and again a few seconds
 * later, so removing the same position twice is announced both times and
 * an old message is not read out later.
 */
export class RemovalFeedback {
  /** Text for the component's `role="status"` element. */
  readonly message = signal('');

  readonly #injector = inject(Injector);
  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly #timers = new Set<ReturnType<typeof setTimeout>>();

  /**
   * @param addControl The control to focus when no rows are left, such as
   *   the Add button or the "add new" input.
   */
  constructor(
    private readonly addControl: () => HTMLElement | null | undefined
  ) {
    inject(DestroyRef).onDestroy(() => this.#clearTimers());
  }

  /**
   * Call after emitting the list without the row at `index`.
   *
   * @param index Zero-based position of the removed row.
   * @param text What to announce, such as "Phone number 2 removed".
   */
  removed(index: number, text: string): void {
    this.#announce(text);
    afterNextRender(() => this.#focusAfterRemoval(index), {
      injector: this.#injector,
    });
  }

  #focusAfterRemoval(index: number): void {
    const buttons = Array.from(
      this.#host.nativeElement.querySelectorAll<HTMLElement>(
        `[${REMOVE_BUTTON_ATTRIBUTE}]`
      )
    );
    let target: HTMLElement | null | undefined;
    if (index < buttons.length) {
      target = buttons[index];
    } else if (buttons.length > 0) {
      target = buttons[buttons.length - 1];
    } else {
      target = this.addControl();
    }
    target?.focus();
  }

  #announce(text: string): void {
    this.#clearTimers();
    this.message.set('');
    this.#later(() => {
      this.message.set(text);
      this.#later(() => this.message.set(''), MESSAGE_LIFETIME_MS);
    }, ANNOUNCE_DELAY_MS);
  }

  #later(callback: () => void, ms: number): void {
    const timer = setTimeout(() => {
      this.#timers.delete(timer);
      callback();
    }, ms);
    this.#timers.add(timer);
  }

  #clearTimers(): void {
    for (const timer of this.#timers) clearTimeout(timer);
    this.#timers.clear();
  }
}
