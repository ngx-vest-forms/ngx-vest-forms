import { describe, expect, it } from 'vitest';
import {
  extractTemplateFromSchema,
  safeParseWithAnySchema,
} from './schema-utils';

describe('schema-utils', () => {
  describe('extractTemplateFromSchema', () => {
    it('should return the _shape when present', () => {
      const template = { email: '', password: '' } as const;
      const schema = { _shape: template } as const;
      const extracted = extractTemplateFromSchema<typeof template>(schema);
      expect(extracted).toEqual(template);
    });

    it('should return null when _shape is not present', () => {
      const zodLike = { parse: () => 1 };
      const extracted = extractTemplateFromSchema(zodLike);
      expect(extracted).toBeNull();
    });
  });

  describe('safeParseWithAnySchema', () => {
  it('should use runtime safeParse and succeed', () => {
      const runtimeSchema = {
        safeParse: () => ({ success: true, meta: { vendor: 'rt' } }),
      } as const;
      const out = safeParseWithAnySchema(runtimeSchema, { email: 'a' });
      expect(out.success).toBe(true);
      expect(out.issues.length).toBe(0);
      expect(out.meta?.vendor).toBe('rt');
    });

  it('should use runtime safeParse and map issues on failure', () => {
      const runtimeSchema = {
        safeParse: () => ({
          success: false,
          issues: [
            { path: ['email'], message: 'Invalid email' },
            { path: ['password'], message: 'Too short' },
          ],
          meta: { vendor: 'rt' },
        }),
      } as const;
      const out = safeParseWithAnySchema(runtimeSchema, { email: 'x' });
      expect(out.success).toBe(false);
      expect(out.issues.length).toBe(2);
    });

    it('should use ~standard.validate and succeed', () => {
    const standardSchema = {
        ['~standard']: {
          vendor: 'std',
      validate: (data: unknown) => ({ value: data }),
        },
      } as const;
      const out = safeParseWithAnySchema(standardSchema, { email: 'a' });
      expect(out.success).toBe(true);
      expect(out.issues.length).toBe(0);
      expect(out.meta?.vendor).toBe('std');
    });

    it('should use ~standard.validate and map issues on failure', () => {
    const standardSchema = {
        ['~standard']: {
          vendor: 'std',
      validate: () => ({
            issues: [
              { path: 'email', message: 'Invalid' },
              { path: 'password', message: 'Too short' },
            ],
          }),
        },
    } as const;
      const out = safeParseWithAnySchema(standardSchema, { email: 'x' });
      expect(out.success).toBe(false);
      expect(out.issues.length).toBe(2);
      expect(out.meta?.vendor).toBe('std');
    });

    it('should return success for unknown/unsupported schema types', () => {
      const plain = { foo: 'bar' };
      const out = safeParseWithAnySchema(plain, {});
      expect(out.success).toBe(true);
      expect(out.issues.length).toBe(0);
    });
  });
});
