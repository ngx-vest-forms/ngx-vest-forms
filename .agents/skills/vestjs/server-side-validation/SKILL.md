---
name: server-side-validation
description: Vest 6 on a server. Read it for request or DTO validation, `runStatic`, isolation between requests, error responses, fail-fast modes, `SuiteSerializer`, or SSR hydration of validation state.
---

# Vest 6 server-side validation

The invariants live in the router, [`../SKILL.md`](../SKILL.md).

## Validate a request

A server validates each request in isolation, so the run is `suite.runStatic(data)`: it starts from an empty state every time, and no result of one user reaches another.

```ts
import { create, enforce, test } from 'vest';

type SignupRequest = { email?: string; password?: string };

const signupSuite = create((data: SignupRequest) => {
  test('email', 'Email is required', () => {
    enforce(data.email).isNotBlank();
  });
  test('password', 'Password has at least 12 characters', () => {
    enforce(data.password).longerThanOrEquals(12);
  });
});

export async function validateSignup(body: SignupRequest) {
  const result = await signupSuite.runStatic(body);

  return result.isValid()
    ? { ok: true as const }
    : { ok: false as const, errors: result.getErrors() };
}
```

- `await` the run whenever the suite has, or may get, async tests; the response then uses the settled result.
- `result.getErrors()` is a map of field name to messages, ready for the response body.
- Share the suite file between client and server: the client calls `suite.only(field).run(data)`, the server calls `suite.runStatic(data)`.

## Choose the mode

| The response needs               | Mode                    |
| -------------------------------- | ----------------------- |
| the first problem per field      | `Modes.EAGER` (default) |
| every problem per field          | `Modes.ALL`             |
| one problem, as fast as possible | `Modes.ONE`             |

Set it with `mode(...)` at the top of the suite callback; [`../results-groups-and-types/SKILL.md`](../results-groups-and-types/SKILL.md) has the example.

## Carry state to the client

For SSR or a server action that returns validation state, serialize the server result and resume the client suite from it:

```ts
import { SuiteSerializer } from 'vest/SuiteSerializer';
import { signupSuite } from './signup.suite';

// server: the string travels to the client with the response
export function serializeSignup(body: unknown): string {
  return SuiteSerializer.serialize(signupSuite.runStatic(body));
}

// client: the suite continues from the server's result
export function resumeSignup(serialized: string): void {
  SuiteSerializer.resume(signupSuite, serialized);
}
```

Use this only when the client must continue from the server's result; a plain API validation returns `getErrors()`.

## Answer shape

Start from `runStatic`, show the input, the run and the response body, and name the mode when the user asks about the response contents.

The docs pages are `https://vestjs.dev/docs/server_side_validations` and `https://vestjs.dev/docs/suite_serialization`; the guides `client-server-validation` and `nextjs-server-actions` under `https://vestjs.dev/docs/guides/` show full flows.
