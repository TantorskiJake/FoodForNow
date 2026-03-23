const test = require('node:test');
const assert = require('node:assert/strict');
const dnsPromises = require('node:dns').promises;

const {
  assertUrlAllowedForFetch,
  getAllowedUrlForFetch,
  isUrlAllowedForFetch,
} = require('./urlSafety');

test('allows a public https IPv4 URL', async () => {
  const allowed = await getAllowedUrlForFetch('https://8.8.8.8/recipe?x=1');
  assert.equal(allowed, 'https://8.8.8.8/recipe?x=1');
});

test('rejects non-https protocols', async () => {
  assert.equal(await isUrlAllowedForFetch('http://example.com/recipe'), false);
  assert.equal(await isUrlAllowedForFetch('http://8.8.8.8/recipe'), false);
  assert.equal(await getAllowedUrlForFetch('ftp://8.8.8.8/recipe'), null);
});

test('rejects blocked internal hostnames', async () => {
  assert.equal(await isUrlAllowedForFetch('https://localhost/recipe'), false);
  assert.equal(await isUrlAllowedForFetch('https://kitchen.local/recipe'), false);
  assert.equal(await isUrlAllowedForFetch('https://api.internal/recipe'), false);
});

test('rejects blocked hostnames with mixed case and trailing dots', async () => {
  assert.equal(await isUrlAllowedForFetch('https://LOCALHOST./recipe'), false);
  assert.equal(await isUrlAllowedForFetch('https://Kitchen.Local./recipe'), false);
  assert.equal(await isUrlAllowedForFetch('https://API.Internal./recipe'), false);
});

test('rejects private and metadata IPv4 targets', async () => {
  assert.equal(await getAllowedUrlForFetch('https://127.0.0.1/'), null);
  assert.equal(await getAllowedUrlForFetch('https://10.0.0.5/'), null);
  assert.equal(await getAllowedUrlForFetch('https://169.254.169.254/latest'), null);
});

test('rejects obfuscated loopback IPv4 host formats', async () => {
  assert.equal(await getAllowedUrlForFetch('https://2130706433/recipe'), null);
  assert.equal(await getAllowedUrlForFetch('https://0x7f000001/recipe'), null);
  assert.equal(await getAllowedUrlForFetch('https://0177.0.0.1/recipe'), null);
});

test('rejects IPv6 addresses mapped to blocked IPv4 ranges', async () => {
  assert.equal(await isUrlAllowedForFetch('https://[::ffff:127.0.0.1]/'), false);
});

test('direct private or mapped-private IP hosts are rejected', async () => {
  assert.equal(await isUrlAllowedForFetch('https://127.0.0.1/path'), false);
  assert.equal(await isUrlAllowedForFetch('https://[::ffff:127.0.0.1]/path'), false);
});

test('rejects hostnames when any resolved address is blocked', async (t) => {
  t.mock.method(dnsPromises, 'lookup', async () => [
    { address: '8.8.8.8' },
    { address: '10.0.0.2' },
  ]);

  assert.equal(await isUrlAllowedForFetch('https://example.com/recipe'), false);
  const allowed = await getAllowedUrlForFetch('https://example.com/recipe');
  assert.equal(allowed, null);
});

test('allows hostnames when all resolved addresses are public', async (t) => {
  t.mock.method(dnsPromises, 'lookup', async () => [
    { address: '8.8.8.8' },
    { address: '1.1.1.1' },
  ]);

  assert.equal(await isUrlAllowedForFetch('https://example.com/recipe'), true);
  const allowed = await getAllowedUrlForFetch('https://example.com/recipe');
  assert.equal(allowed, 'https://example.com/recipe');
});

test('rejects hostname when DNS lookup fails', async (t) => {
  t.mock.method(dnsPromises, 'lookup', async () => {
    throw new Error('lookup failed');
  });

  assert.equal(await isUrlAllowedForFetch('https://example.com/recipe'), false);
  const allowed = await getAllowedUrlForFetch('https://example.com/recipe');
  assert.equal(allowed, null);
});

test('rejects hostnames that resolve to blocked IPv6 ranges', async (t) => {
  t.mock.method(dnsPromises, 'lookup', async () => [
    { address: 'fe80::1' },
  ]);

  assert.equal(await isUrlAllowedForFetch('https://example.com/recipe'), false);
  assert.equal(await getAllowedUrlForFetch('https://example.com/recipe'), null);
});

test('rejects hostnames that resolve to mapped loopback IPv6 addresses', async (t) => {
  t.mock.method(dnsPromises, 'lookup', async () => [
    { address: '::ffff:7f00:1' },
  ]);

  assert.equal(await isUrlAllowedForFetch('https://example.com/recipe'), false);
  assert.equal(await getAllowedUrlForFetch('https://example.com/recipe'), null);
});

test('getAllowedUrlForFetch returns normalized URL only when allowed', async (t) => {
  t.mock.method(dnsPromises, 'lookup', async () => [
    { address: '93.184.216.34', family: 4 },
  ]);

  const allowedUrl = await getAllowedUrlForFetch('https://example.com/../recipe?q=1');
  assert.equal(allowedUrl, 'https://example.com/recipe?q=1');
});

test('assertUrlAllowedForFetch throws clear error for blocked URL', async (t) => {
  t.mock.method(dnsPromises, 'lookup', async () => [
    { address: '169.254.169.254', family: 4 },
  ]);

  await assert.rejects(
    () => assertUrlAllowedForFetch('https://metadata.example.com/latest/meta-data/'),
    /This URL is not allowed for recipe import\./
  );
});

