const mockExecAsync = jest.fn();
const mockCloseAsync = jest.fn();
const mockOpenDatabaseAsync = jest.fn();
const mockDeleteDatabaseAsync = jest.fn();

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: (...args: unknown[]) => mockOpenDatabaseAsync(...args),
  deleteDatabaseAsync: (...args: unknown[]) => mockDeleteDatabaseAsync(...args),
}));

import { getAppDatabase, resetAppDatabase } from '../database';

describe('database', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    mockOpenDatabaseAsync.mockResolvedValue({
      execAsync: mockExecAsync,
      closeAsync: mockCloseAsync,
    });
    mockDeleteDatabaseAsync.mockResolvedValue(undefined);
    await resetAppDatabase();
  });

  it('initializes the schema on first access', async () => {
    await getAppDatabase();

    expect(mockOpenDatabaseAsync).toHaveBeenCalledWith('grimm-local.db');
    expect(mockExecAsync).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS transaction_notes'));
  });

  it('reuses the same database promise', async () => {
    await getAppDatabase();
    await getAppDatabase();

    expect(mockOpenDatabaseAsync).toHaveBeenCalledTimes(1);
  });

  it('closes and deletes the database on reset', async () => {
    await getAppDatabase();
    await resetAppDatabase();

    expect(mockCloseAsync).toHaveBeenCalled();
    expect(mockDeleteDatabaseAsync).toHaveBeenCalledWith('grimm-local.db');
  });
});
