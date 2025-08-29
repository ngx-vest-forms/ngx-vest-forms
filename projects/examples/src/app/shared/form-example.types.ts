import { Type } from '@angular/core';

/**
 * Standard interface for example form components
 */
export type NgxFormExampleComponent<T = any> = {
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
export type NgxFormExamplePage<T = any> = {
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
 * Base configuration for form examples
 */
export type FormExampleConfig<T = any> = {
  name: string;
  selector: string;
  formComponent: Type<NgxFormExampleComponent<T>>;
  pageComponent: Type<NgxFormExamplePage<T>>;
  model: Type<T>;
  validationSuite: any;
  cards: ExampleCardConfig;
};
