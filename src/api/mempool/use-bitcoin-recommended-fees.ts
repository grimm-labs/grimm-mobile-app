import type { AxiosError } from 'axios';
import { createMutation } from 'react-query-kit';

import { mempoolClient } from '../common';
import type { RecommendedFeesResponse } from './types';

type Variables = {};

export const useBitcoinRecommendedFees = createMutation<RecommendedFeesResponse, Variables, AxiosError>({
  mutationFn: async (_variables) =>
    mempoolClient({
      url: '/api/v1/fees/recommended',
      method: 'GET',
    }).then((response) => response.data),
});
