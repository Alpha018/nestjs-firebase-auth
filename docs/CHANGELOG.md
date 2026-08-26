# [3.0.0](https://github.com/Alpha018/nestjs-firebase-auth/compare/v2.0.1...v3.0.0) (2026-08-26)


* fix(firebase-guard)!: replace boolean auth failures with typed 401/403 exceptions ([c9d6cdc](https://github.com/Alpha018/nestjs-firebase-auth/commit/c9d6cdc905d226a9a0f1dee72b41969f79bcc0a0))
* refactor(firebase-guard)!: drop RolesGuard, FirebaseUserClaims and the FirebaseGuard export ([b81ccce](https://github.com/Alpha018/nestjs-firebase-auth/commit/b81ccce59cbef276de4a82693bee0b44cec0cacf))


### Bug Fixes

* **exports:** drop stale FirebaseGuard from smoke test, export ClaimsGuard ([6576166](https://github.com/Alpha018/nestjs-firebase-auth/commit/65761668d8358946db26afa7e53cbaa816e303a7))
* **firebase-admin-module:** resolve FirebaseGuard dependencies in forRoot ([bd65d42](https://github.com/Alpha018/nestjs-firebase-auth/commit/bd65d425403369587ffa1c822efaf9f5bfa09220))
* **guards:** harden guards and provider against null/undefined inputs ([4b113ce](https://github.com/Alpha018/nestjs-firebase-auth/commit/4b113ce665ee237bc92d231dcf72bef6a6fd0f7d))
* **policy:** populate PolicyContext.claims without requiring @Roles() ([33a98bc](https://github.com/Alpha018/nestjs-firebase-auth/commit/33a98bcd2bf78a49f3adb59ac022093bd9f4dfee))


### Features

* **claims:** add claim-based authorization ([2e5ba28](https://github.com/Alpha018/nestjs-firebase-auth/commit/2e5ba2825aebc861e2fed4c458dde714d0bbf969))
* **policy:** add ABAC policy-based authorization ([b247042](https://github.com/Alpha018/nestjs-firebase-auth/commit/b2470420abb497829a3aa2a8212723341428dcc5))


### BREAKING CHANGES

* RolesGuard(...), FirebaseUserClaims() and the FirebaseGuard
class are no longer exported. Use @Roles(...), @FirebaseRolesClaims() and
@Auth()/@Roles(...) instead. See docs/wiki/guides/Migrations.md.
* requests with a missing or invalid token now respond 401
instead of 403. See docs/wiki/guides/Migrations.md for the full mapping
and an upgrade example.

## [2.0.1](https://github.com/Alpha018/nestjs-firebase-auth/compare/v2.0.0...v2.0.1) (2026-08-17)


### Performance Improvements

* **guard:** resolve JWT extractor once and drop root firebase-admin import ([708817a](https://github.com/Alpha018/nestjs-firebase-auth/commit/708817af7c9a24594c5469f3749a9b143be0eda7))

# [2.0.0](https://github.com/Alpha018/nestjs-firebase-auth/compare/v1.11.0...v2.0.0) (2026-07-20)


* feat!: upgrade firebase-admin to v14 and typescript to v6 ([8246007](https://github.com/Alpha018/nestjs-firebase-auth/commit/82460071ce5fc8730a5ca5d6ebdc8cf68b9e6ae6))


### BREAKING CHANGES

* the minimum supported Node.js version is now 22.12.0.
firebase-admin v14 drops Node.js 18 and 20, and depends on the ESM-only `jose`
package, which requires `require(ESM)` support. Node.js 20 reached end-of-life
on 2026-04-30.

Consumers who type parameters with `auth.DecodedIdToken` imported from the
`firebase-admin` root must switch to `DecodedIdToken` from `firebase-admin/auth`.
This library's own API is unchanged.

Running the test suite additionally requires Node.js 24.9+, because Jest needs
the synchronous vm module APIs to load `jose` from CommonJS.

# [1.11.0](https://github.com/Alpha018/nestjs-firebase-auth/compare/v1.10.0...v1.11.0) (2026-03-06)


### Features

* enhance documentation and testing configuration ([834c410](https://github.com/Alpha018/nestjs-firebase-auth/commit/834c4104939c122214cc5b92981e200158e05efc))

# [1.10.0](https://github.com/Alpha018/nestjs-firebase-auth/compare/v1.9.1...v1.10.0) (2026-01-03)


### Features

* upgrade libraries, add firestore e2e tests and create wiki ([5ad384f](https://github.com/Alpha018/nestjs-firebase-auth/commit/5ad384fd39a50694ddbaa8dfb8724b7506e50a6e)), closes [#4](https://github.com/Alpha018/nestjs-firebase-auth/issues/4)

## [1.9.1](https://github.com/Alpha018/nestjs-firebase-auth/compare/v1.9.0...v1.9.1) (2025-12-17)


### Bug Fixes

* update migration guide version in README ([423cde9](https://github.com/Alpha018/nestjs-firebase-auth/commit/423cde985a84bc7598c0ecb41d4f746aeaae6ba0))

# [1.9.0](https://github.com/Alpha018/nestjs-firebase-auth/compare/v1.8.1...v1.9.0) (2025-12-17)


### Features

* enhance decorators, optimize guard performance and enable strict mode ([acc85c4](https://github.com/Alpha018/nestjs-firebase-auth/commit/acc85c42a6f2f6ea1977bb861e60a4022948811d))

## [1.8.1](https://github.com/Alpha018/nestjs-firebase-auth/compare/v1.8.0...v1.8.1) (2025-12-14)


### Bug Fixes

* **firebase:** streamline FirebaseProvider tests and improve code structure ([23f037c](https://github.com/Alpha018/nestjs-firebase-auth/commit/23f037cf3a541174ac0cdf7adaa9288786ae8322))

# [1.8.0](https://github.com/Alpha018/nestjs-firebase-auth/compare/v1.7.0...v1.8.0) (2025-09-17)


### Bug Fixes

* **workflow:** add FIREBASE_TEST_USER_LOCAL environment variable ([6e3dba6](https://github.com/Alpha018/nestjs-firebase-auth/commit/6e3dba627a4b6b1b0274226bbf090c0c46208206))


### Features

* **user.controller:** add new endpoints for managing claims and roles ([e727a6e](https://github.com/Alpha018/nestjs-firebase-auth/commit/e727a6e1d799490893bace727025d99c4a46cf89))

# [1.7.0](https://github.com/Alpha018/nestjs-firebase-auth/compare/v1.6.1...v1.7.0) (2025-09-09)


### Features

* **firebase:** update claims and user metadata retrieval ([2266547](https://github.com/Alpha018/nestjs-firebase-auth/commit/2266547539ba10d77fceef4abf082e1e22446626))

## [1.6.1](https://github.com/Alpha018/nestjs-firebase-auth/compare/v1.6.0...v1.6.1) (2025-09-08)


### Bug Fixes

* **scripts:** simplify postinstall script in package.json ([f873753](https://github.com/Alpha018/nestjs-firebase-auth/commit/f873753713c9bf48bdbd387654b8904c64e40715))

# [1.6.0](https://github.com/Alpha018/nestjs-firebase-auth/compare/v1.5.0...v1.6.0) (2025-07-30)


### Features

* **firebase:** add comprehensive documentation for firebase decorators and provider ([91c1667](https://github.com/Alpha018/nestjs-firebase-auth/commit/91c16670267c35000a17c170ee8d55c4f1333b60))

# [1.5.0](https://github.com/Alpha018/nestjs-firebase-auth/compare/v1.4.0...v1.5.0) (2025-07-14)


### Features

* **workflows:** remove Node.js 18.x from test and build matrix and force release ([55b1989](https://github.com/Alpha018/nestjs-firebase-auth/commit/55b1989332817c4779dc60c19b90e55ac2a0d40b))

# [1.4.0](https://github.com/Alpha018/nestjs-firebase-auth/compare/v1.3.0...v1.4.0) (2025-04-14)


### Features

* **firebase:** add local role validation feature ([dbfc40c](https://github.com/Alpha018/nestjs-firebase-auth/commit/dbfc40c1185ab286739e1abf6da1b8019969cb09))

# [1.3.0](https://github.com/Alpha018/nestjs-firebase-auth/compare/v1.2.0...v1.3.0) (2025-02-10)


### Bug Fixes

* **README:** correct injection token for ticket service configuration ([7545f28](https://github.com/Alpha018/nestjs-firebase-auth/commit/7545f28765180c6db764e6e891084a9402d9b30a))


### Features

* **ci:** enhance GitHub Actions and introduce e2e tests ([63e15df](https://github.com/Alpha018/nestjs-firebase-auth/commit/63e15df01abdd8038f065d67384dc91838d11201))

# [1.2.0](https://github.com/Alpha018/nestjs-firebase-auth/compare/v1.1.1...v1.2.0) (2024-09-03)


### Features

* **firebase:** enhance Firebase integration with improved decorators and guards ([3d9bf45](https://github.com/Alpha018/nestjs-firebase-auth/commit/3d9bf45d85e11a3eade6cf94174923aca949b351))

## [1.1.1](https://github.com/Alpha018/nestjs-firebase-auth/compare/v1.1.0...v1.1.1) (2024-09-03)


### Bug Fixes

* remove debug console log from FirebaseAdminModule ([235fa08](https://github.com/Alpha018/nestjs-firebase-auth/commit/235fa08e49bd74c3d9d2de7f7520ec840fdb6c93))

# [1.1.0](https://github.com/Alpha018/nestjs-firebase-auth/compare/v1.0.0...v1.1.0) (2024-09-03)


### Features

* **workflow:** add build step to GitHub Actions workflow ([125c990](https://github.com/Alpha018/nestjs-firebase-auth/commit/125c990c295be360596047a56a8b79f8c3ed4eae))

# 1.0.0 (2024-09-03)


### Features

* **ci:** add npm install step to GitHub Actions workflow ([31c57d7](https://github.com/Alpha018/nestjs-firebase-auth/commit/31c57d76328ae9321883a7c189b17a1eec690128))
* main commit with the project in general to make the first version and the unit test ([127bd07](https://github.com/Alpha018/nestjs-firebase-auth/commit/127bd07df9236f8008df09f623ddb1c10baf172b))
