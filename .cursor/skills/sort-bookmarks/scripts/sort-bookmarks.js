const ARCHIVE_TITLE = 'archive';
const JUNK_TITLE_PREFIXES = ['__grafana_sort_result__', '__bookmarks_sort_result__'];
const JUNK_URL_MARKERS = ['grafana.local/sort-result'];

function params() {
	const q = new URLSearchParams(location.search);
	return {
		match: (q.get('match') || q.get('q') || '').trim().toLowerCase(),
		folder: (q.get('folder') || '').trim(),
		parentId: q.get('parent') === 'other' ? '2' : '1',
		skipArchive: q.get('skipArchive') !== '0',
		dry: q.get('dry') === '1'
	};
}

function call(fn, ...args) {
	return new Promise((resolve, reject) => {
		fn(...args, (result) => {
			if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
			else resolve(result);
		});
	});
}

const getTree = () => call(chrome.bookmarks.getTree);
const create = (details) => call(chrome.bookmarks.create, details);
const move = (id, destination) => call(chrome.bookmarks.move, id, destination);
const remove = (id) => call(chrome.bookmarks.remove, id);

function isJunk(node) {
	const title = node.title || '';
	const url = node.url || '';
	return (
		JUNK_TITLE_PREFIXES.some((prefix) => title.startsWith(prefix)) ||
		JUNK_URL_MARKERS.some((marker) => url.includes(marker))
	);
}

function isMatch(node, match) {
	if (!node.url || !match) return false;
	if (isJunk(node)) return false;
	return `${node.title} ${node.url}`.toLowerCase().includes(match);
}

function walk(node, inArchive, acc) {
	const title = (node.title || '').toLowerCase();
	const archiveHere = inArchive || (!node.url && title === ARCHIVE_TITLE);
	acc.nodes.push({ node, inArchive: archiveHere });
	for (const child of node.children || []) walk(child, archiveHere, acc);
}

async function findOrCreateFolder(nodes, folderTitle, parentId, skipArchive) {
	const want = folderTitle.toLowerCase();
	const existing = nodes.find(({ node, inArchive }) => {
		if (node.url) return false;
		if (skipArchive && inArchive) return false;
		return (node.title || '').toLowerCase() === want;
	});
	if (existing) return existing.node;
	return create({ parentId, title: folderTitle });
}

function setStatus(text, title) {
	const el = document.getElementById('status');
	if (el) el.textContent = text;
	document.title = title;
}

async function main() {
	const cfg = params();
	try {
		if (!chrome?.bookmarks) throw new Error('chrome.bookmarks недоступен');
		if (!cfg.match) throw new Error('нет query match');
		if (!cfg.folder) throw new Error('нет folder');

		const tree = await getTree();
		const acc = { nodes: [] };
		for (const root of tree) walk(root, false, acc);

		let junkRemoved = 0;
		for (const { node } of acc.nodes) {
			if (!node.url || !isJunk(node)) continue;
			if (!cfg.dry) await remove(node.id);
			junkRemoved += 1;
		}

		const target = await findOrCreateFolder(acc.nodes, cfg.folder, cfg.parentId, cfg.skipArchive);
		let moved = 0;
		let skipped = 0;
		for (const { node, inArchive } of acc.nodes) {
			if (cfg.skipArchive && inArchive) continue;
			if (!isMatch(node, cfg.match)) continue;
			if (node.id === target.id || node.parentId === target.id) {
				skipped += 1;
				continue;
			}
			if (!cfg.dry) await move(node.id, { parentId: target.id });
			moved += 1;
		}

		setStatus(
			`Готово: перенесено ${moved}, уже в «${cfg.folder}» ${skipped}, мусор ${junkRemoved}.`,
			`Bookmarks sorted ${moved} ${skipped} ${junkRemoved}`
		);
	} catch (error) {
		setStatus('Ошибка: ' + error.message, 'Bookmarks sort failed: ' + error.message);
		console.error(error);
	}
}

main();
