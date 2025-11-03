const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'src', 'data', 'students.js');
const text = fs.readFileSync(file, 'utf8');

const admissionMatches = Array.from(text.matchAll(/"admissionNo"\s*:\s*"([^"]+)"/g)).map(m => m[1]);
const rollMatches = Array.from(text.matchAll(/"rollNo"\s*:\s*"([^"]+)"/g)).map(m => m[1]);

function findDups(arr) {
  const map = new Map();
  for (const v of arr) {
    if (!v) continue;
    map.set(v, (map.get(v) || 0) + 1);
  }
  return Array.from(map.entries()).filter(([k, c]) => c > 1).sort((a,b)=>b[1]-a[1]);
}

const dupAdmissions = findDups(admissionMatches);
const dupRolls = findDups(rollMatches);

console.log('Duplicate admissionNo entries:', dupAdmissions.length ? dupAdmissions : 'None');
console.log('Duplicate rollNo entries:', dupRolls.length ? dupRolls : 'None');

if (!dupAdmissions.length && !dupRolls.length) process.exit(0);
process.exit(0);
