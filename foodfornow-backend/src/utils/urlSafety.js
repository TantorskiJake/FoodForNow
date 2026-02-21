const dns = require('dns').promises;
const net = require('net');

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'ip6-localhost',
  'ip6-loopback',
  'ip6-localnet',
]);

const BLOCKED_HOST_SUFFIXES = ['.localhost', '.local', '.internal'];

const BLOCKED_IPV4_SINGLETONS = new Set([
  '169.254.169.254', // AWS & GCP metadata
  '169.254.169.253', // Azure metadata
  '100.100.100.200', // Alibaba metadata
]);

const BLOCKED_IPV6_SINGLETONS = new Set([
  'fd00:ec2::254', // AWS IPv6 metadata endpoint
]);

const BLOCKED_IPV4_RANGES = createIpv4Ranges([
  ['0.0.0.0', '0.255.255.255'],
  ['10.0.0.0', '10.255.255.255'],
  ['100.64.0.0', '100.127.255.255'],
  ['127.0.0.0', '127.255.255.255'],
  ['169.254.0.0', '169.254.255.255'],
  ['172.16.0.0', '172.31.255.255'],
  ['192.168.0.0', '192.168.255.255'],
  ['198.18.0.0', '198.19.255.255'],
  ['224.0.0.0', '239.255.255.255'],
  ['240.0.0.0', '255.255.255.255'],
]);

const MAX_IPV6 = (1n << 128n) - 1n;

const BLOCKED_IPV6_RANGES = createIpv6Ranges([
  '::/128', // unspecified
  '::1/128', // loopback
  'fc00::/7', // unique local
  'fe80::/10', // link-local
  'fec0::/10', // site-local (deprecated but often routed internally)
]);

function stripZoneIndex(value) {
  if (!value) return '';
  const percentIndex = value.indexOf('%');
  return percentIndex >= 0 ? value.slice(0, percentIndex) : value;
}

function ipv4ToInt(ip) {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  let result = 0;
  for (const part of parts) {
    const octet = Number(part);
    if (!Number.isInteger(octet) || octet < 0 || octet > 255) {
      return null;
    }
    result = (result << 8) | octet;
    result >>>= 0;
  }
  return result >>> 0;
}

function createIpv4Ranges(ranges) {
  return ranges
    .map(([start, end]) => {
      const startInt = ipv4ToInt(start);
      const endInt = ipv4ToInt(end);
      if (startInt == null || endInt == null) return null;
      return {
        start: Math.min(startInt, endInt),
        end: Math.max(startInt, endInt),
      };
    })
    .filter(Boolean);
}

function createIpv6Ranges(cidrs) {
  return cidrs
    .map((cidr) => {
      const [base, prefixStr] = cidr.split('/');
      const prefix = Number(prefixStr);
      if (!base || Number.isNaN(prefix) || prefix < 0 || prefix > 128) {
        return null;
      }
      const baseInt = ipv6ToBigInt(base);
      if (baseInt == null) return null;

      if (prefix === 0) {
        return { start: 0n, end: MAX_IPV6 };
      }

      const hostBits = 128n - BigInt(prefix);
      const mask = MAX_IPV6 ^ ((1n << hostBits) - 1n);
      const start = baseInt & mask;
      const end = start | ((1n << hostBits) - 1n);
      return { start, end };
    })
    .filter(Boolean);
}

function expandEmbeddedIpv4(ip) {
  const lastColon = ip.lastIndexOf(':');
  if (lastColon === -1) return null;
  const prefix = ip.slice(0, lastColon);
  const ipv4Part = ip.slice(lastColon + 1);
  if (!net.isIPv4(ipv4Part)) return null;
  const octets = ipv4Part.split('.').map((part) => Number(part));
  if (octets.length !== 4 || octets.some((octet) => octet < 0 || octet > 255 || Number.isNaN(octet))) {
    return null;
  }
  const high = ((octets[0] << 8) | octets[1]).toString(16);
  const low = ((octets[2] << 8) | octets[3]).toString(16);
  return `${prefix}:${high}:${low}`;
}

function normalizeIpv6(address) {
  if (!address) return null;
  let ip = stripZoneIndex(address).toLowerCase();
  if (!ip) return null;

  if (ip.includes('.')) {
    ip = expandEmbeddedIpv4(ip);
    if (!ip) return null;
  }

  if (ip === '::') {
    return Array(8).fill('0');
  }

  const parts = ip.split('::');
  if (parts.length > 2) return null;

  const head = parts[0] ? parts[0].split(':').filter(Boolean) : [];
  const tail = parts[1] ? parts[1].split(':').filter(Boolean) : [];

  if (parts.length === 1) {
    if (head.length !== 8) return null;
    return head;
  }

  const missing = 8 - (head.length + tail.length);
  if (missing < 0) return null;

  return [...head, ...Array(missing).fill('0'), ...tail];
}

