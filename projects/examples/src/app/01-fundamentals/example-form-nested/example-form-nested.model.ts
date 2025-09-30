export type NestedFormModel = {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    age?: number; // Number input example
    gender?: string; // Radio button example
    experienceLevel?: number; // Range slider example (1-10)
  };
  addressInfo: {
    street: string;
    city: string;
    zipCode: string;
    country: string;
  };
  preferences: {
    newsletter: boolean;
    notifications: boolean;
  };
};

// Flat model for use with minivest - compatible with validation field names
export type FlatFormModel = {
  firstName: string;
  lastName: string;
  email: string;
  age?: number;
  gender?: string;
  experienceLevel?: number;
  street: string;
  city: string;
  zipCode: string;
  country: string;
  newsletter: boolean;
  notifications: boolean;
};
