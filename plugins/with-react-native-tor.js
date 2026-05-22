/**
 * react-native-tor native wiring for Expo prebuild:
 * - Android: sifir_android.aar contains jni/arm64/ (invalid ABI for AGP 8). We explode the AAR,
 *   remove jni/arm64, use classes.jar + jni/* (arm64-v8a, …).
 * - iOS: disable Bitcode (native Tor libs do not support it).
 *
 * @param {import('@expo/config-plugins').ExpoConfig} config
 * @returns {import('@expo/config-plugins').ExpoConfig}
 */
const { withAppBuildGradle, withXcodeProject } = require('@expo/config-plugins');

const SIFIR_MARKER = 'prepareSifirTorAar';

const MIN_SDK_LINE = '        minSdkVersion Math.max((rootProject.ext.minSdkVersion as int), 26) // react-native-tor / sifir_android requires 26+';
const MIN_SDK_MARKER = 'Math.max((rootProject.ext.minSdkVersion as int), 26)';

/** Groovy inserted before `android {` — use single-quoted JS chunks so ${buildDir} is literal in Gradle. */
const SIFIR_PREP_BLOCK = [
  '// sifir_android.aar ships jni/arm64 (not a valid ABI for AGP 8). Explode AAR, drop jni/arm64, bundle classes.jar + jni/.',
  'def sifirTorAar = file("${rootDir}/../node_modules/react-native-tor/android/libs/sifir_android.aar")',
  "def prepareSifirTorAar = tasks.register('prepareSifirTorAar') {",
  '    def exploded = file("${buildDir}/sifir-tor-exploded")',
  '    inputs.file(sifirTorAar)',
  '    outputs.dir(exploded)',
  '    doLast {',
  '        exploded.deleteDir()',
  '        copy {',
  '            from(zipTree(sifirTorAar))',
  '            into(exploded)',
  '        }',
  '        def legacyArm64 = file("${exploded}/jni/arm64")',
  '        if (legacyArm64.exists()) {',
  '            legacyArm64.deleteDir()',
  '        }',
  '    }',
  '}',
  'tasks.preBuild.dependsOn(prepareSifirTorAar)',
  '',
].join('\n');

const SIFIR_SOURCE_SETS = `
    sourceSets {
        main {
            jniLibs.srcDirs += "\${buildDir}/sifir-tor-exploded/jni"
        }
    }`;

const SIFIR_VARIANT_HOOK = `
android.applicationVariants.configureEach { variant ->
    tasks.matching { it.name == "merge\${variant.name.capitalize()}NativeLibs" }.configureEach {
        dependsOn(prepareSifirTorAar)
    }
}
`;

const SIFIR_IMPL_LINE = '    implementation(files("${buildDir}/sifir-tor-exploded/classes.jar").builtBy(prepareSifirTorAar))';

function withReactNativeTorAndroid(config) {
  return withAppBuildGradle(config, (mod) => {
    let { contents } = mod.modResults;

    // Never use raw AAR: AGP mergeNativeLibs fails on jni/arm64.
    contents = contents.replace(/\s*implementation\(files\("[^"]*sifir_android\.aar"\)\)\s*\n?/g, '\n');

    if (!contents.includes(SIFIR_MARKER)) {
      contents = contents.replace(/^android \{/m, `${SIFIR_PREP_BLOCK}\nandroid {`);

      if (contents.includes('androidResources')) {
        contents = contents.replace(/(androidResources\s*\{[\s\S]*?\}\s*)/m, `$1${SIFIR_SOURCE_SETS}\n`);
      } else {
        contents = contents.replace(/\n}\n\n\/\/ Apply static values/m, `${SIFIR_SOURCE_SETS}\n}\n\n// Apply static values`);
      }

      if (!contents.includes('applicationVariants.configureEach')) {
        contents = contents.replace(/\n(dependencies\s*\{)/, `${SIFIR_VARIANT_HOOK}\n$1`);
      }
      if (!contents.includes('sifir-tor-exploded/classes.jar')) {
        contents = contents.replace(/dependencies\s*\{/, `dependencies {\n${SIFIR_IMPL_LINE}\n`);
      }
    }

    if (!contents.includes(MIN_SDK_MARKER)) {
      contents = contents.replace(/minSdkVersion\s+rootProject\.ext\.minSdkVersion/, MIN_SDK_LINE);
    }

    mod.modResults.contents = contents;
    return mod;
  });
}

function withReactNativeTorIos(config) {
  return withXcodeProject(config, (mod) => {
    const configurations = mod.modResults.pbxXCBuildConfigurationSection();
    for (const section of Object.values(configurations)) {
      if (typeof section !== 'object' || section === null || section.buildSettings === undefined) {
        continue;
      }
      section.buildSettings.ENABLE_BITCODE = 'NO';
    }
    return mod;
  });
}

module.exports = function withReactNativeTor(config) {
  config = withReactNativeTorAndroid(config);
  config = withReactNativeTorIos(config);
  return config;
};
