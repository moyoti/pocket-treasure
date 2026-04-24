if (typeof global !== 'undefined' && !global.crypto) {
  (global as any).crypto = {};
}

const gCrypto = global.crypto;

if (gCrypto && !gCrypto.getRandomValues) {
  gCrypto.getRandomValues = (array: Uint8Array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  };
}