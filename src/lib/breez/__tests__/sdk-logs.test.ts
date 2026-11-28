import fs from 'fs';
import path from 'path';

jest.mock('@breeztech/breez-sdk-spark-react-native', () => require('@/lib/breez/__tests__/helpers/fake-breez-sdk'));

// In-memory expo-file-system: file contents by URI, plus the folders that exist
const mockFiles = new Map<string, string>();
const mockDirs = new Set<string>();
jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///data/app/documents/',
  cacheDirectory: 'file:///data/app/cache/',
  getInfoAsync: jest.fn(async (uri: string) => {
    if (mockDirs.has(uri)) return { exists: true, isDirectory: true, uri };
    if (mockFiles.has(uri)) return { exists: true, isDirectory: false, uri, size: mockFiles.get(uri)!.length };
    return { exists: false, isDirectory: false, uri };
  }),
  makeDirectoryAsync: jest.fn(async (uri: string) => {
    mockDirs.add(uri);
  }),
  deleteAsync: jest.fn(async (uri: string) => {
    mockFiles.delete(uri);
  }),
  moveAsync: jest.fn(async ({ from, to }: { from: string; to: string }) => {
    mockFiles.set(to, mockFiles.get(from)!);
    mockFiles.delete(from);
  }),
  readAsStringAsync: jest.fn(async (uri: string) => mockFiles.get(uri)!),
  writeAsStringAsync: jest.fn(async (uri: string, content: string) => {
    mockFiles.set(uri, content);
  }),
}));

jest.mock('expo-sharing', () => ({ isAvailableAsync: jest.fn(async () => true), shareAsync: jest.fn(async () => {}) }));
const mockSharing = jest.requireMock('expo-sharing') as { isAvailableAsync: jest.Mock; shareAsync: jest.Mock };

import {
  BREEZ_SDK_VERSION,
  exportSdkLogs,
  formatSdkLogsHeader,
  resetSdkLoggingForTests,
  rotateSdkLog,
  SDK_LOG_DIR,
  SDK_LOG_FILE,
  SDK_LOG_MAX_BYTES,
  SDK_PREVIOUS_LOG_FILE,
  startSdkLogging,
} from '../sdk-logs';
import { initLogging } from './helpers/fake-breez-sdk';

const EXPORT_FILE = 'file:///data/app/cache/grimm-breez-sdk-logs.txt';
const header = { appVersion: '1.5.2 (42)', platform: 'android 36', network: 'mainnet', exportedAt: new Date('2026-11-27T10:00:00.000Z') };

describe('SDK logs', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFiles.clear();
    mockDirs.clear();
    mockSharing.isAvailableAsync.mockResolvedValue(true);
    resetSdkLoggingForTests();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  describe('startSdkLogging', () => {
    it('creates the log folder and has the SDK write there with its default filter', async () => {
      await startSdkLogging();

      expect(mockDirs.has(SDK_LOG_DIR)).toBe(true);
      expect(initLogging).toHaveBeenCalledTimes(1);
      expect(initLogging).toHaveBeenCalledWith('/data/app/documents/breez-sdk-logs', undefined, undefined);
    });

    it('starts the SDK logs once per app process', async () => {
      await startSdkLogging();
      await startSdkLogging();

      expect(initLogging).toHaveBeenCalledTimes(1);
    });

    it('never throws when the SDK refuses to log: the wallet works without logs', async () => {
      (initLogging as jest.Mock).mockImplementationOnce(() => {
        throw new Error('logger already set');
      });

      await expect(startSdkLogging()).resolves.toBeUndefined();
      expect(warnSpy).toHaveBeenCalledWith('[Breez SDK] Could not start the SDK logs:', expect.any(Error));
    });
  });

  describe('rotateSdkLog', () => {
    beforeEach(() => {
      mockDirs.add(SDK_LOG_DIR);
    });

    it('keeps a log below the size limit', async () => {
      mockFiles.set(SDK_LOG_FILE, 'recent');

      await rotateSdkLog();

      expect(mockFiles.get(SDK_LOG_FILE)).toBe('recent');
      expect(mockFiles.has(SDK_PREVIOUS_LOG_FILE)).toBe(false);
    });

    it('keeps a full log as the previous one, replacing the older previous log', async () => {
      const full = 'x'.repeat(SDK_LOG_MAX_BYTES);
      mockFiles.set(SDK_LOG_FILE, full);
      mockFiles.set(SDK_PREVIOUS_LOG_FILE, 'older');

      await rotateSdkLog();

      expect(mockFiles.has(SDK_LOG_FILE)).toBe(false);
      expect(mockFiles.get(SDK_PREVIOUS_LOG_FILE)).toBe(full);
    });

    it('does nothing when there is no log yet', async () => {
      await rotateSdkLog();

      expect(mockFiles.size).toBe(0);
    });
  });

  describe('exportSdkLogs', () => {
    it('shares one text file: the header, then the previous and the current log, oldest first', async () => {
      mockFiles.set(SDK_PREVIOUS_LOG_FILE, 'previous lines');
      mockFiles.set(SDK_LOG_FILE, 'current lines');

      await expect(exportSdkLogs(header, 'Breez SDK logs')).resolves.toBe('shared');

      expect(mockFiles.get(EXPORT_FILE)).toBe([formatSdkLogsHeader(header), 'previous lines', 'current lines'].join('\n'));
      expect(mockSharing.shareAsync).toHaveBeenCalledWith(EXPORT_FILE, { mimeType: 'text/plain', UTI: 'public.plain-text', dialogTitle: 'Breez SDK logs' });
    });

    it('shares the current log alone when there is no previous log', async () => {
      mockFiles.set(SDK_LOG_FILE, 'current lines');

      await exportSdkLogs(header, 'Breez SDK logs');

      expect(mockFiles.get(EXPORT_FILE)).toBe([formatSdkLogsHeader(header), 'current lines'].join('\n'));
    });

    it('reports empty logs without opening the share sheet', async () => {
      await expect(exportSdkLogs(header, 'Breez SDK logs')).resolves.toBe('empty');
      mockFiles.set(SDK_LOG_FILE, '');
      await expect(exportSdkLogs(header, 'Breez SDK logs')).resolves.toBe('empty');

      expect(mockSharing.shareAsync).not.toHaveBeenCalled();
    });

    it('reports a device without sharing', async () => {
      mockSharing.isAvailableAsync.mockResolvedValue(false);
      mockFiles.set(SDK_LOG_FILE, 'current lines');

      await expect(exportSdkLogs(header, 'Breez SDK logs')).resolves.toBe('unavailable');
      expect(mockSharing.shareAsync).not.toHaveBeenCalled();
    });
  });

  describe('formatSdkLogsHeader', () => {
    it('names what Breez support asks for: app, SDK version, platform and network', () => {
      expect(formatSdkLogsHeader(header)).toBe(
        ['Grimm App 1.5.2 (42)', `Breez SDK Spark ${BREEZ_SDK_VERSION} (React Native)`, 'Platform: android 36', 'Network: mainnet', 'Exported at: 2026-11-27T10:00:00.000Z', ''].join('\n'),
      );
    });

    it('states the SDK version installed by package.json', () => {
      const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../../package.json'), 'utf8'));

      expect(packageJson.dependencies['@breeztech/breez-sdk-spark-react-native']).toBe(BREEZ_SDK_VERSION);
    });
  });
});
