import type { StandardSchemaV1 } from '@standard-schema/spec';
import { arktypeAdapter } from './adapters/arktype.adapter';
import { customModelAdapter } from './adapters/custom-model.adapter';
import type { SchemaAdapter } from './adapters/schema-adapter.interface';
import { valibotAdapter } from './adapters/valibot.adapter';
import { zodAdapter } from './adapters/zod.adapter';

const defaultAdapters: readonly SchemaAdapter[] = [
  // order matters; most specific first
  customModelAdapter,
  zodAdapter,
  valibotAdapter,
  arktypeAdapter,
];

const adapters: SchemaAdapter[] = [...defaultAdapters];

export function registerSchemaAdapter(adapter: SchemaAdapter): void {
  adapters.unshift(adapter);
}

export function clearCustomAdapters(): void {
  adapters.length = 0;
  adapters.push(...defaultAdapters);
}

export function toStandardSchemaViaRegistry<T = unknown>(
  schema: unknown,
): StandardSchemaV1<unknown, T> | null {
  // Already standard
  if (
    schema &&
    typeof schema === 'object' &&
    '~standard' in (schema as object)
  ) {
    return schema as StandardSchemaV1<unknown, T>;
  }
  for (const adapter of adapters) {
    try {
      if (adapter.isSupported(schema)) {
        return adapter.toStandardSchema<T>(schema);
      }
    } catch {
      // ignore and try next
    }
  }
  return null;
}
