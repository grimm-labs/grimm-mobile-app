export type SignInResponse = {
  accessToken: string;
  refreshToken: string;
};

export type GetOtpResponse = {
  status: number;
  message: string;
};
