# ngx-vest-forms Strategic Overview

**Date:** October 7, 2025
**Version:** 2.x
**Status:** Strategic Direction & Roadmap

---

## 🎯 TL;DR

**ngx-vest-forms v2 is philosophically aligned with Angular Signal Forms but intentionally different in implementation.**

### Key Decisions

✅ **DO:**

- Keep Enhanced Proxy API (`form.emailValid()` is superior to `form.email().valid()`)
- Keep Vest.js as validation engine (framework-agnostic, portable)
- Add Standard Schema support (type validation layer)
- Monitor Signal Forms and adopt APIs when stable

❌ **DON'T:**

- Don't align API with Signal Forms (would break unique value)
- Don't create `/signals` package (prototype APIs, loses advantages)
- Don't replace Vest.js (portability is key differentiator)

### Strategic Focus

**Add Standard Schema for Type Validation:**

- Layer 1: Standard Schema (Zod, Valibot, ArkType) → Structure/type checking
- Layer 2: Vest.js → Business logic validation
- Result: Comprehensive validation with ecosystem compatibility

---

## 📊 Quick Comparison

### ngx-vest-forms vs Angular Signal Forms

| Aspect                   | ngx-vest-forms v2            | Angular Signal Forms             | Winner                      |
| ------------------------ | ---------------------------- | -------------------------------- | --------------------------- |
| **Field Access**         | Proxy: `form.email()`        | Function: `form.email().value()` | ngx (fewer keystrokes)      |
| **Validation**           | Vest.js (portable)           | Angular schemas (native)         | ngx (framework-agnostic)    |
| **Template Binding**     | Explicit `[value]`/`(input)` | Auto `[control]`                 | Tie (different use cases)   |
| **Error Display**        | Built-in strategies (WCAG)   | Manual implementation            | ngx (accessibility-first)   |
| **Async Validation**     | `test.memo()` + AbortSignal  | `validateHttp()` + HttpResource  | Tie (different approaches)  |
| **Selective Validation** | `only(field)` ✅             | Not available ❌                 | ngx (performance)           |
| **Ecosystem**            | Vest + Zod/Valibot           | Angular validators               | ngx (broader compatibility) |

**Verdict:** Both excellent - serve different use cases and developer preferences.

---

## 🏗️ Current Architecture Status

### What's Already Aligned (100%)

Both ngx-vest-forms and Angular Signal Forms share:

- ✅ Developer-owned signal model (no framework state duplication)
- ✅ Signal-first reactivity (computed derived state)
- ✅ Bidirectional sync (model ↔ form automatic)
- ✅ Zoneless + OnPush ready
- ✅ Angular 20+ best practices (signal-based APIs)

### Intentional Differences (By Design)

| Feature      | ngx-vest-forms      | Signal Forms           | Reason                   |
| ------------ | ------------------- | ---------------------- | ------------------------ |
| Field Access | `form.emailValid()` | `form.email().valid()` | Better DX, autocomplete  |
| Validation   | Vest.js suite       | Schema function        | Framework portability    |
| Template     | `[value]`/`(input)` | `[control]`            | Works with `only(field)` |
| Errors       | `string[]` WCAG     | `{ kind, message }[]`  | Accessibility focus      |

**Philosophy Alignment: 100% ✅**
**Implementation: Intentionally Different 🎯**

---

## 🚀 Strategic Recommendations

### ✅ DO These Things

#### 1. Add Standard Schema Support (Priority 1)

**Why:** Complement Vest.js with type validation

```typescript
// Layer 1: Type/Structure (Standard Schema)
const UserSchema = z.object({
  email: z.string().email(),
  age: z.number().min(18),
});

// Layer 2: Business Logic (Vest.js)
const userSuite = staticSafeSuite<User>((data) => {
  test('email', 'Already taken', async () => {
    await checkEmailAvailability(data.email);
  });
});

// Combined validation
const form = createVestForm(userSuite, model, {
  schema: UserSchema, // ✅ Type validation layer
});
```

**Benefits:**

- ✅ Runtime type safety
- ✅ Ecosystem compatibility (tRPC, TanStack, Hono)
- ✅ Full-stack validation sharing
- ✅ Better DX (immediate type errors, progressive business errors)

See [STANDARD_SCHEMA_ADAPTERS_GUIDE.md](./STANDARD_SCHEMA_ADAPTERS_GUIDE.md) for implementation details.

#### 2. Keep Enhanced Proxy API

**Why:** Unique value proposition over Signal Forms

```typescript
// ngx-vest-forms (Superior DX)
form.email(); // Signal<string>
form.emailValid(); // Signal<boolean>
form.emailValidation(); // Signal<ValidationMessages>

// Angular Signal Forms (More verbose)
form.email().value(); // Signal<string>
form.email().valid(); // Signal<boolean>
form.email().errors(); // Signal<FormError[]>
```

#### 3. Maintain Vest.js as Core

