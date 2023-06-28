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
export interface Vector {
  /** 
   * @default 1 
   */
  x: number
  /** 
   * @default 2 
   */
  y: number
}

export interface Node {
  id: string
  nodes: this[]
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

// // ----------------------------------------------------------------------------
// // Model Transform
// // ----------------------------------------------------------------------------
const inlineModel = Codegen.TypeScriptToModel.Generate(Code, 'inline')
Print('TypeScript To Inline Model', inlineModel)
Print('Model To JsonSchema Inline', Codegen.ModelToJsonSchema.Generate(inlineModel))
Print('Model To JavaScript', Codegen.ModelToJavaScript.Generate(inlineModel))
Print('Model To TypeScript', Codegen.ModelToTypeScript.Generate(inlineModel))
Print('Model To Value', Codegen.ModelToValue.Generate(inlineModel))
Print('Model To Zod', Codegen.ModelToZod.Generate(inlineModel))

const cyclicModel = Codegen.TypeScriptToModel.Generate(Code, 'cyclic')
Print('TypeScript To Cyclic Model', cyclicModel)
Print('Model To JsonSchema Cyclic', Codegen.ModelToJsonSchema.Generate(cyclicModel))
Print('Model To ArkType', Codegen.ModelToArkType.Generate(cyclicModel))
