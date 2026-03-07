import test from 'node:test';
import assert from 'node:assert/strict';
import api, { __internal } from './api.js';

function makeHttpError(message, config, status) {
  const err = new Error(message);
  err.config = config;
  err.response = { status, data: {} };
  return err;
}

test('ensureCsrfToken retries after initial fetch failure', async () => {
  __internal.resetCsrfTokenState();
  __internal.resetRefreshState();
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
    __internal.resetRefreshState();
  }
});

test('ensureCsrfToken memoizes successful token fetches', async () => {
  __internal.resetCsrfTokenState();
  __internal.resetRefreshState();
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
    __internal.resetRefreshState();
  }
});

test('failed refresh rejects original 401 request without hanging', async () => {
  __internal.resetCsrfTokenState();
  __internal.resetRefreshState();
  const originalAdapter = api.defaults.adapter;

  api.defaults.adapter = async (config) => {
    if (config.url === '/csrf-token') {
      return { status: 200, statusText: 'OK', headers: {}, config, data: { csrfToken: 'csrf-token-value' } };
    }
    if (config.url === '/auth/token') {
      throw makeHttpError('refresh denied', config, 401);
    }
    throw makeHttpError('protected denied', config, 401);
  };

  try {
    const result = await Promise.race([
      api.get('/recipes').then(() => 'resolved').catch((err) => `rejected:${err.message}`),
      new Promise((resolve) => setTimeout(() => resolve('timeout'), 250)),
    ]);
    assert.notEqual(result, 'timeout');
    assert.match(result, /^rejected:/);
  } finally {
    api.defaults.adapter = originalAdapter;
    __internal.resetCsrfTokenState();
    __internal.resetRefreshState();
  }
});

test('failed refresh rejects queued 401 requests', async () => {
  __internal.resetCsrfTokenState();
  __internal.resetRefreshState();
  const originalAdapter = api.defaults.adapter;

  api.defaults.adapter = async (config) => {
    if (config.url === '/csrf-token') {
      return { status: 200, statusText: 'OK', headers: {}, config, data: { csrfToken: 'csrf-token-value' } };
    }
    if (config.url === '/auth/token') {
      throw makeHttpError('refresh denied', config, 401);
    }
    throw makeHttpError('protected denied', config, 401);
  };

  try {
    const settled = await Promise.race([
      Promise.allSettled([api.get('/recipes'), api.get('/ingredients')]),
      new Promise((resolve) => setTimeout(() => resolve('timeout'), 300)),
    ]);
    assert.notEqual(settled, 'timeout');
    assert.equal(settled.length, 2);
    assert.equal(settled[0].status, 'rejected');
    assert.equal(settled[1].status, 'rejected');
  } finally {
    api.defaults.adapter = originalAdapter;
    __internal.resetCsrfTokenState();
    __internal.resetRefreshState();
  }
});
