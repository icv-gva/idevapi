const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');

test('runtime, distribution and package metadata declare patch 1.3.26', () => {
    for (const file of ['js/idevAPI_core.js', 'js/idevAPI_core-min.js']) {
        const source = fs.readFileSync(path.join(root, file), 'utf8');
        assert.equal(/\bIDEVAPIVersion\s*=\s*"1\.3\.26"/.test(source), true, file);
    }
    assert.equal(require('../package.json').version, '1.3.26');
    const lock = require('../package-lock.json');
    assert.equal(lock.version, '1.3.26');
    assert.equal(lock.packages[''].version, '1.3.26');
    assert.equal(fs.readFileSync(path.join(root, 'build.js'), 'utf8').includes("console.log('IDEVAPI 1.3.26')"), true);
});
