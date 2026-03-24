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

test('queued 401 requests are retried after one successful refresh', async () => {
  __internal.resetCsrfTokenState();
  __internal.resetRefreshState();
  const originalAdapter = api.defaults.adapter;
  let refreshCalls = 0;

  api.defaults.adapter = async (config) => {
    if (config.url === '/auth/token') {
      refreshCalls += 1;
      return axiosResponse(config, { ok: true });
    }
    if (config.url === '/a' || config.url === '/b') {
      if (config._retry) {
        return axiosResponse(config, { url: config.url, retried: true });
      }
      return Promise.reject({ config, response: { status: 401 } });
    }
    return Promise.reject({ config, response: { status: 500 } });
  };

  try {
    const settled = await Promise.race([
      Promise.all([api.get('/a'), api.get('/b')]),
      new Promise((resolve) => setTimeout(() => resolve('timeout'), 300)),
    ]);
    assert.notEqual(settled, 'timeout');
    assert.equal(refreshCalls, 1);
    assert.deepEqual(
      settled.map((res) => res.data),
      [
        { url: '/a', retried: true },
        { url: '/b', retried: true },
      ]
    );
  } finally {
    api.defaults.adapter = originalAdapter;
    __internal.resetCsrfTokenState();
    __internal.resetRefreshState();
  }
});

test('401 from refresh endpoint is not retried recursively', async () => {
  __internal.resetCsrfTokenState();
  __internal.resetRefreshState();
  const originalAdapter = api.defaults.adapter;
  let refreshCalls = 0;

  api.defaults.adapter = async (config) => {
    if (config.url === '/auth/token') {
      refreshCalls += 1;
      return Promise.reject({ config, response: { status: 401 } });
    }
    return Promise.reject({ config, response: { status: 500 } });
  };

  try {
    await assert.rejects(() => api.get('/auth/token'));
    assert.equal(refreshCalls, 1);
  } finally {
    api.defaults.adapter = originalAdapter;
    __internal.resetCsrfTokenState();
    __internal.resetRefreshState();
  }
});

test('requests marked with _skipAuthRefresh reject without refresh attempt', async () => {
  __internal.resetCsrfTokenState();
  __internal.resetRefreshState();
  const originalAdapter = api.defaults.adapter;
  let refreshCalls = 0;
  let protectedCalls = 0;

  api.defaults.adapter = async (config) => {
    if (config.url === '/auth/token') {
      refreshCalls += 1;
      return axiosResponse(config, { ok: true });
    }
    if (config.url === '/protected') {
      protectedCalls += 1;
      return Promise.reject({ config, response: { status: 401 } });
    }
    return Promise.reject({ config, response: { status: 500 } });
  };

  try {
    await assert.rejects(() => api.get('/protected', { _skipAuthRefresh: true }));
    assert.equal(protectedCalls, 1);
    assert.equal(refreshCalls, 0);
  } finally {
    api.defaults.adapter = originalAdapter;
    __internal.resetCsrfTokenState();
    __internal.resetRefreshState();
  }
});

test('cachedGet coalesces concurrent requests for the same cache key', async () => {
  api.clearCache();
  const originalGet = api.get.bind(api);
  let calls = 0;

  api.get = async (url, config) => {
    calls += 1;
    return new Promise((resolve) => {
      setTimeout(() => resolve({ data: { url, params: config?.params ?? null, call: calls } }), 20);
    });
  };

  try {
    const [first, second] = await Promise.all([
      api.cachedGet('/recipes', { params: { q: 'soup' } }),
      api.cachedGet('/recipes', { params: { q: 'soup' } }),
    ]);
    const third = await api.cachedGet('/recipes', { params: { q: 'soup' } });

    assert.equal(calls, 1);
    assert.deepEqual(first.data, { url: '/recipes', params: { q: 'soup' }, call: 1 });
    assert.deepEqual(second.data, { url: '/recipes', params: { q: 'soup' }, call: 1 });
    assert.deepEqual(third.data, { url: '/recipes', params: { q: 'soup' }, call: 1 });
  } finally {
    api.get = originalGet;
    api.clearCache();
  }
});

test('cachedGet scopes cache entries by request params', async () => {
  api.clearCache();
  const originalGet = api.get.bind(api);
  let calls = 0;

  api.get = async (url, config) => {
    calls += 1;
    return { data: { url, params: config?.params ?? null, call: calls } };
  };

  try {
    const produce = await api.cachedGet('/ingredients', { params: { category: 'produce' } });
    const spices = await api.cachedGet('/ingredients', { params: { category: 'spices' } });
    const produceAgain = await api.cachedGet('/ingredients', { params: { category: 'produce' } });

    assert.equal(calls, 2);
    assert.deepEqual(produce.data, { url: '/ingredients', params: { category: 'produce' }, call: 1 });
    assert.deepEqual(spices.data, { url: '/ingredients', params: { category: 'spices' }, call: 2 });
    assert.deepEqual(produceAgain.data, { url: '/ingredients', params: { category: 'produce' }, call: 1 });
  } finally {
    api.get = originalGet;
    api.clearCache();
  }
});

test('cachedGet forceRefresh bypasses cache and updates cached response', async () => {
  api.clearCache();
  const originalGet = api.get.bind(api);
  let calls = 0;

  api.get = async (url, config) => {
    calls += 1;
    return { data: { url, params: config?.params ?? null, call: calls } };
  };

  try {
    const first = await api.cachedGet('/shopping-list', { params: { week: '2026-03-23' } });
    const refreshed = await api.cachedGet('/shopping-list', {
      params: { week: '2026-03-23' },
      forceRefresh: true,
    });
    const afterRefresh = await api.cachedGet('/shopping-list', { params: { week: '2026-03-23' } });

    assert.equal(calls, 2);
    assert.deepEqual(first.data, { url: '/shopping-list', params: { week: '2026-03-23' }, call: 1 });
    assert.deepEqual(refreshed.data, { url: '/shopping-list', params: { week: '2026-03-23' }, call: 2 });
    assert.deepEqual(afterRefresh.data, { url: '/shopping-list', params: { week: '2026-03-23' }, call: 2 });
  } finally {
    api.get = originalGet;
    api.clearCache();
  }
});

test('invalidateCache clears only matching cached entries', async () => {
  api.clearCache();
  const originalGet = api.get.bind(api);
  let calls = 0;

  api.get = async (url, config) => {
    calls += 1;
    return { data: { url, params: config?.params ?? null, call: calls } };
  };

  try {
    await api.cachedGet('/recipes', { params: { q: 'pasta' } });
    await api.cachedGet('/ingredients', { params: { q: 'pasta' } });

    api.invalidateCache((key) => key.includes('/recipes'));

    const recipesAgain = await api.cachedGet('/recipes', { params: { q: 'pasta' } });
    const ingredientsAgain = await api.cachedGet('/ingredients', { params: { q: 'pasta' } });

    assert.equal(calls, 3);
    assert.deepEqual(recipesAgain.data, { url: '/recipes', params: { q: 'pasta' }, call: 3 });
    assert.deepEqual(ingredientsAgain.data, { url: '/ingredients', params: { q: 'pasta' }, call: 2 });
  } finally {
    api.get = originalGet;
    api.clearCache();
  }
});
