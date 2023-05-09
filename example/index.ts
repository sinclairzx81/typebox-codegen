import { Type, Static } from '@sinclair/typebox'
import * as Codegen from '@typebox/codegen'
import * as util from 'node:util'

function Print(transform: string, code: any) {
  const data = typeof code === 'string' ? code : util.inspect(code, false, 100)
  const length = 72
  console.log('┌' + '─'.repeat(length) + '┐')
  console.log('│', transform.padEnd(length - 1) + '│')
  console.log('└' + '─'.repeat(length) + '┘')
  console.log('')
  console.log(data)
  console.log('')
}
const Code = `
  export interface Vector<T> { x: T, y: T }
  type A = Vector<number>
  type B = Vector<string> 
  type C = Vector<boolean> 
  type D = (A & B & C) | string | number
`

// ----------------------------------------------------------------------------
// Typescript Base
// ----------------------------------------------------------------------------
Print('Typescript code (base)', Code)

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
Print('Model To JavaScript', Codegen.ModelToJavaScript.Generate(model))
Print('Model To TypeScript', Codegen.ModelToTypeScript.Generate(model))
Print('Model To Zod', Codegen.ModelToZod.Generate(model))
