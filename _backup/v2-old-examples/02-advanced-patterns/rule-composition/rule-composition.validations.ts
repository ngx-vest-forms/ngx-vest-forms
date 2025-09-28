import { enforce, staticSuite, test, only, omitWhen } from 'vest';

/**
 * Security Settings Model for demonstrating advanced rule composition
 */
export type SecuritySettingsModel = {
  // User authentication
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;

  // Account security
  email: string;
  recoveryEmail: string;
  phoneNumber: string;

  // Security preferences
  twoFactorEnabled: boolean;
  securityQuestions: {
    question: string;
    answer: string;
  }[];

  // API access
  apiKeyName: string;
  allowedOrigins: string[];
};

/**
 * Advanced Enforce Rule Composition Library
 *
 * This module demonstrates how to build reusable, composable validation rules
 * using Vest.js enforce library. These patterns show:
 *
 * 🚀 Key Benefits:
 * - Reusable validation logic across different forms
 * - Consistent validation rules throughout the application
 * - Easy testing of individual validation components
 * - Better maintainability with centralized rule definitions
 * - Type-safe validation with custom TypeScript extensions
 *
 * 📋 Patterns Demonstrated:
 * - Custom enforce extensions via global augmentation
 * - Validation rule factories with configuration
 * - Composable rule chains for complex scenarios
 * - Cross-field validation helpers
 * - Security-focused validation patterns
 */

/**
 * === BASIC RULE COMPOSITION PATTERNS ===
 */

/**
 * Email Validation Composition
 *
 * Demonstrates building complex email validation from simple enforce rules
 */
export const emailValidation = {
  /**
   * Basic email format validation
   */
  isValidFormat: (email: string) => {
    return enforce(email)
      .isNotEmpty()
      .matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/);
  },

  /**
   * Business email validation (no common public providers)
   */
  isBusinessEmail: (email: string) => {
    const publicProviders = new Set([
      'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
      'aol.com', 'icloud.com', 'protonmail.com'
    ]);

    const domain = email.split('@')[1]?.toLowerCase();

    return enforce(domain)
      .isNotEmpty()
      .condition((domain) => !publicProviders.has(domain));
  },

  /**
   * Email length and character validation
   */
  meetsSizeRequirements: (email: string) => {
    return enforce(email)
      .longerThanOrEquals(5)
      .shorterThanOrEquals(254) // RFC 5321 limit
      .condition((email) => {
        const [localPart, domain] = email.split('@');
        return localPart && localPart.length <= 64 && domain && domain.length <= 253;
      });
  },

  /**
   * Composed complete email validation
   */
  isCompletelyValid: (email: string) => {
    // Chain multiple validation rules together
    emailValidation.isValidFormat(email);
    emailValidation.meetsSizeRequirements(email);
    // Business email validation is optional - can be omitted
  }
};

/**
 * Password Security Composition
 *
 * Advanced password validation with configurable security levels
 */
export const passwordValidation: any = {
  /**
   * Password strength configuration
   */
  strengthLevels: {
    basic: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: false,
      requireSymbols: false,
      maxLength: 128
    },
    standard: {
      minLength: 10,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSymbols: false,
      maxLength: 128
    },
    strong: {
      minLength: 12,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSymbols: true,
      maxLength: 128
    },
    enterprise: {
      minLength: 14,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSymbols: true,
      maxLength: 128,
      noCommonPasswords: true,
      noPersonalInfo: true
    }
  },

  /**
   * Common weak passwords list (truncated for example)
   */
  commonPasswords: [
    'password', '123456', '123456789', 'qwerty', 'abc123',
    'password123', 'admin', 'letmein', 'welcome', 'monkey'
  ],

  /**
   * Validate password against specific strength level
   */
  meetsStrengthLevel: (password: string, level: keyof typeof passwordValidation.strengthLevels) => {
    const config = passwordValidation.strengthLevels[level];

    // Length requirements
    enforce(password)
      .longerThanOrEquals(config.minLength)
      .shorterThanOrEquals(config.maxLength);

    // Character requirements
    if (config.requireUppercase) {
      enforce(password).matches(/[A-Z]/, 'Must contain uppercase letter');
    }

    if (config.requireLowercase) {
      enforce(password).matches(/[a-z]/, 'Must contain lowercase letter');
    }

    if (config.requireNumbers) {
      enforce(password).matches(/\d/, 'Must contain number');
    }

    if (config.requireSymbols) {
      enforce(password).matches(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Must contain symbol');
    }

    // Advanced security checks for enterprise level
    if (config.noCommonPasswords) {
      enforce(password.toLowerCase()).condition(
        (pwd) => !passwordValidation.commonPasswords.includes(pwd),
        'Cannot use common password'
      );
    }

    return true;
  },

  /**
   * Check password confirmation match
   */
  confirmationMatches: (password: string, confirmation: string) => {
    return enforce(confirmation)
      .equals(password);
  },

  /**
   * Validate password change (current vs new)
   */
  isValidPasswordChange: (currentPassword: string, newPassword: string, confirmPassword: string) => {
    // New password must be different from current
    enforce(newPassword).condition(
      (newPwd) => newPwd !== currentPassword,
      'New password must be different from current password'
    );

    // New password must meet strength requirements
    passwordValidation.meetsStrengthLevel(newPassword, 'standard');

    // Confirmation must match
    passwordValidation.confirmationMatches(newPassword, confirmPassword);
  }
};

