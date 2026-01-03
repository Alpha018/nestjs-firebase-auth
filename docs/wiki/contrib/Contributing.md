# Contributing

Thank you for your interest in contributing to `nestjs-firebase-auth`!

## Environment Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/Alpha018/nestjs-firebase-auth.git
   cd nestjs-firebase-auth
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

## Running Tests

We use Jest for both unit and end-to-end tests.

### Unit Tests

Run the unit test suite:

```bash
npm run test
```

### E2E Tests

E2E tests interact with a real Firebase project. To run them, you need to configure your environment variables.

**Required Environment Variables:**

- `FIREBASE_SERVICE_ACCOUNT_BASE64`: Base64 encoded Service Account JSON.
- `FIREBASE_CLIENT_BASE64`: Base64 encoded Client Config (used to initialize the client SDK in tests).
- `FIREBASE_TEST_USER`: The UID of a test user in your Firebase project.

**Running E2E Tests:**

```bash
npm run test:e2e
```

## Pull Request Guidelines

1. **Fork the repository** and create your branch from `master`.
2. **Follow code style**: We use Prettier and ESLint. Run `npm run lint` and `npm run format` to ensure compliance.
3. **Add Tests**: Please include unit or E2E tests for any new features or bug fixes.
4. **Commit Messages**: We follow [Conventional Commits](https://www.conventionalcommits.org/).

## Development Commands

- **Build**: `npm run build`
- **Lint**: `npm run lint`
- **Format**: `npm run format`
