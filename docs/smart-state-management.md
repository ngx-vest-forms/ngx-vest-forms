# Smart State Management

ngx-vest-forms provides optional smart state management capabilities that intelligently handle external data updates, conflict resolution, and state merging using Angular's `linkedSignal` feature.

## TL;DR - Quick Start

Smart state management prevents data loss when external data updates while users are editing forms. Perfect for user profiles, collaborative editing, and real-time applications.

```typescript
// Complete example - form automatically handles external updates
<form
  ngxVestForm
  [vestSuite]="userSuite"
  [(formValue)]="userProfile"
  [externalData]="externalUserData()"
  [smartStateOptions]="{ mergeStrategy: 'smart' }"
  #form="ngxVestForm">

  <ngx-control-wrapper>
    <label for="firstName">First Name</label>
    <input
      id="firstName"
      name="firstName"
      [ngModel]="userProfile().firstName"
      placeholder="Enter your first name"
    />
  </ngx-control-wrapper>

  <ngx-control-wrapper>
    <label for="email">Email</label>
    <input
      id="email"
      name="email"
      type="email"
      [ngModel]="userProfile().email"
      placeholder="Enter your email"
    />
  </ngx-control-wrapper>

  <ngx-control-wrapper>
    <label for="bio">Bio</label>
    <textarea
      id="bio"
      name="bio"
      [ngModel]="userProfile().bio"
      placeholder="Tell us about yourself"
      rows="3">
    </textarea>
  </ngx-control-wrapper>

  @if (form.conflictState().hasConflict) {
    <div class="conflict-banner">
      <p>Data conflict detected! Someone else updated this profile.</p>
      <button (click)="form.acceptExternalChanges()">Accept Changes</button>
      <button (click)="form.keepLocalChanges()">Keep My Changes</button>
    </div>
  }

  <button type="submit" [disabled]="!form.formState().valid">
    Save Profile
  </button>
</form>
```

## Why Smart State Management?

Smart state management solves common real-world problems that developers face when building modern web applications:

### The Problem

Traditional form approaches fail in scenarios where external data might change while users are editing:

1. **Overwrite User Changes**: Form gets reset with new external data, losing all user edits (frustrating!)
2. **Ignore External Updates**: Form keeps user data but becomes stale, missing important server updates
3. **Manual Complex Logic**: Developers write custom merge logic that's error-prone and hard to maintain

### The Solution

Smart state management provides:

- **Intelligent Merging**: Automatically preserves user edits while incorporating external updates
- **Conflict Detection**: Identifies when user changes conflict with external updates
- **User Control**: Gives users clear options to resolve conflicts
- **Zero Boilerplate**: Works out of the box with sensible defaults

## When Should You Use It?

Smart state management is particularly valuable in these scenarios:

### ✅ Perfect Use Cases

- **User Profile/Settings Forms**: Users edit their profile while the server might update their data (admin changes, system updates)
- **Collaborative Editing**: Multiple users editing the same document/data with real-time synchronization
- **Long-running Forms**: Complex forms where users spend significant time while external data changes
- **Mobile/Offline Apps**: Forms that need to handle data synchronization when connectivity is restored
- **Administrative Interfaces**: Forms editing data that might be modified by automated processes
- **APIs with Optimistic Updates**: When your backend uses optimistic locking or returns updated data

### ❌ When NOT to Use

- Simple, short forms where external updates are unlikely
- Forms that create new entities (no external data to merge)
- Performance-critical scenarios where the overhead isn't justified
- Forms where you have complete control over data flow

## Real-World Example

Imagine a user profile form where:

1. User starts editing their profile (changes name from "John" to "Jonathan")
2. Admin updates the user's email in the background
3. Server sends updated data via WebSocket

**Without smart state management:**

```typescript
// ❌ User loses their name change when external email update arrives
userProfile.set(externalUpdate); // name reverts to "John"
```

**With smart state management:**

```typescript
// ✅ User keeps name change, gets new email automatically
// Result: { name: "Jonathan", email: "new@email.com" }
```

## Basic Usage