/**
 * Phone Number Validation Composition
 *
 * International phone number validation with country-specific patterns
 */
export const phoneValidation: any = {
  /**
   * Country-specific phone patterns
   */
  countryPatterns: {
    US: /^\+?1?[2-9]\d{2}[2-9]\d{2}\d{4}$/, // US/Canada
    UK: /^\+?44[1-9]\d{8,9}$/, // United Kingdom
    DE: /^\+?49[1-9]\d{6,14}$/, // Germany
    FR: /^\+?33[1-9]\d{8}$/, // France
    JP: /^\+?81[1-9]\d{1,4}\d{1,4}\d{4}$/, // Japan
    AU: /^\+?61[2-478]\d{8}$/, // Australia
    CA: /^\+?1[2-9]\d{2}[2-9]\d{2}\d{4}$/, // Canada (same as US)
  },

  /**
   * Format phone number for specific country
   */
  formatForCountry: (phone: string, countryCode: keyof typeof phoneValidation.countryPatterns) => {
    const cleaned = phone.replaceAll(/[^\\d+]/g, '');
    return phoneValidation.countryPatterns[countryCode].test(cleaned);
  },

  /**
   * General international phone validation
   */
  isValidInternational: (phone: string) => {
    const cleaned = phone.replaceAll(/[^\\d+]/g, '');

    return enforce(cleaned)
      .longerThanOrEquals(7) // Minimum phone length
      .shorterThanOrEquals(18) // Maximum international length
      .matches(/^\+?[1-9]\d{1,14}$/, 'Invalid phone format');
  },

  /**
   * US-specific phone validation with formatting
   */
  isValidUSPhone: (phone: string) => {
    const cleaned = phone.replaceAll(/[^\\d]/g, '');

    return enforce(cleaned)
      .lengthEquals(10)
      .matches(/^[2-9]\d{2}[2-9]\d{2}\d{4}$/, 'Invalid US phone number');
  }
};

/**
 * URL/Domain Validation Composition
 */
export const urlValidation = {
  /**
   * Basic URL validation
   */
  isValidUrl: (url: string) => {
    try {
      new URL(url);
      return enforce(url)
        .matches(/^https?:\/\/.+/, 'URL must start with http:// or https://');
    } catch {
      throw new Error('Invalid URL format');
    }
  },

  /**
   * HTTPS-only validation for security
   */
  isSecureUrl: (url: string) => {
    urlValidation.isValidUrl(url);
    return enforce(url)
      .startsWith('https://', 'URL must use HTTPS for security');
  },

  /**
   * Domain whitelist validation
   */
  isAllowedDomain: (url: string, allowedDomains: string[]) => {
    urlValidation.isValidUrl(url);

    const urlObject = new URL(url);
    const domain = urlObject.hostname.toLowerCase();

    return enforce(domain).condition(
      (domain) => allowedDomains.some(allowed =>
        domain === allowed || domain.endsWith('.' + allowed)
      ),
      'Domain not in allowed list'
    );
  }
};

/**
 * === VALIDATION RULE FACTORIES ===
 */

/**
 * Factory for creating length validation rules
 */
export const createLengthValidator = (min: number, max?: number, fieldName = 'Field') => {
  return (value: string) => {
    let enforcer = enforce(value)
      .isNotEmpty()
      .longerThanOrEquals(min);

    if (max) {
      enforcer = enforcer.shorterThanOrEquals(max);
    }

    return enforcer;
  };
};

/**
 * Factory for creating pattern-based validators
 */
