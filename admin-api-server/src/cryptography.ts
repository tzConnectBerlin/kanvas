import { Logger } from '@nestjs/common';
const bs58check = require('bs58check');
const sodium = require('libsodium-wrappers');

export function bs58Encode(payload: any, prefix: any): string {
  const n = new Uint8Array(prefix.length + payload.length);
  n.set(prefix);
  n.set(payload, prefix.length);
  return bs58check.encode(Buffer.from(n)).toString('hex');
}

function bs58decode(enc: any, prefix: any) {
  let n = bs58check.decode(enc);
  n = n.slice(prefix.length);
  return n;
}

export async function signPayload(
  privKey: string,
  payload: string,
): Promise<{ message: string; signature: string }> {
  console.log(payload);
  try {
    await sodium.ready;
    const hexPayload = Buffer.from(payload).toString('hex');

    const signature = sodium.crypto_sign_detached(
      sodium.crypto_generichash(32, Buffer.from(payload)),
      bs58decode(privKey, new Uint8Array([43, 246, 78, 7])),
      'uint8array',
    );
    const edsignature = bs58Encode(
      signature,
      new Uint8Array([9, 245, 205, 134, 18]),
    );

    console.log('Payload: ', Buffer.from(payload).toString('hex'));
    console.log('Signed payload: ', edsignature);

    return {
      message: hexPayload,
      signature: edsignature,
    };
  } catch (error: any) {
    throw `failed to sign payload (payload=${payload}), err: ${JSON.stringify(
      error,
    )}`;
  }
}
