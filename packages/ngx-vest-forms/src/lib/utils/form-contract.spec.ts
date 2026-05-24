import type { StandardSchemaV1 } from '@standard-schema/spec';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NgxDeepRequired } from './deep-required';
import {
  logFormContractIssues,
  normalizeFormContract,
  stringifyFormContractIssuePath,
  validateFormContract,
} from './form-contract';

type Model = {
  firstName: string;
  age: number;
  address: { street: string };
};

const shape: NgxDeepRequired<Model> = {
  firstName: '',
  age: 0,
  address: { street: '' },
};

function makeStandardSchema<T>(
  validate: (
    input: unknown
  ) => StandardSchemaV1.Result<T> | Promise<StandardSchemaV1.Result<T>>
): StandardSchemaV1<T> {
  return {
    '~standard': {
      version: 1,
      vendor: 'test',
      validate,
    },
  };
}

describe('form-contract', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  describe('normalizeFormContract', () => {
    it('returns Standard Schema inputs unchanged', () => {
      const schema = makeStandardSchema<Model>((value) => ({
        value: value as Model,
      }));

      const result = normalizeFormContract(schema);

      expect(result).toBe(schema);
    });

    it('wraps NgxDeepRequired shape objects through toFormContract', () => {
      const result = normalizeFormContract<Model>(shape);

      expect(result['~standard'].version).toBe(1);
      expect(result['~standard'].vendor).toBe('ngx-vest-forms');
      expect(typeof result['~standard'].validate).toBe('function');

      const validateResult = result['~standard'].validate({
        firstName: 'Ada',
        age: 30,
        address: { street: 'Main' },
      });
      expect(validateResult).toEqual({
        value: { firstName: 'Ada', age: 30, address: { street: 'Main' } },
      });
    });

    it('treats objects without the ~standard key as shapes', () => {
      const result = normalizeFormContract({
        firstName: '',
      } as NgxDeepRequired<{ firstName: string }>);

      expect(result['~standard'].vendor).toBe('ngx-vest-forms');
    });
  });

  describe('stringifyFormContractIssuePath', () => {
    it('returns "<root>" when the path is missing', () => {
      expect(stringifyFormContractIssuePath()).toBe('<root>');
    });

    it('returns "<root>" when the path is empty', () => {
      expect(stringifyFormContractIssuePath([])).toBe('<root>');
    });

    it('renders a flat string path with dots', () => {
      expect(stringifyFormContractIssuePath(['user', 'name'])).toBe(
        'user.name'
      );
    });

    it('renders numeric segments with bracket notation', () => {
      expect(stringifyFormContractIssuePath(['addresses', 0, 'street'])).toBe(
        'addresses[0].street'
      );
    });

    it('unwraps Standard Schema PathSegment objects via their key', () => {
      const segments: ReadonlyArray<StandardSchemaV1.PathSegment> = [
        { key: 'addresses' },
        { key: 0 },
        { key: 'street' },
      ];

      expect(stringifyFormContractIssuePath(segments)).toBe(
        'addresses[0].street'
      );
    });

    it('mixes PropertyKey segments and PathSegment objects in one path', () => {
      const segments = ['users', { key: 0 }, 'email'] as ReadonlyArray<
        string | StandardSchemaV1.PathSegment
      >;

      expect(stringifyFormContractIssuePath(segments)).toBe('users[0].email');
    });

    it('coerces symbol segments to their string label', () => {
      const sym = Symbol('hidden');
      const result = stringifyFormContractIssuePath([sym]);

      expect(result).toBe('Symbol(hidden)');
    });

    it('falls back to "<root>" when stringifying yields an empty string', () => {
      const result = stringifyFormContractIssuePath(['']);

      expect(result).toBe('<root>');
    });
  });

  describe('logFormContractIssues', () => {
    it('is a no-op when issues are undefined', () => {
      logFormContractIssues();

      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('is a no-op when issues are empty', () => {
      logFormContractIssues([]);

      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('emits one NGX-004 warning per issue with the stringified path', () => {
      logFormContractIssues([
        { message: 'must be a number', path: ['age'] },
        { message: 'too short', path: ['address', 'street'] },
      ]);

      expect(warnSpy).toHaveBeenCalledTimes(2);
      const first = warnSpy.mock.calls[0]?.[0] as string;
      const second = warnSpy.mock.calls[1]?.[0] as string;

      expect(first).toContain('[NGX-004]');
      expect(first).toContain("issue at 'age'");
      expect(first).toContain('must be a number');

      expect(second).toContain('[NGX-004]');
      expect(second).toContain("issue at 'address.street'");
      expect(second).toContain('too short');
    });

    it('renders "<root>" when an issue has no path', () => {
      logFormContractIssues([{ message: 'root-level problem' }]);

      const message = warnSpy.mock.calls[0]?.[0] as string;
      expect(message).toContain("issue at '<root>'");
      expect(message).toContain('root-level problem');
    });
  });

  describe('validateFormContract', () => {
    it('logs no warnings when the schema reports no issues', () => {
      const contract = makeStandardSchema<Model>((value) => ({
        value: value as Model,
      }));

      validateFormContract({} as Model, contract);

      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('emits a warning for each synchronous Standard Schema issue', () => {
      const contract = makeStandardSchema<Model>(() => ({
        issues: [
          { message: 'expected number', path: ['age'] },
          { message: 'too short', path: ['firstName'] },
        ],
      }));

      validateFormContract({} as Model, contract);

      expect(warnSpy).toHaveBeenCalledTimes(2);
      expect(warnSpy.mock.calls[0]?.[0]).toContain("issue at 'age'");
      expect(warnSpy.mock.calls[1]?.[0]).toContain("issue at 'firstName'");
    });

    it('skips async validators silently', () => {
      const contract = makeStandardSchema<Model>(async (value) => ({
        value: value as Model,
      }));

      validateFormContract({} as Model, contract);

      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('runs shape validation when given an NgxDeepRequired shape', () => {
      validateFormContract(
        { firstName: 'Ada', age: 30, extra: 'oops' } as unknown as Model,
        shape
      );

      // validateShape emits an NGX-001 extra-property warning for `extra`.
      expect(warnSpy).toHaveBeenCalled();
      const messages = warnSpy.mock.calls.map(
        (call: unknown[]) => call[0] as string
      );
      expect(messages.some((m: string) => m.includes('[NGX-001]'))).toBe(true);
      expect(messages.some((m: string) => m.includes("'extra'"))).toBe(true);
    });
  });
});
