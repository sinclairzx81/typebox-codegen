import * as Codegen from '@typebox/codegen'

const Code = `
export interface Vector<T> {
    x: T
    y: T
    z: T
}
type P = Vector<string>
`

// ---------------------------------------------------------------
// TypeBox
// ---------------------------------------------------------------
console.log('---------------------------------------------------')

const typebox = Codegen.TypeScriptToTypeBox.Generate(Code)

console.log(typebox)

// ---------------------------------------------------------------
// Model
// ---------------------------------------------------------------
console.log('---------------------------------------------------')

const model = Codegen.TypeScriptToModel.Generate(Code)

console.log(model)

// ---------------------------------------------------------------
// JSON Schema
// ---------------------------------------------------------------
console.log('---------------------------------------------------')

const jsonschema = Codegen.ModelToJsonSchema.Generate(model)

console.log(jsonschema)

// ---------------------------------------------------------------
// Zod
// ---------------------------------------------------------------
console.log('---------------------------------------------------')

const zod = Codegen.TypeBoxToZod.Generate(model)

console.log(zod)
