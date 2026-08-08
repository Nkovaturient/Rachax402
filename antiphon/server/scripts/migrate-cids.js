/**
 * Re-pin CIDs from legacy Storacha/w3s gateway to Pinata (free JWT).
 *
 * Usage:
 *   node scripts/migrate-cids.js cid1 cid2 ...
 *   node scripts/migrate-cids.js --file=cids.txt
 *
 * Env: PINATA_JWT, PINATA_GATEWAY
 */

import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { uploadFileToPinata } from '../initPinata.js';

dotenv.config();

const LEGACY_GATEWAY = 'https://w3s.link/ipfs';

async function migrateCid(cid) {
  const sourceUrl = `${LEGACY_GATEWAY}/${cid}`;
  console.log(`\n📥 Fetching ${sourceUrl}`);
  const res = await fetch(sourceUrl);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${cid}: ${res.status}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get('content-type') || 'application/octet-stream';
  const ext = contentType.includes('json') ? 'json' : 'bin';

  const result = await uploadFileToPinata({
    name: `migrated-${cid.slice(0, 12)}.${ext}`,
    type: contentType,
    size: buffer.length,
    buffer,
  });

  console.log(`✅ ${cid} → ${result.cid}`);
  console.log(`   ${result.url}`);
  return { oldCid: cid, newCid: result.cid, url: result.url };
}

async function main() {
  const args = process.argv.slice(2);
  let cids = args.filter((a) => !a.startsWith('--'));

  const fileArg = args.find((a) => a.startsWith('--file='));
  if (fileArg) {
    const path = fileArg.split('=')[1];
    cids = readFileSync(path, 'utf8')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
  }

  if (cids.length === 0) {
    console.error('Usage: node scripts/migrate-cids.js <cid> [cid2 ...]');
    console.error('       node scripts/migrate-cids.js --file=cids.txt');
    process.exit(1);
  }

  const results = [];
  for (const cid of cids) {
    try {
      results.push(await migrateCid(cid));
    } catch (err) {
      console.error(`❌ ${cid}: ${err.message}`);
    }
  }

  console.log('\n═'.repeat(40));
  console.log(JSON.stringify(results, null, 2));
}

main();
