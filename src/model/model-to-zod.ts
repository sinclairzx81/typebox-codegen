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

import { Formatter, PropertyEncoder } from '../common/index'
import { TypeBoxModel } from './model'
import { ModelToTypeScript } from './model-to-typescript'
import * as Types from '@sinclair/typebox'

// --------------------------------------------------------------------------
// ModelToZod
// --------------------------------------------------------------------------
export namespace ModelToZod {
  function IsDefined<T = any>(value: unknown): value is T {
    return value !== undefined
  }
  function Type(schema: Types.TSchema, type: string) {
    return schema.default === undefined ? type : `${type}.default(${JSON.stringify(schema.default)})`
  }
  function Any(schema: Types.TAny) {
    return Type(schema, `z.any()`)
  }
  function Array(schema: Types.TArray) {
    const items = Visit(schema.items)
    const buffer: string[] = []
    buffer.push(`z.array(${items})`)
    if (IsDefined<number>(schema.minItems)) buffer.push(`.min(${schema.minItems})`)
    if (IsDefined<number>(schema.maxItems)) buffer.push(`.max(${schema.maxItems})`)
    return Type(schema, buffer.join(``))
  }
  function BigInt(schema: Types.TBigInt) {
    return Type(schema, `z.bigint()`)
  }
  function Boolean(schema: Types.TBoolean) {
    return Type(schema, `z.boolean()`)
  }
  function Date(schema: Types.TDate) {
    return Type(schema, `z.date()`)
  }
  function Constructor(schema: Types.TConstructor): string {
    return UnsupportedType(schema)
  }
  function Function(schema: Types.TFunction) {
    const params = schema.parameters.map((param) => Visit(param)).join(`, `)
    const returns = Visit(schema.returns)
    return Type(schema, `z.function().args(${params}).returns(${returns})`)
  }
  function Integer(schema: Types.TInteger) {
    const buffer: string[] = []
    buffer.push(`z.number().int()`)
    if (IsDefined<number>(schema.minimum)) buffer.push(`.min(${schema.minimum})`)
    if (IsDefined<number>(schema.maximum)) buffer.push(`.max(${schema.maximum})`)
    if (IsDefined<number>(schema.exclusiveMaximum)) buffer.push(`.max(${schema.exclusiveMaximum - 1})`)
    if (IsDefined<number>(schema.exclusiveMinimum)) buffer.push(`.max(${schema.exclusiveMinimum + 1})`)
    if (IsDefined<number>(schema.multipleOf)) buffer.push(`.multipleOf(${schema.multipleOf})`)
    return Type(schema, buffer.join(``))
  }
  function Intersect(schema: Types.TIntersect) {
    function reduce(rest: Types.TSchema[]): string {
      if (rest.length === 0) return `z.never()`
      if (rest.length === 1) return Visit(rest[0])
      const [left, right] = [rest[0], rest.slice(1)]
      return Type(schema, `z.intersection(${Visit(left)}, ${reduce(right)})`)
    }
    return reduce(schema.allOf)
  }
  function Literal(schema: Types.TLiteral) {
    return typeof schema.const === `string` ? Type(schema, `z.literal('${schema.const}')`) : Type(schema, `z.literal(${schema.const})`)
  }
  function Never(schema: Types.TNever) {
    return Type(schema, `z.never()`)
  }
  function Null(schema: Types.TNull) {
    return Type(schema, `z.null()`)
  }
  function String(schema: Types.TString) {
    const buffer: string[] = []
    buffer.push(`z.string()`)
    if (IsDefined<number>(schema.maxLength)) buffer.push(`.max(${schema.maxLength})`)
    if (IsDefined<number>(schema.minLength)) buffer.push(`.min(${schema.minLength})`)
    return Type(schema, buffer.join(``))
  }
  function Number(schema: Types.TNumber) {
    const buffer: string[] = []
    buffer.push(`z.number()`)
    if (IsDefined<number>(schema.minimum)) buffer.push(`.min(${schema.minimum})`)
    if (IsDefined<number>(schema.maximum)) buffer.push(`.max(${schema.maximum})`)
    if (IsDefined<number>(schema.exclusiveMaximum)) buffer.push(`.max(${schema.exclusiveMaximum - 1})`)
    if (IsDefined<number>(schema.exclusiveMinimum)) buffer.push(`.max(${schema.exclusiveMinimum + 1})`)
    if (IsDefined<number>(schema.multipleOf)) buffer.push(`.multipleOf(${schema.multipleOf})`)
    return Type(schema, buffer.join(``))
  }
  function Object(schema: Types.TObject) {
    // prettier-ignore
    const properties = globalThis.Object.entries(schema.properties).map(([key, value]) => {
      const optional = Types.TypeGuard.TOptional(value) || Types.TypeGuard.TReadonlyOptional(value)
      const property = PropertyEncoder.Encode(key)
      return optional ? `${property}: ${Visit(value)}.optional()` : `${property}: ${Visit(value)}`
    }).join(`,`)
    const buffer: string[] = []
    buffer.push(`z.object({\n${properties}\n})`)
    if (schema.additionalProperties === false) buffer.push(`.strict()`)
    return Type(schema, buffer.join(``))
  }
  function Promise(schema: Types.TPromise) {
    const item = Visit(schema.item)
    return Type(schema, `${item}.promise()`)
  }
  function Record(schema: Types.TRecord) {
    for (const [key, value] of globalThis.Object.entries(schema.patternProperties)) {
      const type = Visit(value)
      if (key === `^(0|[1-9][0-9]*)$`) {
        return `z.record(z.number(), ${type})`
      } else {
        return `z.record(${type})`
      }
    }
    throw Error(`TypeBoxToZod: Unreachable`)
  }
  function Ref(schema: Types.TRef) {
    if (!reference_map.has(schema.$ref!)) return UnsupportedType(schema) // throw new ModelToZodNonReferentialType(schema.$ref!)
    return schema.$ref
  }
  function This(schema: Types.TThis) {
    if (!reference_map.has(schema.$ref!)) return UnsupportedType(schema) //throw new ModelToZodNonReferentialType(schema.$ref!)
    recursive_set.add(schema.$ref)
    return schema.$ref
  }
  function Tuple(schema: Types.TTuple) {
    if (schema.items === undefined) return `[]`
    const items = schema.items.map((schema) => Visit(schema)).join(`, `)
    return Type(schema, `z.tuple([${items}])`)
  }
  function TemplateLiteral(schema: Types.TTemplateLiteral) {
    return Type(schema, `z.string().regex(new RegExp('${schema.pattern}'))`)
  }
  function UInt8Array(schema: Types.TUint8Array): string {
    return Type(schema, `z.instanceof(Uint8Array)`)
  }
  function Undefined(schema: Types.TUndefined) {
    return Type(schema, `z.undefined()`)
  }
  function Union(schema: Types.TUnion) {
    return Type(schema, `z.union([${schema.anyOf.map((schema) => Visit(schema)).join(`, `)}])`)
  }
  function Unknown(schema: Types.TUnknown) {
    return Type(schema, `z.unknown()`)
  }
  function Void(schema: Types.TVoid) {
    return Type(schema, `z.void()`)
  }
  function UnsupportedType(schema: Types.TSchema) {
    return Type(schema, `z.any(/* ${schema[Types.Kind]} */)`)
  }
  function Visit(schema: Types.TSchema): string {
    if (schema.$id !== undefined) reference_map.set(schema.$id, schema)
    if (schema.$id !== undefined && emitted_set.has(schema.$id!)) return schema.$id!
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
  function Collect(schema: Types.TSchema) {
    return [...Visit(schema)].join(``)
  }
  function GenerateType(model: TypeBoxModel, schema: Types.TSchema, references: Types.TSchema[]) {
    const output: string[] = []
    for (const reference of references) {
      if (reference.$id === undefined) return UnsupportedType(schema)
      reference_map.set(reference.$id, reference)
    }
    const type = Collect(schema)
    if (recursive_set.has(schema.$id!)) {
      output.push(`export ${ModelToTypeScript.GenerateType(model, schema.$id!)}`)
      output.push(`export const ${schema.$id || `T`}: z.ZodType<${schema.$id}> = z.lazy(() => ${Formatter.Format(type)})`)
    } else {
      output.push(`export type ${schema.$id} = z.infer<typeof ${schema.$id}>`)
      output.push(`export const ${schema.$id || `T`} = ${Formatter.Format(type)}`)
    }
    if (schema.$id) emitted_set.add(schema.$id)
    return output.join('\n')
  }
  const reference_map = new Map<string, Types.TSchema>()
  const recursive_set = new Set<string>()
  const emitted_set = new Set<string>()
  export function Generate(model: TypeBoxModel): string {
    reference_map.clear()
    recursive_set.clear()
    emitted_set.clear()
    const buffer: string[] = [`import z from 'zod'`, '']
    for (const type of model.types) {
      buffer.push(GenerateType(model, type, model.types))
    }
    return buffer.join('\n')
  }
}
