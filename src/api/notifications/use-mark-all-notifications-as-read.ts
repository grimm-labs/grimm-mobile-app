import type { AxiosError } from 'axios';
import { createMutation } from 'react-query-kit';

import { client } from '../common';
import type { Response } from './types';

type Variables = {};

export const useMarkAllNotificationsAsRead = createMutation<Response, Variables, AxiosError>({
  mutationFn: async () =>
    client({
      url: '/notifications/mark-all-as-read',
      method: 'POST',
    }).then((response) => response.data),
});
