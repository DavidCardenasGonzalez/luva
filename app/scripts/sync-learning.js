// Copies seed/learning_items.json into app/src/data/learning_items.json
const { readFileSync, writeFileSync, mkdirSync } = require('fs');
const { join, dirname } = require('path');

const seedPath = join(__dirname, '../../seed/learning_items.json');
const destPath = join(__dirname, '../src/data/learning_items.json');

try {
  const content = readFileSync(seedPath, 'utf8');
  mkdirSync(dirname(destPath), { recursive: true });
  writeFileSync(destPath, content);
  console.log('Synced learning items to', destPath);
} catch (err) {
  console.error('Failed to sync learning items:', err.message);
  process.exit(1);
}

