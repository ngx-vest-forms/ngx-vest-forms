/**
 * Smart state management options for form data merging
 * @template TModel The type of the form model/value
 */
export type SmartStateOptions<TModel> = {
  /** Strategy for handling external data changes */
  mergeStrategy?: 'replace' | 'preserve' | 'smart';
  /** Fields to preserve during external updates (supports dot notation for nested fields) */
  preserveFields?: string[];
  /** Enable conflict detection and resolution */
  conflictResolution?: boolean;
  /** Callback when conflicts are detected - return resolved value or 'prompt-user' for manual resolution */
  onConflict?: (local: TModel, external: TModel) => TModel | 'prompt-user';
};

/**
 * Type representing conflict state for smart state management
 * @template TModel The type of the form model/value
 */
export type ConflictState<TModel> = {
  /** The local (form) state that conflicts */
  local: TModel;
  /** The external state that conflicts */
  external: TModel;
  /** When the conflict was detected */
  timestamp: number;
} | null;
