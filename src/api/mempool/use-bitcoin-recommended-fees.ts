import type { AxiosError } from 'axios';
import { createMutation } from 'react-query-kit';

import { mempoolClient } from '../common';
import type { RecommendedFeesResponse } from './types';

type Variables = {};

const FEES_TIMEOUT_MS = 10_000;

export const useBitcoinRecommendedFees = createMutation<RecommendedFeesResponse, Variables, AxiosError>({
  mutationFn: async (_variables) => {
    // The axios timeout relies on the native HTTP client and did not fire when the host was unreachable
    // (the request hung ~60 s): abort from JS so the caller can fall back to the indexer quickly
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FEES_TIMEOUT_MS);
    try {
      const response = await mempoolClient({
        url: '/api/v1/fees/recommended',
        method: 'GET',
        signal: controller.signal,
      });
      return response.data;
    } finally {
      clearTimeout(timeout);
    }
  },
});
