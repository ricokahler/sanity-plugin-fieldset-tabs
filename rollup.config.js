import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';

const extensions = ['.js', '.ts', '.tsx'];

const config = {
  input: './sanity-plugin-fieldset-tabs/index.ts',
  output: {
    file: './dist/index.esm.js',
    format: 'es',
    sourcemap: true,
  },
  plugins: [
    resolve({ extensions, modulesOnly: true }),
    babel({
      babelrc: false,
      configFile: false,
      presets: [
        ['@babel/preset-env', { targets: 'defaults and not IE 11' }],
        '@babel/preset-typescript',
        ['@babel/preset-react', { runtime: 'automatic' }],
      ],
      plugins: [
        '@babel/plugin-transform-runtime',
        '@babel/plugin-proposal-class-properties',
        // for some reason, sanity's webpack config doesn't like spreads
        [
          '@babel/plugin-proposal-object-rest-spread',
          { loose: true, useBuiltIns: true },
        ],
      ],
      babelHelpers: 'runtime',
      extensions,
    }),
  ],
  external: [
    '@sanity/ui',
    '@sanity/icons',
    '@sanity/types',
    'part:@sanity/base/preview',
    'part:@sanity/base/schema',
    'react',
    'react-error-boundary',
    'lodash.startcase',
    'styled-components',
    'react/jsx-runtime',
    /^@sanity\/form-builder/,
    /^@babel\/runtime/,
  ],
};

export default config;
