import { NgxDeepPartial, NgxDeepRequired } from 'ngx-vest-forms';

/**
 * Model for the Custom Controls demo.
 *
 * Every value here is produced by a non-native control built on Angular's
 * `ControlValueAccessor`, yet the model shape is identical to what a native
 * input form would use — `NgxDeepPartial` because the template owns the truth.
 */
export type CustomControlsModel = NgxDeepPartial<{
  /** 1–5 star rating, emitted by `ngx-star-rating`. */
  rating: number;
  /** Single-select experience level, emitted by `ngx-segmented-control`. */
  experience: string;
  /** Free-form tags, emitted by `ngx-tag-input`. */
  tags: string[];
}>;

/**
 * The fully-required mirror of {@link CustomControlsModel}. Supplied via
 * `provideFormContract` so ngx-vest-forms can warn (in dev) when a `name`
 * attribute drifts from the model — exactly as with native inputs.
 */
export const customControlsContract: NgxDeepRequired<CustomControlsModel> = {
  rating: 0,
  experience: '',
  tags: [],
};
