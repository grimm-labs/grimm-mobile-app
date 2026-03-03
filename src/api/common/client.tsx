import { Env } from '@env';
import axios from 'axios';

/**
 * Default timeout for all API requests (10 seconds).
 * Prevents hanging connections from blocking the UI.
 */
const DEFAULT_TIMEOUT = 10_000;

/**
 * Shared Axios defaults for all HTTP clients.
 * - timeout: abort requests that exceed DEFAULT_TIMEOUT
 * - headers: explicit Accept to avoid ambiguity
 */
const sharedDefaults = {
  timeout: DEFAULT_TIMEOUT,
  headers: {
    Accept: 'application/json',
  },
};

export const yadioClient = axios.create({
  baseURL: Env.YADIO_API_URL,
  ...sharedDefaults,
});

export const mempoolClient = axios.create({
  baseURL: Env.MEMPOOL_URL,
  ...sharedDefaults,
});
