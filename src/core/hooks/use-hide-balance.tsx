import { useMMKVBoolean } from 'react-native-mmkv';

import { storage } from '../storage';

const IS_BALANCE_HIDE = 'IS_BALANCE_HIDE';

export const useHideBalance = () => {
  const [isBalanceHide, setIsBalanceHide] = useMMKVBoolean(IS_BALANCE_HIDE, storage);
  if (isBalanceHide !== true) {
    return [false, setIsBalanceHide] as const;
  }
  return [isBalanceHide, setIsBalanceHide] as const;
};
