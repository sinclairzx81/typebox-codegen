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
    await shell('prettier --no-semi --single-quote --print-width 240 --trailing-comma all --write src example')
}
// -------------------------------------------------------------------------------
// Serve
// -------------------------------------------------------------------------------
export async function serve() {
    await shell('hammer serve example/index.html --dist target/serve')
}
// -------------------------------------------------------------------------------
// Start
// -------------------------------------------------------------------------------
export async function start() {
    await shell('hammer run example/index.ts --dist target/start')
}