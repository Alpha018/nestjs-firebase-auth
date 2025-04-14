export const userDecode = {
  roles: ['admin'],
  iss: 'https://securetoken.google.com/project-test-123',
  aud: 'project-test-123',
  auth_time: 1111111111,
  user_id: 'super-user-id-mock-test',
  sub: 'super-sub-mock-test',
  iat: 1111111111,
  exp: 1111111111,
  email: 'test@test.com',
  email_verified: false,
  firebase: {
    identities: {
      email: ['test@test.com'],
    },
    sign_in_provider: 'custom',
  },
};