function ipv6ToBigInt(ip) {
  const segments = normalizeIpv6(ip);
  if (!segments || segments.length !== 8) return null;
  return segments.reduce((acc, segment) => {
    const value = parseInt(segment, 16);
    if (Number.isNaN(value) || value < 0) {
      throw new Error(`Invalid IPv6 segment: ${segment}`);
    }
    return (acc << 16n) + BigInt(value);
  }, 0n);
}

function ipv6RangeContains(ipInt, range) {
  return ipInt >= range.start && ipInt <= range.end;
}

function isHostnameBlocked(hostname) {
  if (!hostname) return true;
  let lower = hostname.toLowerCase();
  while (lower.endsWith('.')) {
    lower = lower.slice(0, -1);
  }
  if (!lower) return true;
  if (BLOCKED_HOSTNAMES.has(lower)) return true;
  if (BLOCKED_HOST_SUFFIXES.some((suffix) => lower.endsWith(suffix))) return true;
  return false;
}

function isBlockedIpv4(address) {
  if (BLOCKED_IPV4_SINGLETONS.has(address)) return true;
  const value = ipv4ToInt(address);
  if (value == null) return true;
  return BLOCKED_IPV4_RANGES.some((range) => value >= range.start && value <= range.end);
}

function isBlockedIpv6(address) {
  if (BLOCKED_IPV6_SINGLETONS.has(address.toLowerCase())) return true;
  const mappedIpv4 = extractMappedIpv4(address);
  if (mappedIpv4) {
    return isBlockedIpv4(mappedIpv4);
  }
  const value = ipv6ToBigInt(address);
  if (value == null) return true;
  return BLOCKED_IPV6_RANGES.some((range) => ipv6RangeContains(value, range));
}

function extractMappedIpv4(address) {
  const sanitized = stripZoneIndex(address);
  if (!sanitized) return null;
  if (sanitized.includes('.')) {
    const ipv4Part = sanitized.slice(sanitized.lastIndexOf(':') + 1);
    return net.isIPv4(ipv4Part) ? ipv4Part : null;
  }
  const normalized = normalizeIpv6(sanitized);
  if (!normalized) return null;
  const isMapped =
    normalized.length === 8 &&
    normalized.slice(0, 5).every((segment) => segment === '0') &&
    normalized[5] === 'ffff';
  if (!isMapped) return null;

  const high = parseInt(normalized[6], 16);
  const low = parseInt(normalized[7], 16);
  if ([high, low].some((value) => Number.isNaN(value) || value < 0 || value > 0xffff)) {
    return null;
  }

  const octets = [
    (high >> 8) & 0xff,
    high & 0xff,
    (low >> 8) & 0xff,
    low & 0xff,
  ];
  if (octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
    return null;
  }
  return octets.join('.');
}

function isIpBlocked(address) {
  const sanitized = stripZoneIndex(address);
  if (!sanitized) return true;
  if (net.isIPv4(sanitized)) {
    return isBlockedIpv4(sanitized);
  }
  if (net.isIPv6(sanitized)) {
    return isBlockedIpv6(sanitized);
  }
  return true;
}

async function resolveHostAddresses(hostname) {
  if (net.isIP(hostname)) {
    return [hostname];
  }
  if (isHostnameBlocked(hostname)) {
    return [];
  }
  try {
    const records = await dns.lookup(hostname, { all: true });
    return records.map((record) => record.address).filter(Boolean);
  } catch {
    return [];
  }
}

async function isUrlAllowedForFetch(urlString) {
  try {
    const url = new URL(urlString);
    if (!['http:', 'https:'].includes(url.protocol)) {
      return false;
    }
    const hostname = url.hostname;
    if (!hostname || isHostnameBlocked(hostname)) {
      return false;
    }
    const addresses = await resolveHostAddresses(hostname);
    if (!addresses.length) {
      return false;
    }
    return addresses.every((address) => !isIpBlocked(address));
  } catch {
    return false;
  }
}

async function assertUrlAllowedForFetch(urlString) {
  const allowed = await isUrlAllowedForFetch(urlString);
  if (!allowed) {
    throw new Error('This URL is not allowed for recipe import.');
  }
}

module.exports = {
  assertUrlAllowedForFetch,
  isUrlAllowedForFetch,
};
