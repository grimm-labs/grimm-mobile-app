import { Env } from '@env';
import axios from 'axios';

export const yadioClient = axios.create({
  baseURL: Env.YADIO_API_URL,
});

export const mempoolClient = axios.create({
  baseURL: Env.MEMPOOL_URL,
});
