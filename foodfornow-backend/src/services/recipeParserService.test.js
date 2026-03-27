const test = require('node:test');
const assert = require('node:assert/strict');
const axios = require('axios');

const SERVICE_MODULE_PATH = require.resolve('./recipeParserService');

const RECIPE_HTML = `
  <html>
    <head>
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Recipe",
          "name": "Token Import Recipe",
          "description": "Recipe from tokenized URL import.",
          "recipeIngredient": ["1 cup rice", "2 cups water"],
          "recipeInstructions": ["Rinse rice", "Cook covered until tender"],
          "prepTime": "PT10M",
          "cookTime": "PT20M",
          "totalTime": "PT30M",
          "recipeYield": "Serves 2"
        }
      </script>
    </head>
    <body></body>
  </html>
`;

function okHtmlResponse(data = RECIPE_HTML) {
  return {
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {},
    data,
  };
}

function setOrUnsetEnv(name, value) {
  if (value == null) {
    delete process.env[name];
    return;
  }
  process.env[name] = value;
}

function loadServiceWithEnv({ proxyUrl, proxyRequired }) {
  const prevProxyUrl = process.env.RECIPE_FETCH_PROXY_URL;
  const prevProxyRequired = process.env.RECIPE_FETCH_PROXY_REQUIRED;

  setOrUnsetEnv('RECIPE_FETCH_PROXY_URL', proxyUrl);
  setOrUnsetEnv('RECIPE_FETCH_PROXY_REQUIRED', proxyRequired);
  delete require.cache[SERVICE_MODULE_PATH];
  const service = require('./recipeParserService');

  return {
    service,
    restoreEnv() {
      setOrUnsetEnv('RECIPE_FETCH_PROXY_URL', prevProxyUrl);
      setOrUnsetEnv('RECIPE_FETCH_PROXY_REQUIRED', prevProxyRequired);
      delete require.cache[SERVICE_MODULE_PATH];
    },
  };
}

test('parseRecipeFromUrlByToken consumes token and rejects reuse', async () => {
  const originalAxiosGet = axios.get;
  const { service, restoreEnv } = loadServiceWithEnv({
    proxyUrl: undefined,
    proxyRequired: undefined,
  });

  let axiosCalls = 0;
  axios.get = async () => {
    axiosCalls += 1;
    return okHtmlResponse();
  };

  try {
    const token = service.storeValidatedUrlForFetch('https://example.com/recipe');
    const parsed = await service.parseRecipeFromUrlByToken(token);
    assert.equal(parsed.name, 'Token Import Recipe');
    assert.equal(parsed.prepTime, 10);
    assert.equal(parsed.cookTime, 20);
    assert.equal(parsed.totalTime, 30);
    assert.equal(parsed.servings, 2);
    assert.deepEqual(parsed.ingredients, ['1 cup rice', '2 cups water']);
    assert.equal(axiosCalls, 1);

    await assert.rejects(
      () => service.parseRecipeFromUrlByToken(token),
      /Invalid or expired fetch token\./
    );
  } finally {
    axios.get = originalAxiosGet;
    restoreEnv();
  }
});

test('parseRecipeFromUrlByToken uses configured proxy URL and source headers', async () => {
  const originalAxiosGet = axios.get;
  const { service, restoreEnv } = loadServiceWithEnv({
    proxyUrl: 'https://proxy.example/import?target={{URL}}',
    proxyRequired: undefined,
  });

  const validatedUrl = 'https://example.com/recipe?foo=bar&x=1';
  let capturedUrl = null;
  let capturedHeaders = null;
  axios.get = async (url, opts = {}) => {
    capturedUrl = url;
    capturedHeaders = opts.headers || {};
    return okHtmlResponse();
  };

  try {
    const token = service.storeValidatedUrlForFetch(validatedUrl);
    const parsed = await service.parseRecipeFromUrlByToken(token);

    assert.equal(parsed.name, 'Token Import Recipe');
    assert.equal(
      capturedUrl,
      `https://proxy.example/import?target=${encodeURIComponent(validatedUrl)}`
    );
    assert.equal(capturedHeaders['X-Recipe-Source-Url'], validatedUrl);
    assert.equal(capturedHeaders['X-Recipe-Source-Host'], 'example.com');
  } finally {
    axios.get = originalAxiosGet;
    restoreEnv();
  }
});

