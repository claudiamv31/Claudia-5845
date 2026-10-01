const PBKDF2_ITERATIONS = 100_000;
const SALT_LENGTH = 16;
const HASH_LENGTH = 256;

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join(
    '',
  );
}

function hexToBytes(value: string): Uint8Array<ArrayBuffer> | null {
  if (value.length % 2 !== 0 || !/^[a-f0-9]+$/i.test(value)) {
    return null;
  }

  const bytes = new Uint8Array(value.length / 2);

  for (let index = 0; index < value.length; index += 2) {
    bytes[index / 2] = Number.parseInt(value.slice(index, index + 2), 16);
  }

  return bytes;
}

async function derivePassword(
  password: string,
  salt: Uint8Array<ArrayBufferLike>,
): Promise<Uint8Array<ArrayBuffer>> {
  const safeSalt = new Uint8Array(salt);
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: safeSalt,
      iterations: PBKDF2_ITERATIONS,
    },
    passwordKey,
    HASH_LENGTH,
  );

  return new Uint8Array(derivedBits);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const derivedPassword = await derivePassword(password, salt);

  return [
    'pbkdf2_sha256',
    PBKDF2_ITERATIONS,
    bytesToHex(salt),
    bytesToHex(derivedPassword),
  ].join('$');
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  const [algorithm, iterations, saltValue, expectedHashValue, extraPart] =
    passwordHash.split('$');

  if (
    algorithm !== 'pbkdf2_sha256' ||
    Number(iterations) !== PBKDF2_ITERATIONS ||
    !saltValue ||
    !expectedHashValue ||
    extraPart !== undefined
  ) {
    return false;
  }

  const salt = hexToBytes(saltValue);
  const expectedHash = hexToBytes(expectedHashValue);

  if (
    !salt ||
    salt.length !== SALT_LENGTH ||
    !expectedHash ||
    expectedHash.length !== HASH_LENGTH / 8
  ) {
    return false;
  }

  const actualHash = await derivePassword(password, salt);

  if (actualHash.length !== expectedHash.length) {
    return false;
  }

  let difference = 0;
  for (let index = 0; index < actualHash.length; index += 1) {
    difference |= (actualHash[index] ?? 0) ^ (expectedHash[index] ?? 0);
  }

  return difference === 0;
}
