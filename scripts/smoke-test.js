'use strict';

var assert = require('assert');
var path = require('path');

var distPath = path.join(__dirname, '..', 'dist', 'index.js');

var EXPECTED_EXPORTS = [
  'FirebaseAdminModule',
  'FirebaseProvider',
  'FirebaseUser',
  'FirebaseRolesClaims',
  'Auth',
  'Roles',
  'RequireClaims',
  'FirebaseAuthErrorCode',
  'TokenNotFoundException',
  'TokenInvalidException',
  'TokenExpiredException',
  'TokenRevokedException',
  'InsufficientRoleException',
  'InsufficientClaimsException',
  'Policies',
  'PoliciesGuard',
  'PolicyViolationException',
  'ClaimsGuard',
];

var lib = require(distPath);

require('firebase-admin/auth');
require('firebase-admin/app');

EXPECTED_EXPORTS.forEach(function (name) {
  assert.ok(lib[name], 'missing export from the published entry point: ' + name);
});

assert.strictEqual(
  typeof lib.FirebaseProvider,
  'function',
  'FirebaseProvider should be a constructor',
);

console.log(
  'smoke test passed on Node ' +
    process.versions.node +
    ' (' +
    EXPECTED_EXPORTS.length +
    ' exports verified)',
);
