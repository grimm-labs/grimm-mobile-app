/** Manual mock: published package may omit built `lib/` (git install), so Jest cannot resolve `main`. */
const startIfNotStarted = jest.fn().mockResolvedValue(19050);
const stopIfRunning = jest.fn().mockResolvedValue(undefined);

const defaultExport = jest.fn(() => ({
  startIfNotStarted,
  stopIfRunning,
  getDaemonStatus: jest.fn().mockResolvedValue('DONE'),
  get: jest.fn(),
  post: jest.fn(),
  delete: jest.fn(),
  createTcpConnection: jest.fn(),
}));

export default defaultExport;
