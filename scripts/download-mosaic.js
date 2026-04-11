/**
 * Download all mosaic card images from TCGdex API
 * Run: node scripts/download-mosaic.js
 */
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..', 'img', 'mosaic');

const rows = [
  [
    { id: 'SV10-039', l: 'ja' },
    { id: 'sv03-205', l: 'fr' },
    { id: 'ex13-104', l: 'en' },
    { id: 'xyp-XY166', l: 'en' },
    { id: 'sv10.5w-027', l: 'fr' },
    { id: 'swsh9-154', l: 'fr' },
    { id: 's12a-262', l: 'ja' },
    { id: 'swsh7-192', l: 'fr' },
    { id: 'xy3-113', l: 'fr' },
    { id: 'ex7-107', l: 'en' },
  ],
  [
    { id: 'sv4M-074', l: 'ja' },
    { id: 'me02.5-286', l: 'en' },
    { id: 'swsh11-TG04', l: 'fr' },
    { id: 'sv04.5-233', l: 'fr' },
    { id: 'swsh12-TG17', l: 'fr' },
    { id: 'xy6-100', l: 'fr' },
    { id: 'sv8a-207', l: 'ja' },
    { id: 'swsh12-TG19', l: 'fr' },
    { id: 'hgss1-105', l: 'fr' },
    { id: 'sv08-237', l: 'fr' },
  ],
  [
    { id: 'dp19-DP19', l: 'en' },
    { id: 'swsh11-186', l: 'fr' },
    { id: 'sm11-35', l: 'fr' },
    { id: 'swsh12-186', l: 'fr' },
    { id: 'xy7-104', l: 'fr' },
    { id: 'cel25-11', l: 'en' },
    { id: 'svp-132', l: 'fr' },
    { id: 'ex11-113', l: 'en' },
    { id: 'swsh7-215', l: 'fr' },
    { id: 'ex10-117', l: 'en' },
  ],
  [
    { id: 'xy2-108', l: 'fr' },
    { id: 'hgss3-82', l: 'fr' },
    { id: 'bw1-113', l: 'fr' },
    { id: 'svp-174', l: 'fr' },
    { id: 'sv4a-088', l: 'ja' },
    { id: 'dc1-15', l: 'en' },
    { id: 'pl3-101', l: 'fr' },
    { id: 'sm12-38', l: 'fr' },
    { id: 'ex15-10', l: 'fr' },
    { id: 'dp6-141', l: 'en' },
  ],
];

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, { headers: { 'User-Agent': 'Holofoil-Mosaic-Downloader' } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchJson(res.headers.location).then(resolve, reject);
      }
      if (res.statusCode !== 200) return resolve(null);
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch { resolve(null); } });
    }).on('error', () => resolve(null));
  });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, { headers: { 'User-Agent': 'Holofoil-Mosaic-Downloader' } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, dest).then(resolve, reject);
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      const ws = fs.createWriteStream(dest);
      res.pipe(ws);
      ws.on('finish', () => { ws.close(); resolve(); });
      ws.on('error', reject);
    }).on('error', reject);
  });
}

async function fetchCardImage(id, preferLang) {
  const langs = [preferLang, 'fr', 'en', 'ja'].filter((v, i, a) => a.indexOf(v) === i);
  for (const lang of langs) {
    const data = await fetchJson(`https://api.tcgdex.net/v2/${lang}/cards/${id}`);
    if (data && data.image) return data.image + '/low.webp';
  }
  return null;
}

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  let total = 0, ok = 0, fail = 0;

  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < rows[r].length; c++) {
      const card = rows[r][c];
      const filename = `r${r}_c${c}.webp`;
      const dest = path.join(OUT_DIR, filename);
      total++;

      // Skip if already downloaded
      if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
        console.log(`[SKIP] ${filename} (already exists)`);
        ok++;
        continue;
      }

      try {
        const imgUrl = await fetchCardImage(card.id, card.l);
        if (!imgUrl) throw new Error('No image URL found');
        await downloadFile(imgUrl, dest);
        const size = fs.statSync(dest).size;
        console.log(`[OK]   ${filename} (${card.id}, ${(size / 1024).toFixed(1)}KB)`);
        ok++;
      } catch (e) {
        console.error(`[FAIL] ${filename} (${card.id}): ${e.message}`);
        fail++;
      }
    }
  }

  console.log(`\nDone: ${ok}/${total} downloaded, ${fail} failed`);
}

main();
