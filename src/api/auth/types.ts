import type { User } from '@/interfaces';

export type SignInResponse = {
  accessToken: string;
  refreshToken: string;
  user: User;
};

export type GetOtpResponse = {
  status: number;
  message: string;
};
