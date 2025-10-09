/**
 * Model for Field States demonstration
 */
export type FieldStatesModel = {
  email: string;
  username: string;
  password: string;
};

export function createInitialFieldStatesModel(): FieldStatesModel {
  return {
    email: '',
    username: '',
    password: '',
  };
}
