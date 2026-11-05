# Security Policy

## Reporting a vulnerability

Please report suspected security vulnerabilities through
[GitHub Private Vulnerability Reporting](https://github.com/ngx-vest-forms/ngx-vest-forms/security/advisories/new).
Do not open a public issue, pull request, or discussion for a security report.

Include as much of the following as you can:

- A description of the issue and the impact you see
- The affected version(s) and the commit SHA you tested against
- A minimal reproduction (a small Angular app, a code snippet, or a test)
- Whether the issue is reachable from the published `ngx-vest-forms` package
  (not just the examples app or docs)

You can expect an acknowledgement within 7 days. We will keep you informed as
we triage and, if confirmed, as we prepare a fix and a release.

## Supported versions

| Branch | Version | Supported |
|---|---|---|
| `master` | v3 (current line) | Yes — security fixes land here first |
| `release/v2.x` | 2.x | Security patches only |
| `release/v1.x` | 1.x | Security patches only |

Fixes are published through the normal release workflow
(`.github/workflows/cd.yml`, manual dispatch with approval on the
`npm-publish` environment). If a fix is urgent we may publish a patch release
on the affected maintenance line ahead of the next scheduled release.

## Scope

`ngx-vest-forms` is a client-side Angular form-validation library. It runs in
the browser, makes no network requests, does not persist or transmit form
data, and holds no secrets. (The Form Model lives in browser memory while the
form is in use; nothing is written to storage or sent anywhere.)
The realistic vulnerability classes for this package are:

- **Cross-site scripting (XSS)** — if any user-controlled value can reach an
  unsafe DOM sink (`innerHTML`, `bypassSecurityTrust*`, `DomSanitizer`).
  The library's templates use only Angular's auto-escaped `{{ }}`
  interpolation, and the source contains no `innerHTML` or sanitizer bypasses.
- **Prototype pollution** — if a field path or form value containing
  `__proto__`, `prototype`, or `constructor` can mutate an object's prototype.
  The library blocks these keys at every object-write path
  (`setValueAtPath`, `copyFormValue`, `objectToArray`); see
  [Field Paths — Security](./docs/FIELD-PATHS.md#security-dynamic-path-inputs).
- **Dependency / supply-chain issues** — a vulnerable transitive dependency
  that is reachable from the published bundle. CI runs `pnpm audit` and
  `pnpm audit signatures` on every pull request, and `pnpm-workspace.yaml`
  enforces a 24-hour `minimumReleaseAge`, `no-downgrade` trust policy, and a
  strict install-script allowlist.

Client-side validation is **not** a security boundary. Vest suites and
`ngx-vest-forms` improve UX and data quality in the browser; always validate
and authorize on the server.

## Out of scope

- Vulnerabilities in the examples app (`apps/examples`) that do not affect the
  published library. The examples app is a documentation tool, runs without a
  backend, and handles no real user data.
- Denial of service against a consuming application through extremely large
  form models — resource limits are the application's responsibility.
- Issues that require the application to pass user-controlled input into a
  library API in an unsafe way (for example, building a CSS selector for
  `NgxFirstInvalidOptions.invalidSelector` from user input). The library's own
  defaults are safe; how an application feeds values into them is the
  application's threat model.

## Safe harbor

We consider security research done in good faith and within this policy to be
authorized. We will not pursue legal action against researchers who avoid
privacy violations, data exfiltration, and service disruption, and who give us
reasonable time to fix a confirmed issue before public disclosure.
