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

import { TypeScriptToTypeBox, ReferenceModel } from './typescript-to-typebox'
import { Type, Kind, TypeClone, TSchema } from '@sinclair/typebox'
import { TypeBoxModel } from '../model/model'
import * as ts from 'typescript'

export namespace TypeScriptToModel {
  const compilerOptions: ts.CompilerOptions = {
    module: ts.ModuleKind.CommonJS, // used for exports
    target: ts.ScriptTarget.ES2015, // evaluation target
  }
  export function Exports(code: string): Map<string, TSchema | Function> {
    const exports = {}
    const evaluate = new Function('exports', 'Type', 'TypeClone', 'Kind', code)
    evaluate(exports, Type, TypeClone, Kind)
    return new Map(globalThis.Object.entries(exports))
  }
  export function Types(exports: Map<string, TSchema | Function>): TSchema[] {
    const types: TSchema[] = []
    for (const [key, schema] of exports) {
      if (typeof schema === 'function') continue
      types.push({ ...schema, $id: key })
    }
    return types
  }
  export function Generate(typescriptCode: string, referenceModel: ReferenceModel = 'inline'): TypeBoxModel {
    const typescript = TypeScriptToTypeBox.Generate(typescriptCode, {
      referenceModel: referenceModel,
      useExportEverything: true,
      useTypeBoxImport: false,
      useIdentifiers: true,
    })
    const javascript = ts.transpileModule(typescript, { compilerOptions })
    const exports = Exports(javascript.outputText)
    const types = Types(exports)
    return { exports, types }
  }
}