```typescript
@Component({
  template: `
    <form
      ngxVestForm
      [vestSuite]="userSuite"
      [(formValue)]="userProfile"
      [externalData]="externalUserData()"
      [smartStateOptions]="smartOptions"
      #form="ngxVestForm"
    >
      <ngx-control-wrapper>
        <label for="firstName">First Name</label>
        <input
          id="firstName"
          name="firstName"
          [ngModel]="userProfile().firstName"
          placeholder="First Name"
        />
      </ngx-control-wrapper>

      <ngx-control-wrapper>
        <label for="email">Email</label>
        <input
          id="email"
          name="email"
          [ngModel]="userProfile().email"
          placeholder="Email"
        />
      </ngx-control-wrapper>

      @if (form.conflictState().hasConflict) {
        <div class="conflict-banner">
          <p>Data conflict detected!</p>
          <button (click)="form.acceptExternalChanges()">
            Accept Server Changes
          </button>
          <button (click)="form.keepLocalChanges()">Keep My Changes</button>
        </div>
      }
    </form>
  `,
})
export class UserProfileComponent {
  userProfile = model<UserProfile | null>(null);
  externalUserData = signal<UserProfile | null>(null);

  smartOptions: SmartStateOptions<UserProfile> = {
    mergeStrategy: 'smart',
    preserveFields: ['firstName', 'lastName'],
    onConflict: (local, external) => {
      // Custom conflict resolution logic
      return { ...external, ...local, lastModified: new Date() };
    },
  };

  async refreshUserData() {
    const userData = await this.userService.getUser();
    this.externalUserData.set(userData);
    // Form will intelligently merge changes
  }
}
```

## Configuration Options

### SmartStateOptions

```typescript
interface SmartStateOptions<TModel> {
  /** Strategy for merging external data with form data */
  mergeStrategy?: 'replace' | 'preserve' | 'smart';

  /** Fields to always preserve from local changes */
  preserveFields?: string[];

  /** Custom conflict resolution callback */
  onConflict?: (local: TModel, external: TModel) => TModel | 'prompt-user';
}
```

### Merge Strategies

#### `'replace'` (Default)

Replaces form data with external data, discarding user edits.

```typescript
smartOptions = { mergeStrategy: 'replace' };
```

#### `'preserve'`

Keeps all user edits, ignoring external data updates.

```typescript
smartOptions = { mergeStrategy: 'preserve' };
```

#### `'smart'`

Intelligently merges changes, preserving user edits where possible.

```typescript
smartOptions = {
  mergeStrategy: 'smart',
  preserveFields: ['email', 'preferences.theme'],
};
```

## Conflict Detection and Resolution

### Automatic Conflict Detection

The form automatically detects conflicts when:

- External data changes while form has unsaved edits
- Nested fields have conflicting values
- User edits overlap with external updates

### Conflict Resolution API

```typescript
// Check for conflicts
if (form.conflictState().hasConflict) {
  // Get conflict details
  const conflicts = form.conflictState().conflicts;

  // Resolve conflicts
  form.acceptExternalChanges(); // Use external data
  form.keepLocalChanges(); // Keep user edits
}
```

### Custom Conflict Resolution

```typescript
smartOptions = {
  mergeStrategy: 'smart',
  onConflict: (local, external) => {
    // Custom logic for resolving conflicts
    return {
      ...external, // Start with external data
      ...local, // Apply local changes
      lastModified: new Date(), // Add metadata
      conflictResolved: true,
    };
  },
};
```

## Advanced Patterns

### Nested Object Merging

Smart state management handles complex nested objects intelligently:

```typescript
// User profile with nested preferences
interface UserProfile {
  id: string;
  name: string;
  preferences: {
    theme: 'light' | 'dark';
    notifications: {
      email: boolean;
      push: boolean;
    };
  };
}

smartOptions = {
  mergeStrategy: 'smart',
  preserveFields: ['preferences.theme', 'preferences.notifications.email'],
};
```

### Field-Level Preservation

Preserve specific fields during external updates:

```typescript
smartOptions = {
  mergeStrategy: 'smart',
  preserveFields: [
    'email', // Top-level field
    'profile.bio', // Nested field
    'settings.notifications', // Nested object
  ],
};
```

### Conditional Merging

Use custom logic for complex merge scenarios:

```typescript
smartOptions = {
  mergeStrategy: 'smart',
  onConflict: (local, external) => {
    // Only merge if external data is newer
    if (external.lastModified > local.lastModified) {
      return { ...local, ...external };
    }
    return 'prompt-user'; // Show conflict resolution UI
  },
};
```

## Integration with Services

### Auto-sync with External APIs

```typescript
@Injectable()
export class UserProfileService {
  private userProfile = signal<UserProfile | null>(null);
  private externalData = signal<UserProfile | null>(null);

  constructor(private api: ApiService) {
    // Auto-refresh external data
    interval(30000)
      .pipe(
        switchMap(() => this.api.getUserProfile()),
        takeUntilDestroyed(),
      )
      .subscribe((data) => {
        this.externalData.set(data);
      });
  }

  getProfile = () => this.userProfile;
  getExternalData = () => this.externalData;
}
```

### Form Component Integration

