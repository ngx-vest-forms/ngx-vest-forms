/**
 * TypeScript Type Compatibility Test
 *
 * This file demonstrates why we use NgxTypedVestSuite for definitions
 * and NgxVestSuite for component properties.
 */

import { staticSuite, test, enforce, only } from 'vest';
import {
  NgxVestSuite,
  NgxTypedVestSuite,
  FormFieldName,
  NgxDeepPartial,
} from './projects/ngx-vest-forms/src/public-api';

type UserModel = NgxDeepPartial<{
  email: string;
  password: string;
}>;

// ✅ Define with NgxTypedVestSuite - gets autocomplete
const typedSuite: NgxTypedVestSuite<UserModel> = staticSuite(
  (model: UserModel, field?: FormFieldName<UserModel>) => {
    only(field);
    test('email', 'Required', () => enforce(model.email).isNotBlank());
  }
);

// ✅ Define with NgxVestSuite - works but no autocomplete
const untypedSuite: NgxVestSuite<UserModel> = staticSuite(
  (model: UserModel, field?: string) => {
    only(field);
    test('email', 'Required', () => enforce(model.email).isNotBlank());
  }
);

// ============================================
// OPTION 1: Use NgxTypedVestSuite in Component
// ============================================

class ComponentWithTypedSuite {
  // ❌ TypeScript ERROR if strictFunctionTypes is enabled:
  // Type 'NgxTypedVestSuite<UserModel>' is not assignable to type 'NgxVestSuite<UserModel>'
  //
  // Why? Because function parameters are contravariant:
  // - NgxTypedVestSuite expects: field?: FormFieldName<UserModel>
  // - NgxVestSuite accepts: field?: any
  // - FormFieldName<UserModel> is MORE SPECIFIC than any
  // - You can't assign a more specific type to a less specific type in contravariant position

  // This would work with type inference:
  protected readonly suiteInferred = typedSuite; // ✅ Type is inferred as NgxTypedVestSuite<UserModel>

  // But if you explicitly type it as NgxVestSuite, you get an error:
  // protected readonly suiteExplicit: NgxVestSuite<UserModel> = typedSuite; // ❌ Type error!
}

// ============================================
// OPTION 2: Use NgxVestSuite in Component (RECOMMENDED)
// ============================================

class ComponentWithUntypedSuite {
  // ✅ Works perfectly - types are compatible
  protected readonly suite: NgxVestSuite<UserModel> = typedSuite; // ✅ No error!

  // Why does this work?
  // Because NgxVestSuite uses `any` for the field parameter,
  // which accepts BOTH string and FormFieldName<UserModel>
}

// ============================================
// OPTION 3: Use Type Inference
// ============================================

class ComponentWithInference {
  // ✅ This works, but loses the benefit of explicit typing
  protected readonly suite = typedSuite;

  // Problem: The inferred type is NgxTypedVestSuite<UserModel>
  // This means if you later want to accept different suite types
  // or use it in a more flexible way, you're stuck with the specific type
}

// ============================================
// WHY THE RECOMMENDED PATTERN WORKS BEST
// ============================================

/**
 * RECOMMENDED PATTERN:
 * 1. Define suite with NgxTypedVestSuite for autocomplete
 * 2. Assign to NgxVestSuite property for compatibility
 *
 * Benefits:
 * - Get autocomplete at definition site (where you write validation logic)
 * - Explicit typing in component (self-documenting, flexible)
 * - No type errors (NgxVestSuite accepts both typed and untyped suites)
 * - Works with Angular's strict template checking
 * - Can be used in functions that accept NgxVestSuite
 */

class RecommendedPattern {
  // ✅ Define validation with NgxTypedVestSuite
  private static readonly validationSuite: NgxTypedVestSuite<UserModel> =
    staticSuite((model: UserModel, field?: FormFieldName<UserModel>) => {
      only(field);
      // ✅ IDE suggests: 'email' | 'password' | typeof ROOT_FORM
      test('email', 'Required', () => enforce(model.email).isNotBlank());
    });

  // ✅ Use NgxVestSuite in component for flexibility
  protected readonly suite: NgxVestSuite<UserModel> =
    RecommendedPattern.validationSuite;
}

// ============================================
// TECHNICAL EXPLANATION
// ============================================

/**
 * TypeScript Function Parameter Contravariance:
 *
 * When strictFunctionTypes is enabled (which it should be for type safety),
 * function parameters are contravariant. This means:
 *
 * If you have:
 * - Type A with parameter (field?: FormFieldName<T>)  // More specific
 * - Type B with parameter (field?: any)               // Less specific
 *
 * Then:
 * - A is NOT assignable to B (contravariance rule)
 * - B IS assignable to A (any accepts everything)
 *
 * Our solution:
 * - NgxTypedVestSuite has FormFieldName<T> parameter (specific, autocomplete)
 * - NgxVestSuite has any parameter (flexible, accepts both)
 * - Define with NgxTypedVestSuite, assign to NgxVestSuite property
 * - Result: Autocomplete where you need it, compatibility everywhere else
 *
 * The `any` in NgxVestSuite is SAFE because:
 * 1. Model parameter (T) remains fully typed
 * 2. Field validation happens at validation suite definition
 * 3. Runtime behavior is identical
 * 4. Type safety enforced where it matters (suite creation)
 */

export {
  ComponentWithTypedSuite,
  ComponentWithUntypedSuite,
  ComponentWithInference,
  RecommendedPattern,
};
