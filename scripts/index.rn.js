/* Patched for react native */

global.Buffer = require('buffer').Buffer;
global.process = require('process');
global.process.env.NODE_ENV = __DEV__ ? 'development' : 'production'; // eslint-disable-line

// Needed so that 'stream-http' chooses the right default protocol.
global.location = { protocol: 'file:' };

// Don't do this in production. You're going to want to patch in
// https://github.com/mvayngrib/react-native-randombytes or similar.
global.crypto = {
  getRandomValues(byteArray) {
    for (let i = 0; i < byteArray.length; i++) {
      byteArray[i] = Math.floor(256 * Math.random());
    }
  },
};

require('../dist/golos.min.js');
module.exports = global.golos;
