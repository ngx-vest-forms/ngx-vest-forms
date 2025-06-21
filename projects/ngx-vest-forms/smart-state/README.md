# Smart State Management for ngx-vest-forms

Advanced state management extension for `ngx-vest-forms` that provides intelligent data merging, conflict resolution, and external data synchronization.

## Overview

Smart State Management is an optional secondary entry point that extends the core `ngx-vest-forms` functionality with advanced features for complex applications that need:

- **Intelligent data merging** when external data changes during user editing
- **Conflict resolution** with customizable strategies
- **Real-time synchronization** with external data sources
- **Preserve user edits** during external updates
- **Collaborative editing** support

## Installation

Smart state management is available as a separate entry point:

```typescript
import {
  NgxVestFormsSmartStateDirective,
  SmartStateExtension,
  SmartStateOptions,
} from 'ngx-vest-forms/smart-state';
```

## Quick Start

### 1. Import the Directive

```typescript
import { Component, signal } from '@angular/core';
import { ngxVestForms } from 'ngx-vest-forms';
import { NgxVestFormsSmartStateDirective } from 'ngx-vest-forms/smart-state';

@Component({
  imports: [ngxVestForms, NgxVestFormsSmartStateDirective],
  template: `
    <form
      ngxVestForm
      ngxSmartStateExtension
      [vestSuite]="userSuite"
      [(formValue)]="userProfile"
      [externalData]="externalUserData()"
      [smartStateOptions]="smartOptions"
      #form="ngxVestForm"
    >
      <!-- Your form fields -->
    </form>
  `,
})
export class UserProfileComponent {
  userProfile = signal<UserProfile | null>(null);
  externalUserData = signal<UserProfile | null>(null);

  smartOptions: SmartStateOptions<UserProfile> = {
    mergeStrategy: 'smart',
    preserveFields: ['firstName', 'email'],
    conflictResolution: true,
    onConflict: (local, external) => {
      // Custom conflict resolution logic
      return 'prompt-user'; // or return merged data
    },
  };
}
```

### 2. Handle External Data Updates

```typescript
async refreshUserData() {
  const userData = await this.userService.getUser();
  this.externalUserData.set(userData);
  // Smart state automatically handles intelligent merging
}
```

## Configuration Options

### SmartStateOptions<T>

```typescript
interface SmartStateOptions<T> {
  /** Strategy for handling external data changes */
  mergeStrategy?: 'replace' | 'preserve' | 'smart';

  /** Fields to preserve during external updates (supports dot notation) */
  preserveFields?: string[];

  /** Enable conflict detection and resolution */
  conflictResolution?: boolean;

  /** Custom conflict resolution callback */
  onConflict?: (local: T, external: T) => T | 'prompt-user';
}
```

### Merge Strategies

#### 1. `'replace'` (Default)

Replaces the entire form value with external data, discarding user changes.

```typescript
smartOptions: SmartStateOptions<UserProfile> = {
  mergeStrategy: 'replace',
};
```

**Use when:** You want external data to always take precedence.

#### 2. `'preserve'`

Preserves all user changes, ignoring external updates.

```typescript
smartOptions: SmartStateOptions<UserProfile> = {
  mergeStrategy: 'preserve',
};
```

**Use when:** User edits should never be overwritten.

#### 3. `'smart'` (Recommended)

Intelligently merges external data while preserving user edits on specified fields.

```typescript
smartOptions: SmartStateOptions<UserProfile> = {
  mergeStrategy: 'smart',
  preserveFields: ['firstName', 'lastName', 'email'],
  conflictResolution: true,
};
```

**Use when:** You need intelligent merging with conflict detection.

## Field Preservation

Use dot notation to specify nested fields to preserve:

```typescript
smartOptions: SmartStateOptions<UserProfile> = {
  mergeStrategy: 'smart',
  preserveFields: [
    'personal.firstName',
    'personal.lastName',
    'contact.email',
    'addresses[0].street', // Array notation supported
    'preferences.notifications',
  ],
};
```

## Conflict Resolution

### Automatic Conflict Detection

Smart state automatically detects conflicts when:

- External data changes a field that the user has also modified
- Both changes occurred after the last known sync point

### Custom Conflict Resolution

```typescript
smartOptions: SmartStateOptions<UserProfile> = {
  mergeStrategy: 'smart',
  conflictResolution: true,
  onConflict: (localData, externalData) => {
    // Option 1: Return merged data
    return {
      ...externalData,
      firstName: localData.firstName, // Keep user's change
      email: localData.email, // Keep user's change
    };

    // Option 2: Prompt user for resolution
    return 'prompt-user';
  },
};
```

