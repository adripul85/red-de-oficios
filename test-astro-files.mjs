import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { transform } from '@astrojs/compiler';

function findAstroFiles(dir, files = []) {
  const items = readdirSync(dir);
  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      findAstroFiles(fullPath, files);
    } else if (item.endsWith('.astro')) {
      files.push(fullPath);
    }
  }
  return files;
}

async function testFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    await transform(content, { filename: filePath });
    return { file: filePath, status: 'OK' };
  } catch (error) {
    return { file: filePath, status: 'ERROR', error: error.message };
  }
}

async function main() {
  const files = findAstroFiles('./src');
  console.log(`Testing ${files.length} .astro files...\n`);
  
  for (const file of files) {
    const result = await testFile(file);
    if (result.status === 'ERROR') {
      console.log(`❌ ${file}`);
      console.log(`   Error: ${result.error}\n`);
    } else {
      console.log(`✅ ${file}`);
    }
  }
}

main().catch(console.error);
