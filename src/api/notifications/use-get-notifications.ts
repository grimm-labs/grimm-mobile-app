import type { AxiosError } from 'axios';
import { useContext } from 'react';
import { createMutation } from 'react-query-kit';

import type { Notification } from '@/interfaces';
import { AppContext } from '@/lib/context';

import { client } from '../common';

type Variables = {};

export const useGetNotifications = () => {
  const { userToken } = useContext(AppContext);

  return createMutation<Notification[], Variables, AxiosError>({
    mutationFn: async () => {
      const response = await client({
        url: '/notifications',
        method: 'GET',
        headers: {
          Authorization: `Bearer ${userToken?.access}`,
        },
      });

      return response.data;
    },
  })();
};