test('parseRecipeFromUrlByToken appends validated URL when proxy template has no placeholder', async () => {
  const originalAxiosGet = axios.get;
  const { service, restoreEnv } = loadServiceWithEnv({
    proxyUrl: 'https://proxy.example/import',
    proxyRequired: undefined,
  });

  const validatedUrl = 'https://example.com/recipe?foo=bar&x=1';
  let capturedUrl = null;
  axios.get = async (url) => {
    capturedUrl = url;
    return okHtmlResponse();
  };

  try {
    const token = service.storeValidatedUrlForFetch(validatedUrl);
    const parsed = await service.parseRecipeFromUrlByToken(token);

    assert.equal(parsed.name, 'Token Import Recipe');
    assert.ok(capturedUrl);
    const parsedProxyUrl = new URL(capturedUrl);
    assert.equal(parsedProxyUrl.origin, 'https://proxy.example');
    assert.equal(parsedProxyUrl.pathname, '/import');
    assert.equal(parsedProxyUrl.searchParams.get('url'), validatedUrl);
  } finally {
    axios.get = originalAxiosGet;
    restoreEnv();
  }
});

test('parseRecipeFromUrlByToken rejects when proxy is required but not configured', async () => {
  const originalAxiosGet = axios.get;
  const { service, restoreEnv } = loadServiceWithEnv({
    proxyUrl: undefined,
    proxyRequired: 'true',
  });

  let axiosCalls = 0;
  axios.get = async () => {
    axiosCalls += 1;
    return okHtmlResponse();
  };

  try {
    const token = service.storeValidatedUrlForFetch('https://example.com/recipe');
    await assert.rejects(
      () => service.parseRecipeFromUrlByToken(token),
      /proxy is required/i
    );
    assert.equal(axiosCalls, 0);
  } finally {
    axios.get = originalAxiosGet;
    restoreEnv();
  }
});

test('parseRecipeFromUrlByToken rejects when required proxy URL is invalid', async () => {
  const originalAxiosGet = axios.get;
  const { service, restoreEnv } = loadServiceWithEnv({
    proxyUrl: 'not-a-valid-url',
    proxyRequired: 'true',
  });

  let axiosCalls = 0;
  axios.get = async () => {
    axiosCalls += 1;
    return okHtmlResponse();
  };

  try {
    const token = service.storeValidatedUrlForFetch('https://example.com/recipe');
    await assert.rejects(
      () => service.parseRecipeFromUrlByToken(token),
      /proxy is required/i
    );
    assert.equal(axiosCalls, 0);
  } finally {
    axios.get = originalAxiosGet;
    restoreEnv();
  }
});

test('parseRecipeFromUrlByToken rejects unknown token', async () => {
  const { service, restoreEnv } = loadServiceWithEnv({
    proxyUrl: undefined,
    proxyRequired: undefined,
  });

  try {
    await assert.rejects(
      () => service.parseRecipeFromUrlByToken('missing-token'),
      /Invalid or expired fetch token\./
    );
  } finally {
    restoreEnv();
  }
});

test('parseRecipeFromUrlByToken blocks redirects to disallowed hosts', async () => {
  const originalAxiosGet = axios.get;
  const { service, restoreEnv } = loadServiceWithEnv({
    proxyUrl: undefined,
    proxyRequired: undefined,
  });

  const calls = [];
  axios.get = async (url, opts = {}) => {
    calls.push({ url, opts });
    return {
      status: 302,
      headers: { location: 'http://169.254.169.254/latest/meta-data/' },
      data: '',
      config: { url, ...opts },
    };
  };

  try {
    const token = service.storeValidatedUrlForFetch('https://example.com/redirect');
    await assert.rejects(
      () => service.parseRecipeFromUrlByToken(token),
      /Redirect target URL is not allowed for recipe import\./
    );
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, 'https://example.com/redirect');
    assert.equal(calls[0].opts.maxRedirects, 0);
  } finally {
    axios.get = originalAxiosGet;
    restoreEnv();
  }
});
