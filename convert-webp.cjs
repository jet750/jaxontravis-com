const sharp = require('sharp');
const { readdirSync } = require('fs');
const { join, extname, basename } = require('path');

const folders = [
  'src/assets/photography',
  'src/assets/bazaar-blends',
];

async function run() {
  for (const folder of folders) {
    const files = readdirSync(folder).filter(f => 
      ['.jpg', '.jpeg', '.png'].includes(extname(f).toLowerCase())
    );
    
    for (const file of files) {
      const input = join(folder, file);
      const output = join(folder, basename(file, extname(file)) + '.webp');
      await sharp(input)
        .webp({ quality: 82 })
        .toFile(output);
      console.log(`✓ ${input} → ${output}`);
    }
  }
  console.log('Done.');
}

run().catch(console.error);