```typescript
@Component({
  template: `
    <form
      ngxVestForm
      [vestSuite]="userSuite"
      [(formValue)]="userService.getProfile()"
      [externalData]="userService.getExternalData()"
      [smartStateOptions]="smartOptions"
    >
      <ngx-control-wrapper>
        <label for="firstName">First Name</label>
        <input
          id="firstName"
          name="firstName"
          [ngModel]="userService.getProfile()().firstName"
        />
      </ngx-control-wrapper>

      <ngx-control-wrapper>
        <label for="email">Email</label>
        <input
          id="email"
          name="email"
          [ngModel]="userService.getProfile()().email"
        />
      </ngx-control-wrapper>
    </form>
  `,
})
export class UserProfileComponent {
  constructor(protected userService: UserProfileService) {}

  smartOptions = {
    mergeStrategy: 'smart' as const,
    preserveFields: ['email', 'firstName', 'lastName'],
  };
}
```

## Best Practices

### 1. Choose Appropriate Merge Strategies

- Use `'replace'` for simple forms with no user state preservation needs
- Use `'preserve'` for forms where user edits should never be overwritten
- Use `'smart'` for complex forms with selective field preservation

### 2. Handle Conflicts Gracefully

```typescript
// Provide clear conflict resolution UI
@if (form.conflictState().hasConflict) {
  <div class="bg-yellow-50 border border-yellow-200 rounded p-4">
    <h3 class="font-medium text-yellow-800">Data Conflict Detected</h3>
    <p class="text-yellow-700 mt-1">
      The data has been updated by someone else. How would you like to proceed?
    </p>
    <div class="mt-3 space-x-2">
      <button
        (click)="form.acceptExternalChanges()"
        class="bg-blue-500 text-white px-3 py-1 rounded"
      >
        Use Latest Data
      </button>
      <button
        (click)="form.keepLocalChanges()"
        class="bg-gray-500 text-white px-3 py-1 rounded"
      >
        Keep My Changes
      </button>
    </div>
  </div>
}
```

### 3. Preserve Critical User Data

Always preserve fields that users spend time editing:

```typescript
smartOptions = {
  mergeStrategy: 'smart',
  preserveFields: [
    'bio', // Long text fields
    'preferences', // User customizations
    'draft_content', // Work in progress
  ],
};
```

### 4. Test Conflict Scenarios

```typescript
// Test conflict detection
it('should detect conflicts when external data changes', () => {
  const fixture = TestBed.createComponent(UserFormComponent);
  const component = fixture.componentInstance;

  // User makes local changes
  component.userProfile.set({ name: 'Local Edit', email: 'local@test.com' });

  // External data updates
  component.externalData.set({
    name: 'External Edit',
    email: 'external@test.com',
  });

  fixture.detectChanges();

  expect(component.form.conflictState().hasConflict).toBe(true);
});
```

## Performance Considerations

### Optimize with Selective Updates

Smart state management uses `linkedSignal` for efficient updates:

```typescript
// Only recomputes when relevant data changes
readonly smartFormValue = linkedSignal({
  source: () => ({
    formValue: this.formValueSignal(),
    externalData: this.externalData(),
    options: this.smartStateOptions()
  }),
  computation: ({ formValue, externalData, options }, previous) => {
    // Efficient merging logic here
  }
});
```

### Debounce External Updates

```typescript
// Debounce frequent external updates
readonly debouncedExternalData = signal<UserProfile | null>(null);

effect(() => {
  const data = this.externalData();
  setTimeout(() => {
    this.debouncedExternalData.set(data);
  }, 300);
});
```

## Migration Guide

### From Simple Forms

Existing forms work without changes:

```typescript
// Before: Simple form
<form ngxVestForm [(formValue)]="userProfile">
  <ngx-control-wrapper>
    <label for="name">Name</label>
    <input id="name" name="name" [ngModel]="userProfile().name" />
  </ngx-control-wrapper>
</form>

// After: Add smart state management
<form
  ngxVestForm
  [(formValue)]="userProfile"
  [externalData]="externalData()"
  [smartStateOptions]="{ mergeStrategy: 'smart' }"
>
  <ngx-control-wrapper>
    <label for="name">Name</label>
    <input id="name" name="name" [ngModel]="userProfile().name" />
  </ngx-control-wrapper>
</form>
```

### Upgrading Existing Logic

Replace manual merge logic with smart state:

```typescript
// Before: Manual merging
effect(() => {
  const external = this.externalData();
  const current = this.userProfile();

  if (external && !this.formIsDirty()) {
    this.userProfile.set(external);
  }
});

// After: Smart state management
smartOptions = { mergeStrategy: 'smart' };
```

## Examples

See the [smart form examples](../projects/examples/src/app/smart-form-example/) for complete working implementations demonstrating:

- Basic smart state setup
- Advanced linkedSignal patterns
- Conflict resolution workflows
- Integration with external APIs
- Performance optimization techniques
