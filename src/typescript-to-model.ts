/*--------------------------------------------------------------------------

@typebox/codegen

The MIT License (MIT)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

---------------------------------------------------------------------------*/

import { TypeScriptToTypeBox } from './typescript-to-typebox'
import { Type, TSchema } from '@sinclair/typebox'
import { TypeBoxModel } from './model'
import * as ts from 'typescript'

// --------------------------------------------------------------------------
// This code run an evaluation pass over TypeBox script and produces a Map
// model of all the types encoded in the script. The model is then used to
// project out to other formats.
// --------------------------------------------------------------------------
export namespace TypeScriptToModel {
  const compilerOptions: ts.CompilerOptions = {
    module: ts.ModuleKind.CommonJS,
  }
  export function Encode(schema: TSchema) {
    const encoded = JSON.stringify(schema, null, 2)
    return encoded.replace(/"([^"]+)":/g, '$1:')
  }
  export function Definition(key: string, schema: TSchema) {
    const encoded = Encode(schema)
    return `export const ${key} = ${encoded}`
  }
  export function Evaluate(code: string): Record<string, TSchema | Function> {
    const exports: Record<string, TSchema | Function> = {}
    const evaluate = new Function('exports', 'Type', code)
    evaluate(exports, Type)
    return exports
  }
  export function Generate(typescriptCode: string): TypeBoxModel {
    const typescript = TypeScriptToTypeBox.Generate(typescriptCode, {
      useExportEverything: true,
      useTypeBoxImport: false,
    })
    const javascript = ts.transpileModule(typescript, { compilerOptions })
    const exports = Evaluate(javascript.outputText)
    return new Map(globalThis.Object.entries(exports))
  }
}
