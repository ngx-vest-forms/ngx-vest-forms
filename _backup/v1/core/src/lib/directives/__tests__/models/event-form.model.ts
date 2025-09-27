// Define the form model type with optional Date fields
export type EventFormModel = {
  title?: string;
  startDate?: Date;
  endDate?: Date;
  details?: {
    createdAt?: Date;
    category?: string;
    metadata?: {
      lastUpdated?: Date;
      version?: number;
    };
  };
};