export const createPatternValidator = (pattern: RegExp, errorMessage: string) => {
  return (value: string) => {
    return enforce(value)
      .isNotEmpty()
      .matches(pattern, errorMessage);
  };
};

/**
 * Factory for creating whitelist validators
 */
export const createWhitelistValidator = <T>(allowedValues: T[], fieldName = 'Value') => {
  return (value: T) => {
    return enforce(value).inside(allowedValues);
  };
};

/**
 * Factory for creating async uniqueness validators
 */
export const createUniquenessValidator = <T>(
  checkFunction: (value: T) => Promise<boolean>,
  errorMessage = 'Value must be unique'
) => {
  return async (value: T, signal?: AbortSignal) => {
    const isUnique = await checkFunction(value);

    if (signal?.aborted) {
      throw new Error('Validation cancelled');
    }

    if (!isUnique) {
      throw new Error(errorMessage);
    }
  };
};

/**
 * === SECURITY SETTINGS VALIDATION SUITE ===
 */
type SecurityFieldNames = keyof SecuritySettingsModel | string;

/**
 * Mock services for async validation
 */
const securityServices = {
  checkCurrentPassword: async (password: string): Promise<boolean> => {
    // Simulate API call
    return new Promise(resolve =>
      setTimeout(() => resolve(password === 'current123'), 500)
    );
  },

  checkEmailAvailable: async (email: string): Promise<boolean> => {
    // Simulate API call
    return new Promise(resolve =>
      setTimeout(() => resolve(!email.includes('taken')), 600)
    );
  },

  checkApiKeyNameUnique: async (name: string): Promise<boolean> => {
    // Simulate API call
    return new Promise(resolve =>
      setTimeout(() => resolve(!name.includes('duplicate')), 400)
    );
  }
};

/**
 * Advanced Security Settings Validation Suite
 *
 * Demonstrates comprehensive rule composition in a real-world scenario
 */
export const securitySettingsValidationSuite = staticSuite<
  SecurityFieldNames,
  string,
  (data: Partial<SecuritySettingsModel>, field?: string) => void