### Handling User Prompts

When `onConflict` returns `'prompt-user'`, the conflict state is exposed:

```typescript
@Component({
  template: `
    <form ngxSmartStateExtension #form="ngxVestForm">
      <!-- Your form -->
    </form>

    @if (form.smartState()?.conflictState?.hasConflicts) {
      <div class="conflict-dialog">
        <h3>Data Conflict Detected</h3>
        <p>External data has changed. How would you like to proceed?</p>

        <button (click)="resolveConflict('keep-local')">Keep My Changes</button>
        <button (click)="resolveConflict('accept-external')">
          Accept External Changes
        </button>
        <button (click)="resolveConflict('merge')">Review & Merge</button>
      </div>
    }
  `,
})
export class UserProfileComponent {
  resolveConflict(strategy: string) {
    const smartState = this.form().smartState();
    if (!smartState?.conflictState) return;

    switch (strategy) {
      case 'keep-local':
        smartState.resolveConflict(smartState.conflictState.localData);
        break;
      case 'accept-external':
        smartState.resolveConflict(smartState.conflictState.externalData);
        break;
      case 'merge':
        // Open custom merge dialog
        this.openMergeDialog(smartState.conflictState);
        break;
    }
  }
}
```

## Real-World Use Cases

### 1. User Profile Management

```typescript
@Component({
  template: `
    <form
      ngxVestForm
      ngxSmartStateExtension
      [vestSuite]="userSuite"
      [(formValue)]="userProfile"
      [externalData]="externalUserData()"
      [smartStateOptions]="smartOptions"
    >
      <input name="firstName" [ngModel]="userProfile()?.firstName" />
      <input name="email" [ngModel]="userProfile()?.email" />
      <!-- More fields -->
    </form>
  `,
})
export class UserProfileComponent {
  smartOptions: SmartStateOptions<UserProfile> = {
    mergeStrategy: 'smart',
    preserveFields: ['firstName', 'email'], // User changes take precedence
    conflictResolution: true,
  };

  // Simulate admin updates
  async checkForUpdates() {
    const updates = await this.adminService.getUserUpdates(this.userId);
    if (updates) {
      this.externalUserData.set(updates);
      // Smart state handles the merge automatically
    }
  }
}
```

### 2. Collaborative Document Editing

```typescript
@Component({
  template: `
    <form
      ngxVestForm
      ngxSmartStateExtension
      [vestSuite]="documentSuite"
      [(formValue)]="document"
      [externalData]="remoteDocument()"
      [smartStateOptions]="smartOptions"
    >
      <input name="title" [ngModel]="document()?.title" />
      <textarea name="content" [ngModel]="document()?.content"></textarea>
    </form>
  `,
})
export class DocumentEditorComponent {
  smartOptions: SmartStateOptions<Document> = {
    mergeStrategy: 'smart',
    preserveFields: ['content'], // Preserve user's content changes
    conflictResolution: true,
    onConflict: (local, remote) => {
      // For documents, always prompt user
      return 'prompt-user';
    },
  };

  // Real-time updates via WebSocket
  ngOnInit() {
    this.websocketService.onDocumentUpdate((update) => {
      this.remoteDocument.set(update);
    });
  }
}
```

### 3. Mobile/Offline Synchronization

```typescript
@Component({
  template: `
    <form
      ngxVestForm
      ngxSmartStateExtension
      [vestSuite]="orderSuite"
      [(formValue)]="orderData"
      [externalData]="serverOrderData()"
      [smartStateOptions]="smartOptions"
    >
      <!-- Order form fields -->
    </form>
  `,
})
export class OrderFormComponent {
  smartOptions: SmartStateOptions<Order> = {
    mergeStrategy: 'smart',
    preserveFields: ['items', 'customerNotes'], // Preserve user selections
    conflictResolution: true,
  };

  async syncWithServer() {
    try {
      const serverData = await this.orderService.getOrder(this.orderId);
      this.serverOrderData.set(serverData);
      // Smart state merges pricing updates while preserving user selections
    } catch (error) {
      // Handle offline scenario
    }
  }
}
```

## Advanced Features

### Programmatic Access

You can access the smart state extension programmatically:

