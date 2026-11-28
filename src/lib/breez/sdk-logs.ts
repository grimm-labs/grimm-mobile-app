import { initLogging } from '@breeztech/breez-sdk-spark-react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/** Must match the version in package.json (a unit test checks it): Breez support asks for it with the logs. */
export const BREEZ_SDK_VERSION = '0.28.6';

/** Where the Breez SDK writes its log file. The SDK appends to `sdk.log` and never trims it. */
export const SDK_LOG_DIR = `${FileSystem.documentDirectory}breez-sdk-logs`;
export const SDK_LOG_FILE = `${SDK_LOG_DIR}/sdk.log`;
export const SDK_PREVIOUS_LOG_FILE = `${SDK_LOG_DIR}/sdk.previous.log`;
/** Past this size, the next app start keeps `sdk.log` as the previous log and the SDK starts a new one: at most about twice this on disk. */
export const SDK_LOG_MAX_BYTES = 5 * 1024 * 1024;

const EXPORT_FILE = `${FileSystem.cacheDirectory}grimm-breez-sdk-logs.txt`;

let loggingStarted = false;

/** The SDK takes a plain path, without the `file://` scheme of expo-file-system. */
function toNativePath(uri: string): string {
  return uri.replace('file://', '');
}

async function fileSize(uri: string): Promise<number | null> {
  const info = await FileSystem.getInfoAsync(uri);
  return info.exists ? (info.size ?? 0) : null;
}

/** Keeps the log folder bounded: a full `sdk.log` replaces the previous log. Run it before the SDK opens the file. */
export async function rotateSdkLog(): Promise<void> {
  const dirInfo = await FileSystem.getInfoAsync(SDK_LOG_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(SDK_LOG_DIR, { intermediates: true });
    return;
  }

  const size = await fileSize(SDK_LOG_FILE);
  if (size === null || size < SDK_LOG_MAX_BYTES) return;

  await FileSystem.deleteAsync(SDK_PREVIOUS_LOG_FILE, { idempotent: true });
  await FileSystem.moveAsync({ from: SDK_LOG_FILE, to: SDK_PREVIOUS_LOG_FILE });
}

/**
 * Has the SDK write its logs to `sdk.log` with its default filter (debug for the Breez and Spark crates, info for the rest),
 * the level Breez support needs. The SDK can start logging only once per process, so later calls do nothing.
 * Never throws: the wallet works without logs.
 */
export async function startSdkLogging(): Promise<void> {
  if (loggingStarted) return;
  loggingStarted = true;

  try {
    await rotateSdkLog();
    initLogging(toNativePath(SDK_LOG_DIR), undefined, undefined);
  } catch (error) {
    console.warn('[Breez SDK] Could not start the SDK logs:', error);
  }
}

export type SdkLogsHeader = { appVersion: string; platform: string; network: string; exportedAt: Date };

export function formatSdkLogsHeader({ appVersion, platform, network, exportedAt }: SdkLogsHeader): string {
  return [`Grimm App ${appVersion}`, `Breez SDK Spark ${BREEZ_SDK_VERSION} (React Native)`, `Platform: ${platform}`, `Network: ${network}`, `Exported at: ${exportedAt.toISOString()}`, ''].join('\n');
}

export type ExportSdkLogsResult = 'shared' | 'empty' | 'unavailable';

/**
 * Opens the share sheet with one text file: the header, then the previous log and the current log, oldest first.
 * The logs hold payment and address details but never the Recovery Phrase.
 */
export async function exportSdkLogs(header: SdkLogsHeader, dialogTitle: string): Promise<ExportSdkLogsResult> {
  if (!(await Sharing.isAvailableAsync())) return 'unavailable';

  const logs: string[] = [];
  for (const file of [SDK_PREVIOUS_LOG_FILE, SDK_LOG_FILE]) {
    if ((await fileSize(file)) !== null) {
      logs.push(await FileSystem.readAsStringAsync(file));
    }
  }
  if (logs.every((log) => log.length === 0)) return 'empty';

  await FileSystem.writeAsStringAsync(EXPORT_FILE, [formatSdkLogsHeader(header), ...logs].join('\n'));
  await Sharing.shareAsync(EXPORT_FILE, { mimeType: 'text/plain', UTI: 'public.plain-text', dialogTitle });
  return 'shared';
}

/** Tests only: lets a test start the logs again. */
export function resetSdkLoggingForTests(): void {
  loggingStarted = false;
}
