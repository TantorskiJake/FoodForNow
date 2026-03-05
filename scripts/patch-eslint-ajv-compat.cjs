#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const patchFile = (target, replacements) => {
  if (!fs.existsSync(target)) {
    return false;
  }

  let source = fs.readFileSync(target, 'utf8');
  let changed = false;

  for (const { from, to } of replacements) {
    if (source.includes(to)) {
      continue;
    }
    if (!source.includes(from)) {
      console.error(`patch-eslint-ajv-compat: expected source pattern not found in ${target}`);
      process.exit(1);
    }
    source = source.replace(from, to);
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(target, source, 'utf8');
  }

  return changed;
};

const patchedEslintrc = patchFile(
  path.join(
    process.cwd(),
    'node_modules',
    '@eslint',
    'eslintrc',
    'dist',
    'eslintrc-universal.cjs'
  ),
  [
    {
      from: '        missingRefs: "ignore",\n        verbose: true,\n        schemaId: "auto",',
      to: '        verbose: true,\n        strict: false,'
    },
    {
      from: '    ajv._opts.defaultMeta = metaSchema.id;',
      to: '    (ajv._opts || ajv.opts || (ajv._opts = {})).defaultMeta = metaSchema.id;'
    }
  ]
);

const patchedEslintrcNode = patchFile(
  path.join(
    process.cwd(),
    'node_modules',
    '@eslint',
    'eslintrc',
    'dist',
    'eslintrc.cjs'
  ),
  [
    {
      from: '        missingRefs: "ignore",\n        verbose: true,\n        schemaId: "auto",',
      to: '        verbose: true,\n        strict: false,'
    },
    {
      from: '    ajv._opts.defaultMeta = metaSchema.id;',
      to: '    (ajv._opts || ajv.opts || (ajv._opts = {})).defaultMeta = metaSchema.id;'
    }
  ]
);

const patchedEslint = patchFile(
  path.join(process.cwd(), 'node_modules', 'eslint', 'lib', 'shared', 'ajv.js'),
  [
    {
      from:
        'const Ajv = require("ajv"),\n\tmetaSchema = require("ajv/lib/refs/json-schema-draft-04.json");',
      to:
        'const Ajv = require("ajv");\nlet metaSchema;\n\ntry {\n\tmetaSchema = require("ajv/lib/refs/json-schema-draft-04.json");\n} catch {\n\tmetaSchema = require("ajv/dist/refs/json-schema-draft-07.json");\n}'
    },
    {
      from: '\t\tmissingRefs: "ignore",\n\t\tverbose: true,\n\t\tschemaId: "auto",',
      to: '\t\tverbose: true,\n\t\tstrict: false,'
    },
    {
      from: '\tajv._opts.defaultMeta = metaSchema.id;',
      to: '\t(ajv._opts || ajv.opts || (ajv._opts = {})).defaultMeta = metaSchema.id || metaSchema.$id;'
    }
  ]
);

if (patchedEslintrc || patchedEslintrcNode || patchedEslint) {
  console.log('patch-eslint-ajv-compat: applied');
}
