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
  type A = [0, 1]
  type B = [2, 3]
  type C = [...A, ...B]
  module A {
    export type F1 = new (x: C) => void
    export type F2 = (...x: C) => void
    type F3 = (x: [...A, ...B]) => void
  }
  {
    type E = A.F1
  }
`

// ----------------------------------------------------------------------------
// Immediate Transform
// ----------------------------------------------------------------------------
Print(
  'TypeScript To TypeBox',
  Codegen.TypeScriptToTypeBox.Generate(Code, {
    useExportEverything: false,
    useIdentifiers: true,
    useTypeBoxImport: false,
  }),
)

// // ----------------------------------------------------------------------------
// // Model Transform
// // ----------------------------------------------------------------------------
// const model = Codegen.TypeScriptToModel.Generate(Code)
// Print('TypeScript To Model', model)
// Print('Model To JsonSchema', Codegen.ModelToJsonSchema.Generate(model))
// Print('Model To TypeScript', Codegen.ModelToTypeScript.Generate(model))
// Print('Model To Zod', Codegen.ModelToZod.Generate(model))