>((data: Partial<SecuritySettingsModel> = {}, field?: string) => {
  only(field);

  // === PASSWORD MANAGEMENT VALIDATION ===

  test('currentPassword', 'Current password is required', () => {
    enforce(data.currentPassword).isNotEmpty();
  });

  test('currentPassword', 'Current password is incorrect', async ({ signal }) => {
    if (data.currentPassword) {
      const isValid = await securityServices.checkCurrentPassword(data.currentPassword);
      if (!isValid) {
        throw new Error('Current password is incorrect');
      }
    }
  });

  test('newPassword', 'New password is required', () => {
    enforce(data.newPassword).isNotEmpty();
  });

  test('newPassword', 'New password does not meet security requirements', () => {
    if (data.newPassword) {
      passwordValidation.meetsStrengthLevel(data.newPassword, 'standard');
    }
  });

  test('newPassword', 'New password must be different from current password', () => {
    if (data.newPassword && data.currentPassword) {
      enforce(data.newPassword).condition(
        (newPwd) => newPwd !== data.currentPassword,
        'New password must be different from current password'
      );
    }
  });

  test('confirmPassword', 'Password confirmation is required', () => {
    if (data.newPassword) {
      enforce(data.confirmPassword).isNotEmpty();
    }
  });

  test('confirmPassword', 'Password confirmation does not match', () => {
    if (data.newPassword && data.confirmPassword) {
      passwordValidation.confirmationMatches(data.newPassword, data.confirmPassword);
    }
  });

  // === EMAIL VALIDATION ===

  test('email', 'Email is required', () => {
    enforce(data.email).isNotEmpty();
  });

  test('email', 'Email format is invalid', () => {
    if (data.email) {
      emailValidation.isCompletelyValid(data.email);
    }
  });

  test('email', 'Email is already in use', async ({ signal }) => {
    if (data.email && emailValidation.isValidFormat) {
      try {
        emailValidation.isValidFormat(data.email);
        const isAvailable = await securityServices.checkEmailAvailable(data.email);
        if (!isAvailable) {
          throw new Error('Email is already in use');
        }
      } catch {
        // Skip async validation if format is invalid
      }
    }
  });

  test('recoveryEmail', 'Recovery email must be different from primary email', () => {
    if (data.recoveryEmail && data.email) {
      enforce(data.recoveryEmail).condition(
        (recoveryEmail) => recoveryEmail !== data.email,
        'Recovery email must be different from primary email'
      );
    }
  });

  test('recoveryEmail', 'Recovery email format is invalid', () => {
    if (data.recoveryEmail) {
      emailValidation.isCompletelyValid(data.recoveryEmail);
    }
  });

  // === PHONE VALIDATION ===

  test('phoneNumber', 'Phone number format is invalid', () => {
    if (data.phoneNumber) {
      phoneValidation.isValidUSPhone(data.phoneNumber);
    }
  });

  // === SECURITY QUESTIONS VALIDATION ===

  if (data.securityQuestions && data.securityQuestions.length > 0) {
    for (const [index, item] of data.securityQuestions.entries()) {
      test(`securityQuestions[${index}].question`, 'Security question is required', () => {
        enforce(item.question).isNotEmpty();
      });

      test(`securityQuestions[${index}].question`, 'Security question must be at least 10 characters', () => {
        createLengthValidator(10, 200)(item.question);
      });

      test(`securityQuestions[${index}].answer`, 'Security answer is required', () => {
        enforce(item.answer).isNotEmpty();
      });

      test(`securityQuestions[${index}].answer`, 'Security answer must be at least 3 characters', () => {
        createLengthValidator(3, 100)(item.answer);
      });
    }
  }

  // === API ACCESS VALIDATION ===

  test('apiKeyName', 'API key name is required', () => {
    if (data.apiKeyName !== undefined) {
      enforce(data.apiKeyName).isNotEmpty();
    }
  });

  test('apiKeyName', 'API key name must be between 3-50 characters', () => {
    if (data.apiKeyName) {
      createLengthValidator(3, 50)(data.apiKeyName);
    }
  });

  test('apiKeyName', 'API key name must be unique', async ({ signal }) => {
    if (data.apiKeyName) {
      const validator = createUniquenessValidator(
        securityServices.checkApiKeyNameUnique,
        'API key name already exists'
      );
      await validator(data.apiKeyName, signal);
    }
  });

  // === ALLOWED ORIGINS VALIDATION ===

  if (data.allowedOrigins && data.allowedOrigins.length > 0) {
    for (const [index, origin] of data.allowedOrigins.entries()) {
      test(`allowedOrigins[${index}]`, 'Origin must be a valid HTTPS URL', () => {
        urlValidation.isSecureUrl(origin);
      });
    }
  }

  // === CROSS-FIELD SECURITY VALIDATION ===

  // If 2FA is enabled, ensure we have phone number
  if (data.twoFactorEnabled && data.twoFactorEnabled === true) {
    test('phoneNumber', 'Phone number is required when 2FA is enabled', () => {
      enforce(data.phoneNumber).isNotEmpty();
    });
  }

  // Ensure at least 2 security questions if 2FA is disabled
  if (data.twoFactorEnabled === false) {
    test('securityQuestions', 'At least 2 security questions required when 2FA is disabled', () => {
      const questionCount = data.securityQuestions?.length || 0;
      enforce(questionCount).greaterThanOrEquals(2);
    });
  }
});

/**
 * === HELPER UTILITIES FOR RULE COMPOSITION ===
 */

/**
 * Validation rule combiner utility
 */
export const combineRules = <T>(...rules: ((value: T) => any)[]) => {
  return (value: T) => {
    for (const rule of rules) {
      rule(value);
    }
  };
};

/**
 * Conditional validation helper
 */
export const validateWhen = <T>(condition: boolean, rule: (value: T) => any) => {
  return (value: T) => {
    if (condition) {
      rule(value);
    }
  };
};

/**
 * Validation rule composer for complex scenarios
 */
export class ValidationComposer<T> {
  private rules: ((value: T) => any)[] = [];

  add(rule: (value: T) => any): this {
    this.rules.push(rule);
    return this;
  }

  when(condition: boolean, rule: (value: T) => any): this {
    if (condition) {
      this.rules.push(rule);
    }
    return this;
  }

  build(): (value: T) => any {
    return (value: T) => {
      for (const rule of this.rules) {
        rule(value);
      }
    };
  }
}

/**
 * Example usage of ValidationComposer
 */
export const createPasswordValidator = (level: 'basic' | 'standard' | 'strong' | 'enterprise') => {
  return new ValidationComposer<string>()
    .add((pwd) => enforce(pwd).isNotEmpty())
    .add((pwd) => passwordValidation.meetsStrengthLevel(pwd, level))
    .when(level === 'enterprise', (pwd) => {
      // Additional enterprise-level validation
      enforce(pwd).condition(
        (p) => !/^(.)\\1{2,}/.test(p), // No repeated characters
        'Password cannot have repeated characters'
      );
    })
    .build();
};
