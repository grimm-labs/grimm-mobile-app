/**
 * Minimal type stub for uniffi-bindgen-react-native.
 * Breez SDK imports this package transitively; the upstream source has strict
 * ArrayBuffer typing issues under our tsconfig. This stub satisfies tsc only.
 */
declare module 'uniffi-bindgen-react-native' {
  export type UniffiByteArray = Uint8Array;
  export type UniffiRustArcPtr = unknown;
  export type UnsafeMutableRawPointer = unknown;
  export type UniffiRustCallStatus = unknown;
  export type UniffiResult<T> = T;

  export class FfiConverterObject {}
  export class FfiConverterObjectWithCallbacks {}
  export class RustBuffer {}
  export class UniffiAbstractObject {}
  export class UniffiInternalError extends Error {}
  export class UniffiRustCaller {}

  export const destructorGuardSymbol: unique symbol;
  export const pointerLiteralSymbol: unique symbol;
  export const uniffiTypeNameSymbol: unique symbol;

  export function uniffiCreateFfiConverterString(): unknown;
}
