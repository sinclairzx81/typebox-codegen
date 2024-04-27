/*--------------------------------------------------------------------------

@sinclair/typebox-codegen

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

import { Type, Kind, CloneType, TypeGuard, ValueGuard, type TSchema } from '@sinclair/typebox'
import { TypeScriptToTypeBox } from './typescript-to-typebox'
import { TypeBoxModel } from '../model/model'
import * as Ts from 'typescript'

export namespace TypeScriptToModel {
  const compilerOptions: Ts.CompilerOptions = {
    module: Ts.ModuleKind.CommonJS, // used for exports
    target: Ts.ScriptTarget.ES2015, // evaluation target
  }
  // This function evaluates the generated TypeBox code and returns it's exports. This
  // function shouldn't really exist and instead the TypeScriptToTypeBox module should
  // just generate in memory TypeBox types. However the work to do this would require
  // a complete rewrite of the module. We settle for eval() until a version 2.
  export function Exports(code: string): Record<string, unknown> {
    const exports = {}
    const evaluate = new Function('exports', 'Type', 'Kind', 'CloneType', code)
    evaluate(exports, Type, Kind, CloneType)
    return exports
  }
  // This function will traverse exports looking for types. If discovering an object
  // that isn't a type, that object will traversed and treated as a namespace. This
  // function will assign identifiers to the schematics based on the exported key,
  // nested types will be prefixed by the parent key and delimited via underscore.
  export function Types(namespace: string, exports: Record<string, unknown>): TSchema[] {
    const types: TSchema[] = []
    for (const [key, variable] of Object.entries(exports)) {
      const scope = namespace.length > 0 ? `${namespace}_${key}` : key
      if (TypeGuard.IsSchema(variable)) {
        types.push({ ...variable, $id: scope })
      } else if (ValueGuard.IsObject(variable)) {
        types.push(...Types(scope, variable))
      }
    }
    return types
  }
  export function Generate(typescriptCode: string): TypeBoxModel {
    const typescript = TypeScriptToTypeBox.Generate(typescriptCode, {
      useExportEverything: true,
      useTypeBoxImport: false,
      useIdentifiers: true,
    })
    const javascript = Ts.transpileModule(typescript, { compilerOptions })
    const exports = Exports(javascript.outputText)
    const types = Types('', exports)
    return { types }
  }
}
