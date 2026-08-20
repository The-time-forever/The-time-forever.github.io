import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// Load picomatch's CommonJS entry point from Astro's ESM content-config runner.
export default require('picomatch');
