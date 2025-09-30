import type { AxiosError } from 'axios';
import { createMutation } from 'react-query-kit';

import { client } from '../common';
import type { RatesResponse } from './types';

type Variables = {}; // as react-query-kit is strongly typed, we need to specify the type of the variables as void in case we don't need them

export const useGetBitcoinPrice = createMutation<RatesResponse, Variables, AxiosError>({
  mutationFn: async (_variables) =>
    client({
      url: '/exrates/BTC',
      method: 'GET',
    }).then((response) => response.data),
});
