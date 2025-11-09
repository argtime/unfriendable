import esbuild from 'esbuild';
import fs from 'fs/promises';
import path from 'path';

const distDir = 'dist';

async function build() {
  try {
    console.log('Starting build...');

    // 1. Clean and create dist directory
    console.log(`Cleaning directory: ${distDir}`);
    await fs.rm(distDir, { recursive: true, force: true });
    await fs.mkdir(distDir);

    // 2. Build the TSX file with esbuild
    console.log('Bundling application with esbuild...');
    await esbuild.build({
      entryPoints: ['index.tsx'],
      bundle: true,
      outfile: path.join(distDir, 'bundle.js'),
      loader: { '.tsx': 'tsx' },
      format: 'esm', // This is crucial for fixing the "require" error
      external: [
        'react',
        'react-dom/*',
        'react/*',
        'react-hot-toast',
        '@supabase/supabase-js',
        'react-router-dom',
        '@heroicons/react/*',
      ],
    });
    console.log('Bundling complete.');

    // 3. Copy and modify index.html
    console.log('Processing index.html...');
    let htmlContent = await fs.readFile('index.html', 'utf-8');
    htmlContent = htmlContent.replace('src="./index.tsx"', 'src="./bundle.js"');
    await fs.writeFile(path.join(distDir, 'index.html'), htmlContent);
    console.log('index.html updated.');

    // 4. Create .nojekyll for gh-pages
    await fs.writeFile(path.join(distDir, '.nojekyll'), '');
    console.log('.nojekyll file created.');

    console.log('Build successful!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();
