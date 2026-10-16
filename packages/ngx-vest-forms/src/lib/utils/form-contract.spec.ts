import type { StandardSchemaV1 } from '@standard-schema/spec';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  logFormContractIssues,
  normalizeFormContract,
  stringifyFormContractIssuePath,
  validateFormContract,
} from './form-contract';

type Model = { name: string };

function schemaReturning(
  result:
    StandardSchemaV1.Result<Model> | Promise<StandardSchemaV1.Result<Model>>
): StandardSchemaV1<Model> {
  return {
    '~standard': { version: 1, vendor: 'test', validate: () => result },
  };
}

describe('stringifyFormContractIssuePath', () => {
  it('returns <root> for a missing or empty path', () => {
    expect(stringifyFormContractIssuePath()).toBe('<root>');
    expect(stringifyFormContractIssuePath([])).toBe('<root>');
  });

  it('joins property keys with dots', () => {
    expect(stringifyFormContractIssuePath(['address', 'street'])).toBe(
      'address.street'
    );
  });

  it('formats numeric segments as array indices', () => {
    expect(stringifyFormContractIssuePath(['items', 0, 'name'])).toBe(
      'items[0].name'
    );
  });

  it('unwraps Standard Schema { key } path segments', () => {
    const path: StandardSchemaV1.PathSegment[] = [
      { key: 'phones' },
      { key: 2 },
      { key: 'number' },
    ];
    expect(stringifyFormContractIssuePath(path)).toBe('phones[2].number');
  });

  it('accepts a mix of plain keys and { key } segments', () => {
    expect(stringifyFormContractIssuePath(['user', { key: 'email' }])).toBe(
      'user.email'
    );
  });

  it('coerces symbol keys to their string form', () => {
    expect(stringifyFormContractIssuePath([Symbol('meta')])).toBe(
      'Symbol(meta)'
    );
    expect(stringifyFormContractIssuePath(['data', { key: Symbol('x') }])).toBe(
      'data.Symbol(x)'
    );
  });
});

describe('logFormContractIssues', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('does nothing for undefined or empty issues', () => {
    logFormContractIssues();
    logFormContractIssues([]);

    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('logs one NGX-004 warning per issue with the stringified path', () => {
    logFormContractIssues([
      { message: 'Expected string', path: ['user', { key: 'email' }] },
      { message: 'Expected number', path: ['items', 1, 'qty'] },
    ]);

    expect(warnSpy).toHaveBeenCalledTimes(2);
    expect(warnSpy.mock.calls[0][0]).toMatch(
      /^\[NGX-004\] Form contract issue at 'user\.email': Expected string\n/
    );
    expect(warnSpy.mock.calls[1][0]).toMatch(
      /^\[NGX-004\] Form contract issue at 'items\[1\]\.qty': Expected number\n/
    );
  });

  it('labels issues without a path as <root>', () => {
    logFormContractIssues([{ message: 'Expected object' }]);

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        "Form contract issue at '<root>': Expected object"
      )
    );
  });

  it('appends the form-contract hint from logWarning', () => {
    logFormContractIssues([{ message: 'bad', path: ['a'] }]);

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Check your [formContract] input')
    );
  });
});

describe('normalizeFormContract', () => {
  it('returns a Standard Schema unchanged', () => {
    const schema = schemaReturning({ value: { name: 'a' } });
    expect(normalizeFormContract<Model>(schema)).toBe(schema);
  });

  it('wraps a plain shape object in a Standard Schema', () => {
    const normalized = normalizeFormContract<Model>({ name: '' });
    expect(normalized['~standard'].vendor).toBe('ngx-vest-forms');
    expect(normalized['~standard'].validate({ name: 'x' })).toEqual({
      value: { name: 'x' },
    });
  });
});

describe('validateFormContract', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('logs the issues of a synchronous Standard Schema result', () => {
    validateFormContract<Model>(
      { name: 'a' },
      schemaReturning({ issues: [{ message: 'Too short', path: ['name'] }] })
    );

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        "[NGX-004] Form contract issue at 'name': Too short"
      )
    );
  });

  it('stays silent when the schema reports no issues', () => {
    validateFormContract<Model>(
      { name: 'a' },
      schemaReturning({ value: { name: 'a' } })
    );
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('ignores async schema results, including rejections', async () => {
    const rejection = Promise.reject(new Error('async boom'));
    validateFormContract<Model>({ name: 'a' }, schemaReturning(rejection));
    validateFormContract<Model>(
      { name: 'a' },
      schemaReturning(
        Promise.resolve({ issues: [{ message: 'late', path: ['name'] }] })
      )
    );

    // Let both promises settle; an unhandled rejection would fail the run.
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('warns about extra properties when given a plain shape contract', () => {
    validateFormContract<Model>(
      { name: 'a', extra: true } as unknown as Model,
      { name: '' }
    );

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('extra'));
  });
});
