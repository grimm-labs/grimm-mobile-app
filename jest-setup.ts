import '@testing-library/react-native/extend-expect';

import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// react-hook form setup for testing
// @ts-ignore
global.window = {};
// @ts-ignore
global.window = global;
