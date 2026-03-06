import test from 'node:test';
import assert from 'node:assert/strict';
import api, { __internal } from './api.js';

test('ensureCsrfToken retries after initial fetch failure', async () => {
  __internal.resetCsrfTokenState();
  const originalGet = api.get.bind(api);
  let calls = 0;

  api.get = async (url) => {
    if (url === '/csrf-token') {
      calls += 1;
      if (calls === 1) {
        throw new Error('temporary upstream failure');
      }
      return { data: { csrfToken: 'token-after-retry' } };
    }
    return originalGet(url);
  };

  try {
    await assert.rejects(__internal.ensureCsrfToken());
    const token = await __internal.ensureCsrfToken();
    assert.equal(token, 'token-after-retry');
    assert.equal(calls, 2);
  } finally {
    api.get = originalGet;
    __internal.resetCsrfTokenState();
  }
});

test('ensureCsrfToken memoizes successful token fetches', async () => {
  __internal.resetCsrfTokenState();
  const originalGet = api.get.bind(api);
  let calls = 0;

  api.get = async (url) => {
    if (url === '/csrf-token') {
      calls += 1;
      return { data: { csrfToken: 'cached-token' } };
    }
    return originalGet(url);
  };

  try {
    const first = await __internal.ensureCsrfToken();
    const second = await __internal.ensureCsrfToken();
    assert.equal(first, 'cached-token');
    assert.equal(second, 'cached-token');
    assert.equal(calls, 1);
  } finally {
    api.get = originalGet;
    __internal.resetCsrfTokenState();
  }
});
