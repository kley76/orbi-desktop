const fs = require('node:fs');
const path = require('node:path');
const file = path.resolve(__dirname, '../package.json');
const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));
const full = process.env.GITHUB_REPOSITORY || process.env.ORBI_GITHUB_REPOSITORY;
if (!full || !/^[\w.-]+\/[\w.-]+$/.test(full)) {
  console.error('Defina GITHUB_REPOSITORY (ex.: usuario/orbi-desktop).');
  process.exit(1);
}
const [owner, repo] = full.split('/');
pkg.repository = `https://github.com/${owner}/${repo}`;
pkg.build.publish = [{ provider: 'github', owner, repo, releaseType: 'release' }];
fs.writeFileSync(file, JSON.stringify(pkg, null, 2) + '\n');
console.log(`Publicação configurada: ${owner}/${repo}`);
