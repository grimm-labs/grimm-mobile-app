/**
 * In-memory expo-secure-store for the App Lock tests. The store lives at module level, so it survives unmounting and
 * remounting the provider: a remount stands for an app restart.
 * Use: jest.mock('expo-secure-store', () => require('@/lib/app-lock/__tests__/helpers/fake-secure-store'));
 */

const store = new Map<string, string>();

const get = async (key: string) => store.get(key) ?? null;
const set = async (key: string, value: string) => {
  store.set(key, value);
};
const remove = async (key: string) => {
  store.delete(key);
};

export const getItemAsync = jest.fn(get);
export const setItemAsync = jest.fn(set);
export const deleteItemAsync = jest.fn(remove);

export const fakeSecureStore = {
  /** Empties the store, the call history and any implementation a test put in place. */
  reset() {
    store.clear();
    getItemAsync.mockReset().mockImplementation(get);
    setItemAsync.mockReset().mockImplementation(set);
    deleteItemAsync.mockReset().mockImplementation(remove);
  },
  get: (key: string) => store.get(key) ?? null,
  set: (key: string, value: string) => store.set(key, value),
  keys: () => [...store.keys()].sort(),
  snapshot: () => Object.fromEntries(store),
};
