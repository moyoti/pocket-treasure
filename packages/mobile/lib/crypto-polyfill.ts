if (typeof global !== 'undefined' && !global.crypto) {
  (global as any).crypto = {};
}

const gCrypto = global.crypto;

if (gCrypto && !gCrypto.getRandomValues) {
  gCrypto.getRandomValues = <T extends ArrayBufferView | null>(array: T): T => {
    if (array === null) return null as T;
    const arr = array as Uint8Array;
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return array;
  };
}