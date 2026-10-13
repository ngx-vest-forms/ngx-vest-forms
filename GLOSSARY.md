# ngx-vest-forms workspace

The repository that builds, tests and publishes the `ngx-vest-forms` Angular library, together with the app that demonstrates it.

## Language

**Published Package**:
A package built with Angular package semantics and published to npm for external consumers. `packages/` holds only published packages.
_Avoid_: publishable library, npm package

**Stable Import Path**:
The import specifier consumers use (`ngx-vest-forms`). It stays the same through any internal workspace change.

**Examples App**:
The runnable application that demonstrates and exercises the library. It is built and deployed, never published to npm.
_Avoid_: demo app, companion app, playground

**Examples E2E App**:
The end-to-end test project that checks the behaviour of the Examples App.