```typescript
import { Component, viewChild } from '@angular/core'; // Added viewChild import
import { NgxVestFormsSmartStateDirective } from 'ngx-vest-forms/smart-state'; // Assuming this is the correct path

export class MyComponent {
  // Use viewChild() signal query
  smartStateDirective = viewChild.required(
    NgxVestFormsSmartStateDirective<MyModel>,
  );

  checkConflicts() {
    const directive = this.smartStateDirective(); // Call the signal to get the directive instance
    if (!directive) return;

    const state = directive.smartState();
    if (state?.conflictState?.hasConflicts) {
      console.log('Conflicts detected:', state.conflictState.conflicts);
    }
  }

  forceSync() {
    const directive = this.smartStateDirective(); // Call the signal
    if (directive) {
      directive.forceResync();
    }
  }
}
```

### Custom Merge Logic

For complex data structures, implement custom merge logic:

```typescript
function customMergeFunction<T>(
  localData: T,
  externalData: T,
  preserveFields: string[],
): T {
  // Implement your custom merging algorithm
  const merged = { ...externalData };

  preserveFields.forEach((field) => {
    const localValue = getValueAtPath(localData, field);
    if (localValue !== undefined) {
      setValueAtPath(merged, field, localValue);
    }
  });

  return merged;
}

smartOptions: SmartStateOptions<MyModel> = {
  mergeStrategy: 'smart',
  onConflict: customMergeFunction,
};
```

## Performance Considerations

- Smart state operations are optimized with debouncing and change detection
- Conflict detection only runs when both local and external data have changed
- Use `preserveFields` strategically to avoid unnecessary comparisons
- Consider disabling `conflictResolution` for simple use cases to reduce overhead

## Debugging

Enable debug logging in development:

```typescript
import { SMART_STATE_DEBUG } from 'ngx-vest-forms/smart-state';

// In your module or component providers
providers: [{ provide: SMART_STATE_DEBUG, useValue: true }];
```

This will log merge operations, conflict detection, and resolution strategies to the console.

## TypeScript Support

Smart state is fully typed with generic support:

```typescript
interface MyFormModel {
  id: number;
  name: string;
  nested: {
    value: string;
  };
}

// Full type safety
const options: SmartStateOptions<MyFormModel> = {
  preserveFields: ['name', 'nested.value'], // Type-checked paths
  onConflict: (local: MyFormModel, external: MyFormModel) => {
    // Both parameters are fully typed
    return { ...external, name: local.name };
  },
};
```

## Migration from Core Features

If you're currently using basic form functionality and need smart state management, the upgrade is straightforward:

```typescript
// Before (basic form)
@Component({
  imports: [ngxVestForms],
  template: `
    <form ngxVestForm [(formValue)]="data">
      <!-- fields -->
    </form>
  `
})

// After (with smart state)
@Component({
  imports: [ngxVestForms, NgxVestFormsSmartStateDirective],
  template: `
    <form
      ngxVestForm
      ngxSmartStateExtension
      [(formValue)]="data"
      [externalData]="externalData()"
      [smartStateOptions]="smartOptions"
    >
      <!-- same fields -->
    </form>
  `
})
```

## Best Practices

1. **Start Simple**: Begin with basic merge strategies and add complexity as needed
2. **Test Conflict Scenarios**: Always test your conflict resolution logic with realistic data
3. **Use Preserve Fields Wisely**: Only preserve fields that users actively edit
4. **Handle Edge Cases**: Consider null/undefined values in your merge logic
5. **Monitor Performance**: Use browser dev tools to monitor smart state operations
6. **Provide User Feedback**: Always inform users when conflicts are detected and resolved

## Troubleshooting

### Common Issues

**Q: Smart state isn't merging data**
A: Ensure `externalData` signal is properly updated and `mergeStrategy` is set to `'smart'`.

**Q: User changes are being overwritten**
A: Add the affected fields to `preserveFields` array.

**Q: Conflicts not detected**
A: Enable `conflictResolution: true` and ensure both local and external data have changed.

**Q: Performance issues**
A: Reduce the number of `preserveFields` and consider disabling conflict resolution for simple use cases.

## Examples

See the main examples directory for complete working examples:

- [Smart State Integration Example](../../projects/examples/src/app/smart-form-example/)
- [User Profile with Smart State](../../projects/examples/src/app/user-profile-smart/)
- [Collaborative Editing Demo](../../projects/examples/src/app/collaborative-editor/)

---

For more information about the core `ngx-vest-forms` functionality, see the [main README](../../README.md).
