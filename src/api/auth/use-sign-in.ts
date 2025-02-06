import type { AxiosError } from 'axios';
import { createMutation } from 'react-query-kit';

import { client } from '../common';
import type { SignInResponse } from './types';

type Variables = { phoneNumber: string; otp: string };

export const useSignIn = createMutation<SignInResponse, Variables, AxiosError>({
  mutationFn: async (variables) =>
    client({
      url: 'auth/sign-in',
      method: 'POST',
      data: variables,
    }).then((response) => response.data),
});
