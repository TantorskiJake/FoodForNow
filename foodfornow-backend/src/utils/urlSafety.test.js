const test = require('node:test');
const assert = require('node:assert/strict');
const dnsPromises = require('node:dns').promises;
const {
  getAllowedUrlForFetch,
  isUrlAllowedForFetch,
} = require('./urlSafety');

test('allows a public https IPv4 URL', async () => {
  const allowed = await getAllowedUrlForFetch('https://8.8.8.8/recipe?x=1');
  assert.equal(allowed, 'https://8.8.8.8/recipe?x=1');
});

test('rejects non-https protocols', async () => {
  assert.equal(await isUrlAllowedForFetch('http://8.8.8.8/recipe'), false);
  assert.equal(await getAllowedUrlForFetch('ftp://8.8.8.8/recipe'), null);
});

test('rejects blocked internal hostnames', async () => {
  assert.equal(await isUrlAllowedForFetch('https://localhost/recipe'), false);
  assert.equal(await isUrlAllowedForFetch('https://kitchen.local/recipe'), false);
});

test('rejects private and metadata IPv4 targets', async () => {
  assert.equal(await getAllowedUrlForFetch('https://127.0.0.1/'), null);
  assert.equal(await getAllowedUrlForFetch('https://10.0.0.5/'), null);
  assert.equal(await getAllowedUrlForFetch('https://169.254.169.254/latest'), null);
});

test('rejects IPv6 addresses mapped to blocked IPv4 ranges', async () => {
  assert.equal(await isUrlAllowedForFetch('https://[::ffff:127.0.0.1]/'), false);
});

test('rejects hostnames when any resolved address is blocked', async (t) => {
  t.mock.method(dnsPromises, 'lookup', async () => [
    { address: '8.8.8.8' },
    { address: '10.0.0.2' },
  ]);

  const allowed = await getAllowedUrlForFetch('https://example.com/recipe');
  assert.equal(allowed, null);
});

test('allows hostnames when all resolved addresses are public', async (t) => {
  t.mock.method(dnsPromises, 'lookup', async () => [
    { address: '8.8.8.8' },
    { address: '1.1.1.1' },
  ]);

  const allowed = await getAllowedUrlForFetch('https://example.com/recipe');
  assert.equal(allowed, 'https://example.com/recipe');
});

test('rejects hostname when DNS lookup fails', async (t) => {
  t.mock.method(dnsPromises, 'lookup', async () => {
    throw new Error('lookup failed');
  });

  assert.equal(await isUrlAllowedForFetch('https://example.com/recipe'), false);
});
