const package_assignment = require('../package.json')

export function showVersion(): void {
    console.log('Hey this is the version: ', package_assignment.version)
}