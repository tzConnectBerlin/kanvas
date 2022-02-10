"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showVersion = void 0;
const package_assignment = require('../package.json');
function showVersion() {
    console.log('Hey this is the version: ', package_assignment.version);
}
exports.showVersion = showVersion;
//# sourceMappingURL=ver.js.map