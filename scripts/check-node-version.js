'use strict';

var REQUIRED = [24, 9, 0];

var current = process.versions.node.split('.').map(Number);

function isSupported() {
  for (var i = 0; i < REQUIRED.length; i++) {
    if (current[i] > REQUIRED[i]) return true;
    if (current[i] < REQUIRED[i]) return false;
  }
  return true;
}

if (!isSupported()) {
  var required = REQUIRED.join('.');
  console.error(
    '\n[31mThe test suite requires Node.js ' +
      required +
      ' or newer. You are on ' +
      process.versions.node +
      '.[0m\n\n' +
      '@nestjs/common, @nestjs/core, @nestjs/testing, etc. (v12) ship ESM-only, and the\n' +
      'e2e tests additionally load google-auth-library, which performs a dynamic\n' +
      "import(). Both require Jest's --experimental-vm-modules flag, whose synchronous\n" +
      'vm module APIs are only available on Node ' +
      required +
      ' or newer.\n\n' +
      'This repository ships an .nvmrc, so:\n\n' +
      '    nvm use\n\n' +
      'The published library itself still runs on Node >=22.12 — this gate only\n' +
      'covers the Jest-based test suites (npm test / npm run test:e2e).\n',
  );
  process.exit(1);
}
