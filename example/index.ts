import * as Codegen from '@sinclair/typebox-codegen'
import * as util from 'node:util'

function Print(transform: string, code: any) {
  const data = typeof code === 'string' ? Codegen.Formatter.Format(code) : util.inspect(code, false, 100)
  const length = 72
  console.log('┌' + '─'.repeat(length) + '┐')
  console.log('│', transform.padEnd(length - 1) + '│')
  console.log('└' + '─'.repeat(length) + '┘')
  console.log('')
  console.log(data)
  console.log('')
}
const Code = `
export type A = {
  x: number,
  y: string,
  z: boolean
}

export type B = {
  a: number,
  b: string,
  c: boolean
} 
export type T = A & B 

export type F = (a: number) => void

type M = {[K in keyof T]: 1 }
`
// ----------------------------------------------------------------------------
// Typescript Base
// ----------------------------------------------------------------------------
Print('Typescript', Code)
// ----------------------------------------------------------------------------
// TypeBox Transform
// ----------------------------------------------------------------------------
Print('TypeScript To TypeBox', Codegen.TypeScriptToTypeBox.Generate(Code))
// ----------------------------------------------------------------------------
// Model Transform
// ----------------------------------------------------------------------------
const model = Codegen.TypeScriptToModel.Generate(Code)
Print('TypeScript To Inline Model', model)
Print('Model To JsonSchema Inline', Codegen.ModelToJsonSchema.Generate(model))
Print('Model To JavaScript', Codegen.ModelToJavaScript.Generate(model))
Print('Model To TypeScript', Codegen.ModelToTypeScript.Generate(model))
Print('Model To Valibot', Codegen.ModelToValibot.Generate(model))
Print('Model To Value', Codegen.ModelToValue.Generate(model))
Print('Model To Yup', Codegen.ModelToYup.Generate(model))
Print('Model To Zod', Codegen.ModelToZod.Generate(model))
Print('Model To ArkType', Codegen.ModelToArkType.Generate(model))
Print('Model To Effect', Codegen.ModelToEffect.Generate(model))
