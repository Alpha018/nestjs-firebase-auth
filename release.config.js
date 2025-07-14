const isDryRun = process.argv.includes('--dry-run');

module.exports = {
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    [
      '@semantic-release/changelog',
      {
        changelogFile: 'docs/CHANGELOG.md',
      },
    ],
    [
      '@semantic-release/npm',
      {
        npmPublish: true,
        pkgRoot: '.',
      },
    ],
    [
      '@semantic-release/git',
      {
        message: 'chore(release): ${nextRelease.version} [skip ci]',
        assets: ['package.json', 'docs/CHANGELOG.md'],
      },
    ],
    ...(isDryRun ? [] : ['@semantic-release/github']),
  ],
  branches: [{ name: 'main' }],
};
