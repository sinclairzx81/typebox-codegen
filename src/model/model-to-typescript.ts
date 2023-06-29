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

import { TypeBoxModel } from './model'
import { Formatter } from '../common/formatter'
import { TypeCompiler } from '@sinclair/typebox/compiler'
import * as Types from '@sinclair/typebox'

export namespace ModelToTypeScript {
  function Any(schema: Types.TAny) {
    return 'any'
  }
  function Array(schema: Types.TArray) {
    const items = Visit(schema.items)
    return `Array<${items}>`
  }
  function Boolean(schema: Types.TBoolean) {
    return 'boolean'
  }
  function BigInt(schema: Types.TBigInt) {
    return 'bigint'
  }
  function Constructor(schema: Types.TConstructor) {
    const params = schema.parameters.map((param) => Visit(param)).join(', ')
    const returns = Visit(schema.returns)
    return `(new (${params}) => ${returns})`
  }
  function Date(schema: Types.TDate) {
    return 'Date'
  }
  function Function(schema: Types.TFunction) {
    const params = schema.parameters.map((param) => Visit(param)).join(', ')
    const returns = Visit(schema.returns)
    return `((${params}) => ${returns})`
  }
  function Integer(schema: Types.TInteger) {
    return 'number'
  }
  function Intersect(schema: Types.TIntersect) {
    return schema.allOf.map((schema) => Visit(schema)).join(' & ')
  }
  function Literal(schema: Types.TLiteral) {
    if (typeof schema.const === 'string') {
      return `'${schema.const}'`
    } else {
      return `${schema.const}`
    }
  }
  function Never(schema: Types.TNever) {
    return 'never'
  }
  function Null(schema: Types.TNull) {
    return 'null'
  }
  function String(schema: Types.TString) {
    return 'string'
  }
  function Number(schema: Types.TNumber) {
    return 'number'
  }
  function Object(schema: Types.TObject) {
    const properties: string = globalThis.Object.entries(schema.properties)
      .map(([key, value]) => {
        return `${key}: ${Visit(value)}`
      })
      .join(',\n')
    return `{\n${properties}\n}`
  }
  function Promise(schema: Types.TPromise) {
    const item = Visit(schema.item)
    return `Promise<${item}>`
  }
  function Record(schema: Types.TRecord) {
    for (const [key, value] of globalThis.Object.entries(schema.patternProperties)) {
      const type = Visit(value)
      if (key === '^(0|[1-9][0-9]*)$') {
        return `Record<number, ${type}>`
      } else {
        return `Record<string, ${type}>`
      }
    }
    throw Error('TypeBoxToTypeScript: Unreachable')
  }
  function Ref(schema: Types.TRef) {
    return schema.$ref
  }
  function This(schema: Types.TThis) {
    return schema.$ref
  }
  function Tuple(schema: Types.TTuple) {
    if (schema.items === undefined) return `[]`
    const items = schema.items.map((schema) => Visit(schema)).join(', ')
    return `[${items}]`
  }
  function UInt8Array(schema: Types.TUint8Array) {
    return `Uint8Array`
  }
  function Undefined(schema: Types.TUndefined) {
    return `undefined`
  }
  function Union(schema: Types.TUnion) {
    return schema.anyOf.map((schema) => Visit(schema)).join(' | ')
  }
  function Unknown(schema: Types.TUnknown) {
    return `unknown`
  }
  function Void(schema: Types.TVoid) {
    return `void`
  }
  function Visit(schema: Types.TSchema): string {
    if (reference_map.has(schema.$id!)) return schema.$id!
    if (schema.$id !== undefined) reference_map.set(schema.$id, schema)
    if (Types.TypeGuard.TAny(schema)) return Any(schema)
    if (Types.TypeGuard.TArray(schema)) return Array(schema)
    if (Types.TypeGuard.TBoolean(schema)) return Boolean(schema)
    if (Types.TypeGuard.TBigInt(schema)) return BigInt(schema)
    if (Types.TypeGuard.TConstructor(schema)) return Constructor(schema)
    if (Types.TypeGuard.TDate(schema)) return Date(schema)
    if (Types.TypeGuard.TFunction(schema)) return Function(schema)
    if (Types.TypeGuard.TInteger(schema)) return Integer(schema)
    if (Types.TypeGuard.TIntersect(schema)) return Intersect(schema)
    if (Types.TypeGuard.TLiteral(schema)) return Literal(schema)
    if (Types.TypeGuard.TNever(schema)) return Never(schema)
    if (Types.TypeGuard.TNull(schema)) return Null(schema)
    if (Types.TypeGuard.TNumber(schema)) return Number(schema)
    if (Types.TypeGuard.TObject(schema)) return Object(schema)
    if (Types.TypeGuard.TPromise(schema)) return Promise(schema)
    if (Types.TypeGuard.TRecord(schema)) return Record(schema)
    if (Types.TypeGuard.TRef(schema)) return Ref(schema)
    if (Types.TypeGuard.TThis(schema)) return This(schema)
    if (Types.TypeGuard.TString(schema)) return String(schema)
    if (Types.TypeGuard.TTuple(schema)) return Tuple(schema)
    if (Types.TypeGuard.TUint8Array(schema)) return UInt8Array(schema)
    if (Types.TypeGuard.TUndefined(schema)) return Undefined(schema)
    if (Types.TypeGuard.TUnion(schema)) return Union(schema)
    if (Types.TypeGuard.TUnknown(schema)) return Unknown(schema)
    if (Types.TypeGuard.TVoid(schema)) return Void(schema)
    return 'unknown'
  }
  export function GenerateType(model: TypeBoxModel, $id: string) {
    reference_map.clear()
    const type = model.types.find((type) => type.$id === $id)
    if (type === undefined) return `export type ${$id} = unknown`
    return `export type ${type.$id!} = ${Visit(type)}`
  }
  const reference_map = new Map<string, Types.TSchema>()
  export function Generate(model: TypeBoxModel): string {
    reference_map.clear()
    const definitions: string[] = []
    for (const type of model.types) {
      const definition = `export type ${type.$id!} = ${Visit(type)}`
      const assertion = `export const ${type.$id!} = (() => { ${TypeCompiler.Code(type, model.types, { language: 'typescript' })} })();`
      const rewritten = assertion.replaceAll(`return function check(value: any): boolean`, `return function check(value: any): value is ${type.$id!}`)
      definitions.push(`
      ${definition}
      ${rewritten}
      `)
    }
    const output = [...definitions]
    return Formatter.Format(output.join('\n\n'))
  }
}
