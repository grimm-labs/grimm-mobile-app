import type { AxiosError } from 'axios';
import { useContext } from 'react';
import { createMutation } from 'react-query-kit';

import { AppContext } from '@/lib/context';

import { client } from '../common';
import type { Response } from './types';

type Variables = {};

export const useMarkAllNotificationsAsRead = () => {
  const { userToken } = useContext(AppContext);

  return createMutation<Response, Variables, AxiosError>({
    mutationFn: async () => {
      const response = await client({
        url: '/notifications/mark-all-as-read',
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${userToken?.access}`,
        },
      });

      return response.data;
    },
  })();
};
