export type UserProfile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  bio: string | null;
  receiveNewsletter: boolean;
  notificationPreferences: {
    push: boolean;
    email: boolean;
    sms: boolean;
  };
};

export const initialUserProfile: UserProfile = {
  id: '123',
  firstName: '',
  lastName: '',
  email: '',
  bio: null,
  receiveNewsletter: false,
  notificationPreferences: {
    push: true,
    email: true,
    sms: false,
  },
};
