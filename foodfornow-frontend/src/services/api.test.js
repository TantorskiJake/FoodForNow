import test from 'node:test';
import assert from 'node:assert/strict';
import api, { __internal } from './api.js';

const axiosResponse = (config, data = {}) => ({
  data,
  status: 200,
  statusText: 'OK',
  headers: {},
  config,
});

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

test('failed refresh token request rejects instead of hanging', async () => {
  __internal.resetCsrfTokenState();
  __internal.resetRefreshState();
  const originalAdapter = api.defaults.adapter;

  api.defaults.adapter = async (config) => {
    if (config.url === '/csrf-token') {
      return axiosResponse(config, { csrfToken: 'csrf-token' });
    }
    if (config.url === '/auth/token') {
      return Promise.reject({ config, response: { status: 401 } });
    }
    if (config.url === '/protected') {
      return Promise.reject({ config, response: { status: 401 } });
    }
    return Promise.reject({ config, response: { status: 500 } });
  };

  try {
    const settled = await Promise.race([
      api.get('/protected').then(() => 'resolved').catch(() => 'rejected'),
      new Promise((resolve) => setTimeout(() => resolve('timeout'), 200)),
    ]);
    assert.equal(settled, 'rejected');
  } finally {
    api.defaults.adapter = originalAdapter;
    __internal.resetCsrfTokenState();
    __internal.resetRefreshState();
  }
});

test('queued 401 requests are rejected when refresh fails', async () => {
  __internal.resetCsrfTokenState();
  __internal.resetRefreshState();
  const originalAdapter = api.defaults.adapter;

  api.defaults.adapter = async (config) => {
    if (config.url === '/csrf-token') {
      return axiosResponse(config, { csrfToken: 'csrf-token' });
    }
    if (config.url === '/auth/token') {
      return new Promise((_, reject) => {
        setTimeout(() => reject({ config, response: { status: 401 } }), 25);
      });
    }
    if (config.url === '/a' || config.url === '/b') {
      return Promise.reject({ config, response: { status: 401 } });
    }
    return Promise.reject({ config, response: { status: 500 } });
  };

  try {
    const settled = await Promise.race([
      Promise.all([
        api.get('/a').then(() => 'resolved').catch(() => 'rejected'),
        api.get('/b').then(() => 'resolved').catch(() => 'rejected'),
      ]),
      new Promise((resolve) => setTimeout(() => resolve(['timeout', 'timeout']), 300)),
    ]);
    assert.deepEqual(settled, ['rejected', 'rejected']);
  } finally {
    api.defaults.adapter = originalAdapter;
    __internal.resetCsrfTokenState();
    __internal.resetRefreshState();
  }
});
