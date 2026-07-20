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
    '\n[31mThe e2e suite requires Node.js ' +
      required +
      ' or newer. You are on ' +
      process.versions.node +
      '.[0m\n\n' +
      'The e2e tests reach a real Firebase project, so they load google-auth-library,\n' +
      'which performs a dynamic import() that Jest can only resolve with\n' +
      '--experimental-vm-modules. That flag in turn makes Jest treat `jose` as ESM,\n' +
      'which it can only require from CommonJS on Node ' +
      required +
      ' or newer.\n\n' +
      'This repository ships an .nvmrc, so:\n\n' +
      '    nvm use\n\n' +
      'The unit suite (npm test) and the published library both run on Node >=22.12.\n',
  );
  process.exit(1);
}
