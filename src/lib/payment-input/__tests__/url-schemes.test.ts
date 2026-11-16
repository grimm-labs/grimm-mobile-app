import fs from 'node:fs';
import path from 'node:path';

import createExpoConfig from '../../../../app.config';

// The root env.js loads and validates .env.<APP_ENV>, which tests do not have
jest.mock('../../../../env.js', () => ({
  Env: { APP_ENV: 'development', NAME: 'Grimm App', SCHEME: 'GrimmApp', BUNDLE_ID: 'com.grimm.labs.app.development', PACKAGE: 'com.grimm.labs.app.development', VERSION: '1.0.0' },
  ClientEnv: {},
}));

const ROOT = path.resolve(__dirname, '../../../..');
const read = (file: string) => fs.readFileSync(path.join(ROOT, file), 'utf8');

describe('URL schemes (P2-18)', () => {
  const config = createExpoConfig({ config: {} } as never);

  it('app.config registers bitcoin and lightning on iOS and Android, and no LUD-17 scheme', () => {
    const iosSchemes = (config.ios?.infoPlist?.CFBundleURLTypes as { CFBundleURLSchemes: string[] }[]).flatMap(({ CFBundleURLSchemes }) => CFBundleURLSchemes);
    const androidSchemes = (config.android?.intentFilters ?? []).flatMap(({ data }) => (Array.isArray(data) ? data : [data]).map((entry) => entry?.scheme));

    expect(iosSchemes).toEqual(expect.arrayContaining(['GrimmApp', 'lightning', 'bitcoin']));
    expect(androidSchemes).toEqual(expect.arrayContaining(['lightning', 'bitcoin']));
    for (const scheme of ['lnurlw', 'lnurlp', 'keyauth']) {
      expect(iosSchemes).not.toContain(scheme);
      expect(androidSchemes).not.toContain(scheme);
    }
  });

  it('the Android intent filters open links from the browser', () => {
    const bitcoinFilter = config.android?.intentFilters?.find(({ data }) => (Array.isArray(data) ? data : [data]).some((entry) => entry?.scheme === 'bitcoin'));

    expect(bitcoinFilter).toMatchObject({ action: 'VIEW', category: expect.arrayContaining(['BROWSABLE', 'DEFAULT']) });
  });

  it('the committed AndroidManifest.xml and Info.plist register bitcoin', () => {
    expect(read('android/app/src/main/AndroidManifest.xml')).toContain('<data android:scheme="bitcoin"/>');
    expect(read('ios/GrimmApp/Info.plist')).toMatch(/<key>CFBundleURLSchemes<\/key>\s*<array>\s*<string>bitcoin<\/string>/);
  });
});
