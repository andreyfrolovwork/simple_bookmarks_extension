import { cpSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'dist');
const dest = join(root, 'dist-yandex');
const zip = join(root, 'bookmark-manager-yandex.zip');

rmSync(dest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true });

const manifestPath = join(dest, 'manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
if (!manifest.chrome_url_overrides) {
	console.error('Chrome dist manifest has no chrome_url_overrides; run npm run build first');
	process.exit(1);
}

delete manifest.chrome_url_overrides;
manifest.description =
	'Visual bookmark manager: folders, search, local click stats, and archive unused links.';
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

rmSync(zip, { force: true });
execSync(`zip -r "${zip}" . -x '*.map' -x '*.DS_Store' -x '**/.DS_Store'`, {
	cwd: dest,
	stdio: 'inherit'
});

console.log('Yandex pack:', zip);
