// Ambient module to silence missing optional ArkType internal config import types.
declare module '@ark/schema/config' {
  // Minimal placeholder type to satisfy ArkType .d.ts reference; actual runtime not imported here.
  // Chosen as object to signal non-null object shape without enforcing members.
  export type ArkSchemaConfig = object;
}
