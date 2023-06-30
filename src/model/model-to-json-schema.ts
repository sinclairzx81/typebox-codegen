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

import { Formatter } from '../common/index'
import { TypeBoxModel } from './model'
import * as Types from '@sinclair/typebox'

// --------------------------------------------------------------------------
// ModelToJsonSchema
// --------------------------------------------------------------------------
export namespace ModelToJsonSchema {
  function Any(schema: Types.TAny): Types.TSchema {
    return schema
  }
  function Array(schema: Types.TArray): Types.TSchema {
    return schema
  }
  function BigInt(schema: Types.TBigInt): Types.TSchema {
    return schema
  }
  function Boolean(schema: Types.TBoolean): Types.TSchema {
    return schema
  }
  function Date(schema: Types.TDate): Types.TSchema {
    return schema
  }
  function Constructor(schema: Types.TConstructor): Types.TSchema {
    return schema
  }
  function Function(schema: Types.TFunction): Types.TSchema {
    const parameters = schema.parameters.map((schema) => Visit(schema))
    const returns = Visit(schema.returns)
    return { ...schema, parameters, returns }
  }
  function Integer(schema: Types.TInteger): Types.TSchema {
    return schema
  }
  function Intersect(schema: Types.TIntersect): Types.TSchema {
    const allOf = schema.allOf.map((schema) => Visit(schema))
    return { ...schema, allOf }
  }
  function Literal(schema: Types.TLiteral): Types.TSchema {
    return schema
  }
  function Never(schema: Types.TNever): Types.TSchema {
    return schema
  }
  function Null(schema: Types.TNull): Types.TSchema {
    return schema
  }
  function String(schema: Types.TString): Types.TSchema {
    return schema
  }
  function Number(schema: Types.TNumber): Types.TSchema {
    return schema
  }
  function Object(schema: Types.TObject): Types.TSchema {
    const properties = globalThis.Object.keys(schema.properties).reduce((acc, key) => {
      return { ...acc, [key]: Visit(schema.properties[key]) }
    }, {})
    return { ...schema, properties }
  }
  function Promise(schema: Types.TPromise): Types.TSchema {
    const item = Visit(schema.item)
    return { ...schema, item }
  }
  function Record(schema: Types.TRecord): Types.TSchema {
    const patternProperties = globalThis.Object.keys(schema.patternProperties).reduce((acc, key) => {
      return { ...acc, [key]: Visit(schema.properties[key]) }
    }, {})
    return { ...schema, patternProperties }
  }
  function Ref(schema: Types.TRef): Types.TSchema {
    return schema
  }
  function This(schema: Types.TThis): Types.TSchema {
    return schema
  }
  function Tuple(schema: Types.TTuple): Types.TSchema {
    if (schema.items === undefined) return schema
    const items = schema.items.map((schema) => Visit(schema))
    return { ...schema, items }
  }
  function TemplateLiteral(schema: Types.TTemplateLiteral): Types.TSchema {
    return schema
  }
  function UInt8Array(schema: Types.TUint8Array): Types.TSchema {
    return schema
  }
  function Undefined(schema: Types.TUndefined): Types.TSchema {
    return schema
  }
  function Union(schema: Types.TUnion): Types.TSchema {
    const anyOf = schema.anyOf.map((schema) => Visit(schema))
    return { ...schema, anyOf }
  }
  function Unknown(schema: Types.TUnknown): Types.TSchema {
    return schema
  }
  function Void(schema: Types.TVoid) {
    return schema
  }
  function UnsupportedType(schema: Types.TSchema) {
    return schema
  }
  function Visit(schema: Types.TSchema): Types.TSchema {
    if (Types.TypeGuard.TAny(schema)) return Any(schema)
    if (Types.TypeGuard.TArray(schema)) return Array(schema)
    if (Types.TypeGuard.TBigInt(schema)) return BigInt(schema)
    if (Types.TypeGuard.TBoolean(schema)) return Boolean(schema)
    if (Types.TypeGuard.TDate(schema)) return Date(schema)
    if (Types.TypeGuard.TConstructor(schema)) return Constructor(schema)
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
    if (Types.TypeGuard.TString(schema)) return String(schema)
    if (Types.TypeGuard.TTemplateLiteral(schema)) return TemplateLiteral(schema)
    if (Types.TypeGuard.TThis(schema)) return This(schema)
    if (Types.TypeGuard.TTuple(schema)) return Tuple(schema)
    if (Types.TypeGuard.TUint8Array(schema)) return UInt8Array(schema)
    if (Types.TypeGuard.TUndefined(schema)) return Undefined(schema)
    if (Types.TypeGuard.TUnion(schema)) return Union(schema)
    if (Types.TypeGuard.TUnknown(schema)) return Unknown(schema)
    if (Types.TypeGuard.TVoid(schema)) return Void(schema)
    return UnsupportedType(schema)
  }
  export function Generate(model: TypeBoxModel): string {
    const buffer: string[] = []
    for (const type of model.types) {
      const schema = Visit(type)
      const encode = JSON.stringify(schema, null, 2)
      buffer.push(`export const ${type.$id} = ${encode}`)
    }
    return Formatter.Format(buffer.join('\n'))
  }
}
