import { Type } from '@angular/core';

/**
 * Standard interface for example form components
 */
export type NgxFormExampleComponent<T = unknown> = {
  formState(): {
    valid: boolean;
    pending: boolean;
    errors: Record<string, string[]>;
  };
  model(): T;
  onSubmit(): void;
};

/**
 * Standard interface for example page components
 */
export type NgxFormExamplePage<T = unknown> = {
  formComponent?: NgxFormExampleComponent<T>;
};

/**
 * Configuration for the educational cards
 */
export type ExampleCardConfig = {
  demonstrated: {
    icon: string;
    title: string;
    sections: {
      title: string;
      items: string[];
    }[];
  };
  learning: {
    title: string;
    sections: {
      title: string;
      items: string[];
    }[];
    nextStep: {
      text: string;
      link: string;
      linkText: string;
    };
  };
};

/**
 * Content structure for educational examples
 */
export type ExampleContent = {
  title: string;
  description: string;
  demonstrated: {
    icon: string;
    title: string;
    sections: {
      title: string;
      items: string[];
    }[];
  };
  learning: {
    title: string;
    sections: {
      title: string;
      items: string[];
    }[];
    nextStep: {
      text: string;
      route: string;
      label: string;
    };
  };
};

/**
 * Base configuration for form examples
 */
export type FormExampleConfig<T = unknown> = {
  name: string;
  selector: string;
  formComponent: Type<NgxFormExampleComponent<T>>;
  pageComponent: Type<NgxFormExamplePage<T>>;
  model: Type<T>;
  validationSuite: unknown;
  cards: ExampleCardConfig;
};
