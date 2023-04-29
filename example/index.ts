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
  module Tuples {
    export type T1 = [1, 2]
    export type T2 = [3, 4]
    export type T3 = [...T1, ...T2]
  }
  module Variadics {
    export type F1 = (...args: Tuples.T1) => void
    export type F2 = (...args: [...Tuples.T1]) => void
    export type F3 = (args: [...Tuples.T1]) => void
    export type F4 = (args: Tuples.T1) => void
  }
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
Print('Model To TypeScript', Codegen.ModelToTypeScript.Generate(model))
Print('Model To Zod', Codegen.ModelToZod.Generate(model))
