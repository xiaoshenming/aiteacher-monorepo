import { ENCRYPTION_KEY_BITS } from "@excalidraw/common";

import { blobToArrayBuffer } from "./blob";

export const IV_LENGTH_BYTES = 12;

// 检测 Web Crypto API 是否可用（HTTP + 非 localhost 时不可用）
const isSubtleCryptoAvailable =
  typeof window !== "undefined" &&
  typeof window.crypto?.subtle?.importKey === "function";

// ---- Fallback: 开发环境下 HTTP + 局域网 IP 访问时的简单编码 ----
// 注意：这不是真正的加密，仅用于开发环境保持功能可用

function fallbackXorEncode(
  data: Uint8Array<ArrayBuffer>,
  keyBytes: Uint8Array<ArrayBuffer>,
): ArrayBuffer {
  const result = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    result[i] = data[i]! ^ keyBytes[i % keyBytes.length]!;
  }
  return result.buffer as ArrayBuffer;
}

function stringToKeyBytes(key: string): Uint8Array<ArrayBuffer> {
  const encoder = new TextEncoder();
  return encoder.encode(key) as Uint8Array<ArrayBuffer>;
}

// 伪 CryptoKey 对象，用于 fallback 模式
class FallbackCryptoKey {
  readonly rawKey: string;
  constructor(key: string) {
    this.rawKey = key;
  }
}

// ---- Public API (保持原有签名不变) ----

export const createIV = (): Uint8Array<ArrayBuffer> => {
  const arr = new Uint8Array(IV_LENGTH_BYTES);
  if (typeof window.crypto?.getRandomValues === "function") {
    return window.crypto.getRandomValues(arr);
  }
  // Fallback: Math.random (非安全，仅开发用)
  for (let i = 0; i < arr.length; i++) {
    arr[i] = Math.floor(Math.random() * 256);
  }
  return arr;
};

export const generateEncryptionKey = async <
  T extends "string" | "cryptoKey" = "string",
>(
  returnAs?: T,
): Promise<T extends "cryptoKey" ? CryptoKey : string> => {
  if (isSubtleCryptoAvailable) {
    const key = await window.crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: ENCRYPTION_KEY_BITS,
      },
      true,
      ["encrypt", "decrypt"],
    );
    return (
      returnAs === "cryptoKey"
        ? key
        : (await window.crypto.subtle.exportKey("jwk", key)).k
    ) as T extends "cryptoKey" ? CryptoKey : string;
  }
  // Fallback: 生成随机 base64url 字符串作为 key
  const bytes = new Uint8Array(ENCRYPTION_KEY_BITS / 8);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  const rawKey = btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
  if (returnAs === "cryptoKey") {
    return new FallbackCryptoKey(rawKey) as any;
  }
  return rawKey as any;
};

export const getCryptoKey = async (
  key: string,
  usage: KeyUsage,
): Promise<CryptoKey> => {
  if (isSubtleCryptoAvailable) {
    return window.crypto.subtle.importKey(
      "jwk",
      {
        alg: "A128GCM",
        ext: true,
        k: key,
        key_ops: ["encrypt", "decrypt"],
        kty: "oct",
      },
      {
        name: "AES-GCM",
        length: ENCRYPTION_KEY_BITS,
      },
      false,
      [usage],
    );
  }
  return new FallbackCryptoKey(key) as any;
};

export const encryptData = async (
  key: string | CryptoKey,
  data: Uint8Array<ArrayBuffer> | ArrayBuffer | Blob | File | string,
): Promise<{ encryptedBuffer: ArrayBuffer; iv: Uint8Array<ArrayBuffer> }> => {
  const iv = createIV();
  const buffer: ArrayBuffer | Uint8Array<ArrayBuffer> =
    typeof data === "string"
      ? new TextEncoder().encode(data)
      : data instanceof Uint8Array
      ? data
      : data instanceof Blob
      ? await blobToArrayBuffer(data)
      : data;

  if (isSubtleCryptoAvailable) {
    const importedKey =
      typeof key === "string" ? await getCryptoKey(key, "encrypt") : key;
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      importedKey,
      buffer,
    );
    return { encryptedBuffer, iv };
  }

  // Fallback: XOR encode
  const rawKey =
    key instanceof FallbackCryptoKey
      ? key.rawKey
      : typeof key === "string"
      ? key
      : "";
  const keyBytes = stringToKeyBytes(rawKey);
  const dataBytes =
    buffer instanceof Uint8Array
      ? buffer
      : (new Uint8Array(buffer) as Uint8Array<ArrayBuffer>);
  const encryptedBuffer = fallbackXorEncode(dataBytes, keyBytes);
  return { encryptedBuffer, iv };
};

export const decryptData = async (
  iv: Uint8Array<ArrayBuffer>,
  encrypted: Uint8Array<ArrayBuffer> | ArrayBuffer,
  privateKey: string,
): Promise<ArrayBuffer> => {
  if (isSubtleCryptoAvailable) {
    const key = await getCryptoKey(privateKey, "decrypt");
    return window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      encrypted,
    );
  }

  // Fallback: XOR decode (same operation as encode)
  const keyBytes = stringToKeyBytes(privateKey);
  const dataBytes =
    encrypted instanceof Uint8Array
      ? encrypted
      : (new Uint8Array(encrypted) as Uint8Array<ArrayBuffer>);
  return fallbackXorEncode(dataBytes, keyBytes);
};
