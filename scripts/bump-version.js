const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const [maj, min, patch] = pkg.version.split('.');
pkg.version = `${maj}.${min}.${parseInt(patch) + 1}`;
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
console.log(pkg.version);
