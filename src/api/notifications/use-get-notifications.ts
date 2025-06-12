import type { AxiosError } from 'axios';
import { createMutation } from 'react-query-kit';

import type { Notification } from '@/interfaces';

import { client } from '../common';

type Variables = {};

export const useGetNotifications = createMutation<Notification[], Variables, AxiosError>({
  mutationFn: async () =>
    client({
      url: '/notifications',
      method: 'GET',
    }).then((response) => response.data),
});
