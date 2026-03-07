const test = require('node:test');
const assert = require('node:assert/strict');
const dnsPromises = require('node:dns').promises;

const {
  isUrlAllowedForFetch,
  getAllowedUrlForFetch,
  assertUrlAllowedForFetch,
} = require('./urlSafety');

async function withLookupMock(lookupImpl, run) {
  const originalLookup = dnsPromises.lookup;
  dnsPromises.lookup = lookupImpl;
  try {
    await run();
  } finally {
    dnsPromises.lookup = originalLookup;
  }
}

test('isUrlAllowedForFetch rejects non-https URLs', async () => {
  const allowed = await isUrlAllowedForFetch('http://example.com/recipe');
  assert.equal(allowed, false);
});

test('isUrlAllowedForFetch rejects blocked hostnames', async () => {
  assert.equal(await isUrlAllowedForFetch('https://localhost/recipe'), false);
  assert.equal(await isUrlAllowedForFetch('https://api.internal/recipe'), false);
});

test('isUrlAllowedForFetch allows public host with public DNS addresses', async () => {
  await withLookupMock(async () => [{ address: '93.184.216.34', family: 4 }], async () => {
    const allowed = await isUrlAllowedForFetch('https://example.com/recipe');
    assert.equal(allowed, true);
  });
});

test('isUrlAllowedForFetch rejects host when any resolved address is private', async () => {
  await withLookupMock(
    async () => [
      { address: '93.184.216.34', family: 4 },
      { address: '10.0.0.10', family: 4 },
    ],
    async () => {
      const allowed = await isUrlAllowedForFetch('https://example.com/recipe');
      assert.equal(allowed, false);
    }
  );
});

test('getAllowedUrlForFetch returns normalized URL only when allowed', async () => {
  await withLookupMock(async () => [{ address: '93.184.216.34', family: 4 }], async () => {
    const allowedUrl = await getAllowedUrlForFetch('https://example.com/../recipe?q=1');
    assert.equal(allowedUrl, 'https://example.com/recipe?q=1');
  });
});

test('direct private or mapped-private IP hosts are rejected', async () => {
  assert.equal(await isUrlAllowedForFetch('https://127.0.0.1/path'), false);
  assert.equal(await isUrlAllowedForFetch('https://[::ffff:127.0.0.1]/path'), false);
});

test('assertUrlAllowedForFetch throws clear error for blocked URL', async () => {
  await withLookupMock(async () => [{ address: '169.254.169.254', family: 4 }], async () => {
    await assert.rejects(
      () => assertUrlAllowedForFetch('https://metadata.example.com/latest/meta-data/'),
      /This URL is not allowed for recipe import\./
    );
  });
});
