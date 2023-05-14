import { readFileSync } from 'node:fs'

// -------------------------------------------------------------
// Clean
// -------------------------------------------------------------
export async function clean() {
  await folder('target').delete()
}
// -------------------------------------------------------------
// Format
// -------------------------------------------------------------
export async function format() {
  await shell('prettier --write src test example')
}
// -------------------------------------------------------------
// Test
// -------------------------------------------------------------
export async function test(testReporter = 'spec', filter = '') {
  const pattern = filter.length > 0 ? `"--test-name-pattern=${filter}.*"` : ''
  await shell('hammer build test/index.ts --dist target/test --platform node')
  await shell(`node --test-reporter ${testReporter} --test ${pattern} target/test/index.js`)
}
// -------------------------------------------------------------
// Start
// -------------------------------------------------------------
export async function start() {
  await shell('hammer run example/index.ts --dist target/example')
}
// -------------------------------------------------------------
// Build
// -------------------------------------------------------------
export async function build(target = 'target/build') {
  await shell(`tsc -p src/tsconfig.json --outDir ${target} --declaration`)
  await folder(target).add('package.json')
  await folder(target).add('license')
  await folder(target).add('readme.md')
  await shell(`cd ${target} && npm pack`)
}
// -------------------------------------------------------------
// Publish
// -------------------------------------------------------------
export async function publish(otp, target = 'target/build') {
  const { version } = JSON.parse(readFileSync(`${target}/package.json`, 'utf8'))
  if(version.includes('-dev')) throw Error(`package version should not include -dev specifier`)
  await shell(`cd ${target} && npm publish sinclair-typebox-codegen-${version}.tgz --access=public --otp ${otp}`)
  await shell(`git tag ${version}`)
  await shell(`git push origin ${version}`)
}
// -------------------------------------------------------------
// Publish-Dev
// -------------------------------------------------------------
export async function publish_dev(otp, target = 'target/build') {
  const { version } = JSON.parse(readFileSync(`${target}/package.json`, 'utf8'))
  if(!version.includes('-dev')) throw Error(`development package version should include -dev specifier`)
  await shell(`cd ${target} && npm publish sinclair-typebox-codegen-${version}.tgz --access=public --otp ${otp} --tag dev`)
}