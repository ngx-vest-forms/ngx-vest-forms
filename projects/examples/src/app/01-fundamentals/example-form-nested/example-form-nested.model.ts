export type NestedFormModel = {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
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
  street: string;
  city: string;
  zipCode: string;
  country: string;
  newsletter: boolean;
  notifications: boolean;
};
