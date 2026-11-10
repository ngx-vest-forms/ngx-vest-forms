import type { NgxDeepPartial, NgxDeepRequired } from 'ngx-vest-forms';

/**
 * Model for the Signal Forms interop demo.
 *
 * `seats` comes from a `FormValueControl` and `acceptTerms` from a
 * `FormCheckboxControl`, both from `@angular/forms/signals`. `lockSeats` is a
 * plain native checkbox that disables the seat stepper. The model shape is the
 * same one a native-input form would use.
 */
export type SignalFormsInteropModel = NgxDeepPartial<{
  /** Number of seats, 1–8, emitted by `ngx-seat-stepper`. */
  seats: number;
  /** Native checkbox: locks (disables) the seat stepper. */
  lockSeats: boolean;
  /** Must be `true`, emitted by `ngx-consent-switch`. */
  acceptTerms: boolean;
}>;

/** Fully-required mirror of the model, for dev-mode `name` diagnostics. */
export const signalFormsInteropContract: NgxDeepRequired<SignalFormsInteropModel> =
  {
    seats: 0,
    lockSeats: false,
    acceptTerms: false,
  };

/** Seat bounds shared by the stepper and the suite. */
export const SEAT_LIMITS = { min: 1, max: 8 } as const;
