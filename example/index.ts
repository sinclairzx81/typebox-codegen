import { ModelToJsonSchema, ModelToTypeBox, ModelToTypescript, TypeScriptToTypeBox, TypeScriptToModel } from '@typebox/codegen'

// ---------------------------------------------------------------
// Model
// ---------------------------------------------------------------
const model = TypeScriptToModel.Generate(`
    interface Vector {
        x: number,
        y: number,
        z: number
    }   
`)
console.log('----------------------------------------------------')
console.log(model)

// ----------------------------------------------------------------
// TypeBox (Direct Transform)
// ----------------------------------------------------------------
const typebox = TypeScriptToTypeBox.Generate(`
interface Vector {
    x: number,
    y: number,
    z: number
}   
`)
console.log('----------------------------------------------------')
console.log(typebox)

// ---------------------------------------------------------------
// JsonSchema
// ---------------------------------------------------------------

const jsonschema = ModelToJsonSchema.Generate(model)

console.log('----------------------------------------------------')
console.log(jsonschema)
