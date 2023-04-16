import { Type, Static } from '@sinclair/typebox'
import * as Codegen from '@typebox/codegen'

function Print(transform: string, code: any) {
  const length = 72
  console.log('┌' + '─'.repeat(length) + '┐')
  console.log('│', transform.padEnd(length - 1) + '│')
  console.log('└' + '─'.repeat(length) + '┘')
  console.log('')
  console.log(code)
  console.log('')
}
const Code = `
  export interface Vector {
    x: number
    y: number
    z: number
  }
  type A = Vector['x']
`
// ----------------------------------------------------------------------------
// Immediate Transform
// ----------------------------------------------------------------------------
Print('TypeScript To TypeBox', Codegen.TypeScriptToTypeBox.Generate(Code))

// ----------------------------------------------------------------------------
// Model Transform
// ----------------------------------------------------------------------------
const model = Codegen.TypeScriptToModel.Generate(Code)
Print('TypeScript To Model', model)
Print('Model To JsonSchema', Codegen.ModelToJsonSchema.Generate(model))
Print('Model To TypeScript', Codegen.ModelToTypeScript.Generate(model))
Print('Model To Zod', Codegen.ModelToZod.Generate(model))