**Why:** Framework-agnostic validation is differentiator

- ✅ Same suite works in Angular, React, Vue, Node.js
- ✅ Rich features: `test.memo()`, `skipWhen()`, `include().when()`
- ✅ Portable across projects and teams

#### 4. Monitor Signal Forms Progress

**When to act:**

- Re-evaluate when Angular Signal Forms APIs finalized
- Consider adapter if community demands

### ❌ DON'T Do These Things

#### 1. Don't Align Field Access API

**Why:** Would destroy unique value

```typescript
// ❌ BAD: Copy Signal Forms pattern
form.email().value(); // Worse DX, more keystrokes

// ✅ GOOD: Keep proxy pattern
form.email(); // Better DX, fewer keystrokes
```

#### 2. Don't Create `/signals` Package

**Why:** Would lose unique advantages

- ❌ Loses Enhanced Proxy API
- ❌ Loses selective validation (`only(field)`)
- ❌ Loses error strategies (WCAG)

#### 3. Don't Replace Vest.js with Angular Schemas

**Why:** Kills portability

- ❌ Angular-only (can't use in React/Vue/Node.js)
- ❌ Loses ecosystem (Zod, Valibot adapters)
- ❌ Loses advanced features

---

## 🎨 Standard Schema Integration

### The Dual-Layer Approach

**Standard Schema (Type Validation) + Vest.js (Business Validation) = Comprehensive Validation**

```typescript
import { fromZod } from 'ngx-vest-forms/schemas';
import { z } from 'zod';

// Layer 1: Type/Structure Validation
const UserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  age: z.number().min(18),
});

// Layer 2: Business Logic Validation
const userSuite = staticSafeSuite<User>((data) => {
  test('email', 'Email already taken', async ({ signal }) => {
    await checkEmailAvailability(data.email, { signal });
  });

  test('password', 'Password too weak', () => {
    enforce(data.password).matches(/[A-Z]/).matches(/[0-9]/);
  });
});

// Combine both
const form = createVestForm(userSuite, signal({}), {
  schema: fromZod(UserSchema), // Type validation
});

// Merged errors (schema first, then Vest)
form.emailValidation().errors; // ['Invalid email', 'Email already taken']
```

### Why This Works

| Validation Type  | Standard Schema             | Vest.js                     |
| ---------------- | --------------------------- | --------------------------- |
| **Purpose**      | Data structure correctness  | Business logic enforcement  |
| **Use Case**     | API boundaries, parsing     | User input, form submission |
| **When Runs**    | On field setter (immediate) | Based on error strategy     |
| **Error Format** | Path + message              | Field + message             |
| **Cross-Field**  | Limited                     | Rich (`include().when()`)   |
| **Async**        | Not supported               | Built-in (`test.memo()`)    |
| **Portability**  | Universal (25+ libs)        | Universal (any framework)   |

**Complementary, Not Competitive!**

---

## 📅 Implementation Roadmap

### Phase 1: Standard Schema Adapter (2-3 weeks)

**Goal:** Add optional type validation layer

**Tasks:**

1. ✅ Create `SchemaAdapter<T>` interface
2. ✅ Implement `fromZod()`, `fromValibot()`, `fromArkType()` helpers
3. ✅ Integrate into `createVestForm` field setters
4. ✅ Merge schema errors with Vest errors
5. ✅ Add tests + documentation
6. ✅ Create examples (Zod + Vest, Valibot + Vest)

**Deliverable:** `ngx-vest-forms/schemas` package

### Phase 2: Documentation & Examples (1 week)

**Tasks:**

1. ✅ Document Standard Schema integration
2. ✅ Create migration guides
3. ✅ Add Zod/Valibot/ArkType examples
4. ✅ Update README with dual-layer validation
5. ✅ Blog post: "ngx-vest-forms + Standard Schema"

### Phase 3: Vest v6 Integration (When Available)

**Goal:** Export Vest suites as Standard Schema

**Tasks:**

1. ⏳ Monitor Vest.js v6 release
2. ⏳ Add `getStandardSchema()` utility
3. ⏳ Document cross-framework validation sharing
4. ⏳ Update examples with backend integration

### Phase 4: Monitor Signal Forms (Ongoing)

**Tasks:**

1. 🔄 Track Angular Signal Forms stable release
2. 🔄 Re-evaluate integration when APIs finalized
3. 🔄 Consider adapter if community demands
4. 🔄 Maintain documentation of intentional differences

---

## 🎯 Visual Strategy Map

```
Current State                Strategic Path               Future State
┌─────────────────┐         ┌──────────────┐            ┌─────────────────┐
│ ngx-vest-forms  │         │ Add Standard │            │ ngx-vest-forms  │
│ v2 (2025)       │────────►│ Schema       │───────────►│ v3 (2026)       │
│                 │         │ Support      │            │                 │
│ • Vest.js       │         └──────────────┘            │ • Vest.js       │
│ • Signals       │                │                    │ • Signals       │
│ • Enhanced API  │                │                    │ • Enhanced API  │
│                 │                ▼                    │ • Schema Layer  │
└─────────────────┘         ┌──────────────┐            │ • tRPC Ready    │
                            │ Monitor      │            │ • Full-stack    │
                            │ Signal Forms │            └─────────────────┘
                            └──────────────┘
                                   │
                                   ▼
                            Monitor & Re-evaluate
                            (Incremental, Non-breaking)
```

---

## ❓ FAQ

### Q: Should we align with Angular Signal Forms APIs?

**A:** Partially, but keep our advantages:

- ✅ Keep Enhanced Proxy API (better DX)
- ✅ Keep Vest.js (framework-agnostic)
- ✅ Keep explicit binding (works with `only(field)`)
- ✅ Already using Angular 20+ best practices

### Q: Should we create `/signals` package?

**A:** No - would lose unique advantages:

- ❌ Would lose Enhanced Proxy API
- ❌ Would lose selective validation
- ❌ Different value proposition than Signal Forms

### Q: What about Standard Schema integration?

**A:** ✅ **Highly Recommended** - do this first:

- Add Standard Schema for type validation
- Keep Vest.js for business validation
- Best of both worlds (type safety + business logic)

### Q: Can Vest suites be used outside Angular?

**A:** ✅ **Yes!** Framework-agnostic:

- Same suite works in React, Vue, Node.js
- This is our key advantage over Angular-only solutions

### Q: How do we handle async validation?

**A:** Vest's approach is superior:

- `test.memo()` with deps array (caching)
- `skipWhen()` for conditional execution
- AbortSignal for cancellation
- More flexible than Signal Forms' `validateHttp()`

---

## 📊 Decision Matrix

### Options Analysis

| Option                      | Effort    | Value  | Strategic Fit | Recommendation |
| --------------------------- | --------- | ------ | ------------- | -------------- |
| **Standard Schema**         | 2-3 weeks | High   | ✅ Excellent  | ✅ **DO THIS** |
| **Keep Proxy API**          | 0 weeks   | High   | ✅ Excellent  | ✅ **KEEP**    |
| **Monitor Signal Forms**    | Ongoing   | Medium | ✅ Good       | ✅ **MONITOR** |
| **Align with Signal Forms** | 4-6 weeks | Low    | ❌ Poor       | ❌ **SKIP**    |
| **/signals Package**        | 3-4 weeks | Low    | ❌ Poor       | ❌ **WAIT**    |

---

## 🔗 Related Documentation

### Implementation Guides

- **[STANDARD_SCHEMA_ADAPTERS_GUIDE.md](./STANDARD_SCHEMA_ADAPTERS_GUIDE.md)** - Comprehensive implementation guide for Standard Schema adapters (what, why, how)

### Technical Analysis

- **[SIGNAL_FORMS_STANDARD_SCHEMA_COMPATIBILITY.md](./SIGNAL_FORMS_STANDARD_SCHEMA_COMPATIBILITY.md)** - Detailed compatibility analysis with Angular Signal Forms
- **[INTEGRATION_FEASIBILITY_ANALYSIS.md](./INTEGRATION_FEASIBILITY_ANALYSIS.md)** - Feasibility analysis of integration options

### Architecture

- Already using Angular 20+ best practices (signal-based APIs)
- No migration needed for Signal Forms philosophy (100% aligned)
- Intentional differences serve Vest.js better

---

## ✅ Action Items

### Immediate (This Quarter)

- [ ] Implement Standard Schema adapter support
- [ ] Create `fromZod()`, `fromValibot()`, `fromArkType()` helpers
- [ ] Add documentation and examples
- [ ] Publish as `ngx-vest-forms/schemas` package

### Short-Term (Next Quarter)

- [ ] Monitor Angular Signal Forms evolution
- [ ] Update documentation with ecosystem examples
- [ ] Blog post: "ngx-vest-forms + Standard Schema"

### Long-Term (When Available)

- [ ] Vest v6 Standard Schema support
- [ ] Evaluate Signal Forms adoption (if beneficial)
- [ ] Community feedback integration

---

## 🎤 Elevator Pitch (30 seconds)

> "ngx-vest-forms v2 is 100% aligned with Angular Signal Forms **philosophy** but intentionally different in **implementation** to serve Vest.js better.
>
> Our Enhanced Proxy API is more ergonomic than Signal Forms.
> Our Vest.js validation is framework-agnostic (works in React/Vue/Node.js).
> Our next step: Add Standard Schema for type validation (Zod, Valibot, ArkType).
>
> Result: Comprehensive validation (type safety + business logic) with ecosystem compatibility."

---

**Status:** Strategic Direction Finalized
**Next Step:** Implement Standard Schema adapter (Phase 1)
**Decision Date:** October 7, 2025
