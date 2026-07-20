# Installation

## Prerequisites

- Node.js (>= 22.12) — required by the Firebase Admin SDK v14, which drops Node.js 18 and 20
- NestJS (>= 9)

> **Upgrading from v1.x?** The Node.js requirement changed in v2.0.0, and one import has to be
> updated. See [[Migrations|Migrations]] for the details, including how to configure Jest.

## Steps

1. Install the package using npm:

```bash
npm install @alpha018/nestjs-firebase-auth firebase-admin
```

or yarn:

```bash
yarn add @alpha018/nestjs-firebase-auth firebase-admin
```

1. **Important**: Obtain your Firebase Service Account credentials JSON file from the Firebase Console (Project Settings > Service accounts). You will need this for configuration.
