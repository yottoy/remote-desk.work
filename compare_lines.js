const fs = require('fs');
const path = require('path');

// Read the file
const filePath = path.join(__dirname, 'src', 'index.js');
const content = fs.readFileSync(filePath, 'utf8');

// Split into lines
const lines = content.split('\n');

// Print lines 30-34 with line numbers
for (let i = 30; i <= 34; i++) {
  if (i-1 < lines.length) {
    console.log(`Line ${i}: ${lines[i-1]}`);
  }
}

// Specifically check position 32:21
if (lines.length >= 32) {
  const line32 = lines[31]; // 0-indexed
  console.log('\nPosition analysis:');
  console.log(`Line 32: ${line32}`);
  if (line32.length >= 21) {
    console.log(`Character at pos 21: "${line32[20]}"`);
    console.log(`Substring from pos 21: "${line32.substring(20)}"`);
  } else {
    console.log(`Line 32 is too short, only ${line32.length} characters`);
  }
} 