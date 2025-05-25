import type { AxiosError } from 'axios';
import { createMutation } from 'react-query-kit';

import { client } from '../common';
import type { GetOtpResponse } from './types';

type Variables = { phoneNumber: string };

export const useGetOtp = createMutation<GetOtpResponse, Variables, AxiosError>({
  mutationFn: async (variables) =>
    client({
      url: '/auth/get-verification-code',
      method: 'POST',
      data: variables,
    }).then((response) => response.data),
});
