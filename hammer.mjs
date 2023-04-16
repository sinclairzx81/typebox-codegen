// -------------------------------------------------------------------------------
// Clean
// -------------------------------------------------------------------------------
export async function clean() {
    await folder('target').delete()
}
// -------------------------------------------------------------------------------
// Format
// -------------------------------------------------------------------------------
export async function format() {
    await shell('prettier --write src test example')
}
// -------------------------------------------------------------------------------
// Test
// -------------------------------------------------------------------------------
export async function test() {
    await shell('hammer build test/index.ts --dist target/test --platform node')
    await shell('node target/test/index.js --test')
}
// -------------------------------------------------------------------------------
// Serve
// -------------------------------------------------------------------------------
export async function serve() {
    await shell('hammer serve example/index.html --dist target/example')
}
// -------------------------------------------------------------------------------
// Start
// -------------------------------------------------------------------------------
export async function start() {
    await shell('hammer run example/index.ts --dist target/example')
}
// -------------------------------------------------------------------------------
// Build
// -------------------------------------------------------------------------------
export async function build() {
    await shell('tsc -p src/tsconfig.json --outDir target/build --declaration')
}