const fs = require('fs');
const path = require('path');
const acorn = require('acorn');
const walk = require('acorn-walk');

try {
  // Read the src/index.js file
  const indexPath = path.join(__dirname, 'src', 'index.js');
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  
  console.log('=== ANALYSIS OF src/index.js ===');
  
  // Parse the JavaScript code using Acorn
  const ast = acorn.parse(indexContent, {
    ecmaVersion: 2022,
    sourceType: 'module',
    locations: true, // Add source locations to AST nodes
  });
  
  // Find all member expressions that might be function calls
  console.log('\n=== POTENTIAL FUNCTION CALLS ===');
  walk.simple(ast, {
    CallExpression(node) {
      if (node.callee.type === 'MemberExpression') {
        const objectName = node.callee.object.name || '[expression]';
        const property = node.callee.property.name || '[computed]';
        const location = node.loc ? `Line ${node.loc.start.line}:${node.loc.start.column}` : 'Unknown location';
        console.log(`${location}: ${objectName}.${property}()`);
      }
    }
  });
  
  // Specifically look for bridgeManager calls
  console.log('\n=== BRIDGE MANAGER CALLS ===');
  walk.simple(ast, {
    CallExpression(node) {
      if (node.callee.type === 'MemberExpression' && 
          node.callee.object.name === 'bridgeManager') {
        const method = node.callee.property.name || '[computed]';
        const location = node.loc ? `Line ${node.loc.start.line}:${node.loc.start.column}` : 'Unknown location';
        console.log(`${location}: bridgeManager.${method}()`);
      }
    }
  });
  
  // Plain text search for startMonitoring
  console.log('\n=== TEXT SEARCH FOR startMonitoring ===');
  const lines = indexContent.split('\n');
  lines.forEach((line, index) => {
    if (line.includes('startMonitoring')) {
      console.log(`Line ${index + 1}: ${line.trim()}`);
    }
  });
  
  // Print line 32 for reference
  console.log('\n=== LINE 32 ===');
  if (lines.length >= 32) {
    console.log(`Line 32: ${lines[31]}`);
  } else {
    console.log('Line 32 does not exist in this file');
  }
  
  console.log('\n=== END OF ANALYSIS ===');
} catch (error) {
  console.error('Error analyzing file:', error);
} 