/*
 * Public API Surface of ngx-vest-forms/schemas
 */

export {
  clearCustomAdapters,
  registerSchemaAdapter,
  toStandardSchemaViaRegistry,
} from './src/lib/adapter-registry';
export type { SchemaAdapter } from './src/lib/adapters/schema-adapter.interface';
export { NgxVestFormWithSchemaDirective } from './src/lib/form-with-schema.directive';
export {
  fromArkType,
  fromValibot,
  fromZod,
  // DX alias: clearer name for normalization utility
  toAnyRuntimeSchema as normalizeToRuntimeSchema,
  toAnyRuntimeSchema,
  type ThirdPartyRuntimeAdapters,
} from './src/lib/runtime-adapters';
export {
  isRuntimeSchema,
  toRuntimeSchema,
  type NgxParseFailure,
  type NgxParseResult,
  type NgxParseSuccess,
  type NgxRuntimeSchema,
  type NgxSchemaIssue,
} from './src/lib/runtime-schema';
export {
  InferSchemaType,
  SchemaDefinition,
  isStandardSchema,
  ngxExtractTemplateFromSchema,
  ngxModelToStandardSchema,
  shapeToSchema,
} from './src/lib/schema-adapter';
export { NgxSchemaValidationDirective } from './src/lib/schema-validation.directive';
