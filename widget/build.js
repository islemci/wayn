import * as esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function build() {
  // Ensure dist directory exists
  const distDir = path.join(__dirname, 'dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  // Build core bundle (ES module)
  await esbuild.build({
    entryPoints: ['src/core/index.ts'],
    bundle: true,
    outfile: 'dist/wayn-widget.esm.js',
    format: 'esm',
    target: 'es2020',
    platform: 'browser',
    sourcemap: true,
    define: {
      'process.env.NODE_ENV': '"production"'
    }
  });

  // Build core bundle (UMD for CDN)
  await esbuild.build({
    entryPoints: ['src/core/index.ts'],
    bundle: true,
    outfile: 'dist/wayn-widget.js',
    format: 'iife',
    globalName: 'Wayn',
    target: 'es2020',
    platform: 'browser',
    sourcemap: true,
    define: {
      'process.env.NODE_ENV': '"production"'
    }
  });

  // Build minified version for CDN
  await esbuild.build({
    entryPoints: ['src/core/index.ts'],
    bundle: true,
    outfile: 'dist/wayn-widget.min.js',
    format: 'iife',
    globalName: 'Wayn',
    target: 'es2020',
    platform: 'browser',
    minify: true,
    sourcemap: true,
    define: {
      'process.env.NODE_ENV': '"production"'
    }
  });

  // Build React wrapper
  await esbuild.build({
    entryPoints: ['src/react/index.ts'],
    bundle: true,
    outfile: 'dist/react.js',
    format: 'esm',
    target: 'es2020',
    platform: 'browser',
    external: ['react', 'react-dom'],
    sourcemap: true
  });

  console.log('✅ Build completed successfully!');
  console.log('📦 Files generated:');
  console.log('   - dist/wayn-widget.esm.js (ES module)');
  console.log('   - dist/wayn-widget.js (UMD)');
  console.log('   - dist/wayn-widget.min.js (Minified UMD)');
  console.log('   - dist/react.js (React wrapper)');
}

build().catch(err => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
