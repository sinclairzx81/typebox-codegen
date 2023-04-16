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

import * as Types from '@sinclair/typebox'
import { TypeBoxModel } from './model'
import { Formatter } from '../formatter/index'
import { PropertyEncoder } from '../encoder/index'

// --------------------------------------------------------------------------
// Errors
// --------------------------------------------------------------------------
class ModelToZodNonReferentialType extends Error {
  constructor(message: string) {
    super(`TypeBoxToZod: ${message}`)
  }
}
class ModelToZodUnsupportedType extends Error {
  constructor(message: string) {
    super(`TypeBoxToZod: ${message}`)
  }
}
// --------------------------------------------------------------------------
// ModelToZod
// --------------------------------------------------------------------------
export namespace ModelToZod {
  function Any(schema: Types.TAny) {
    return `z.any()`
  }
  function Array(schema: Types.TArray) {
    const items = Visit(schema.items)
    return `z.array(${items})`
  }
  function Boolean(schema: Types.TBoolean) {
    return `z.boolean()`
  }
  function Constructor(schema: Types.TConstructor): string {
    throw new ModelToZodUnsupportedType(`TConstructor`)
  }
  function Function(schema: Types.TFunction) {
    const params = schema.parameters.map((param) => Visit(param)).join(`, `)
    const returns = Visit(schema.returns)
    return `z.function().args(${params}).returns(${returns})`
  }
  function Integer(schema: Types.TInteger) {
    const buffer: string[] = []
    buffer.push(`z.number().int()`)
    if (schema.minimum !== undefined) buffer.push(`.min(${schema.minimum})`)
    if (schema.maximum !== undefined) buffer.push(`.max(${schema.maximum})`)
    if (schema.exclusiveMaximum !== undefined) buffer.push(`.max(${schema.exclusiveMaximum - 1})`)
    if (schema.exclusiveMinimum !== undefined) buffer.push(`.max(${schema.exclusiveMinimum + 1})`)
    if (schema.multipleOf !== undefined) buffer.push(`.multipleOf(${schema.multipleOf})`)
    return buffer.join(``)
  }
  function Intersect(schema: Types.TIntersect) {
    // note: Zod only supports binary intersection. While correct, this is partially at odds with TypeScript's
    // ability to distribute across (A & B & C). This code reduces intersection to binary ops.
    function reduce(rest: Types.TSchema[]): string {
      if (rest.length === 0) return `z.never()`
      if (rest.length === 1) return Visit(rest[0])
      const [left, right] = [rest[0], rest.slice(1)]
      return `z.intersection(${Visit(left)}, ${reduce(right)})`
    }
    return reduce(schema.allOf)
  }
  function Literal(schema: Types.TLiteral) {
    return typeof schema.const === `string` ? `z.literal('${schema.const}')` : `z.literal(${schema.const})`
  }
  function Never(schema: Types.TNever) {
    return `z.never()`
  }
  function Null(schema: Types.TNull) {
    return `z.null()`
  }
  function String(schema: Types.TString) {
    const buffer: string[] = []
    buffer.push(`z.string()`)
    if (schema.maxLength !== undefined) buffer.push(`.max(${schema.maxLength})`)
    if (schema.minLength !== undefined) buffer.push(`.min(${schema.minLength})`)
    return buffer.join(``)
  }
  function Number(schema: Types.TNumber) {
    const buffer: string[] = []
    buffer.push(`z.number()`)
    if (schema.minimum !== undefined) buffer.push(`.min(${schema.minimum})`)
    if (schema.maximum !== undefined) buffer.push(`.max(${schema.maximum})`)
    if (schema.exclusiveMaximum !== undefined) buffer.push(`.max(${schema.exclusiveMaximum - 1})`)
    if (schema.exclusiveMinimum !== undefined) buffer.push(`.max(${schema.exclusiveMinimum + 1})`)
    if (schema.multipleOf !== undefined) buffer.push(`.multipleOf(${schema.multipleOf})`)
    return buffer.join(``)
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
    return buffer.join(``)
  }
  function Promise(schema: Types.TPromise) {
    const item = Visit(schema.item)
    return `${item}.promise()`
  }
  function Record(schema: Types.TRecord) {
    for (const [key, value] of globalThis.Object.entries(schema.patternProperties)) {
      const type = Visit(value)
      if (key === `^(0|[1-9][0-9]*)$`) {
        throw new ModelToZodUnsupportedType(`TRecord<TNumber, TUnknown>`)
      } else {
        return `z.record(${type})`
      }
    }
    throw Error(`TypeBoxToZod: Unreachable`)
  }
  function Ref(schema: Types.TRef) {
    if (!reference_map.has(schema.$ref!)) throw new ModelToZodNonReferentialType(schema.$ref!)
    return schema.$ref
  }
  function This(schema: Types.TThis) {
    if (!reference_map.has(schema.$ref!)) throw new ModelToZodNonReferentialType(schema.$ref!)
    recursive_set.add(schema.$ref)
    return schema.$ref
  }
  function Tuple(schema: Types.TTuple) {
    if (schema.items === undefined) return `[]`
    const items = schema.items.map((schema) => Visit(schema)).join(`, `)
    return `z.tuple([${items}])`
  }
  function TemplateLiteral(schema: Types.TTemplateLiteral) {
    return `z.string().regex(new RegExp('${schema.pattern}'))`
  }
  function UInt8Array(schema: Types.TUint8Array): string {
    throw new ModelToZodUnsupportedType(`TUint8Array`)
  }
  function Undefined(schema: Types.TUndefined) {
    return `z.undefined()`
  }
  function Union(schema: Types.TUnion) {
    return `z.union([${schema.anyOf.map((schema) => Visit(schema)).join(`, `)}])`
  }
  function Unknown(schema: Types.TUnknown) {
    return `z.unknown()`
  }
  function Void(schema: Types.TVoid) {
    return `z.void()`
  }
  function UnsupportedType(schema: Types.TSchema) {
    return `z.any(/* ${schema[Types.Kind]} */)`
  }
  function Visit(schema: Types.TSchema): string {
    if (schema.$id !== undefined) reference_map.set(schema.$id, schema)
    if (schema.$id !== undefined && emitted_set.has(schema.$id!)) return schema.$id!
    if (Types.TypeGuard.TAny(schema)) return Any(schema)
    if (Types.TypeGuard.TArray(schema)) return Array(schema)
    if (Types.TypeGuard.TBoolean(schema)) return Boolean(schema)
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
  function GenerateType(schema: Types.TSchema, references: Types.TSchema[]) {
    const output: string[] = []
    if (schema.$id === undefined) schema.$id = `T_Generated`
    for (const reference of references) {
      if (reference.$id === undefined) throw new ModelToZodNonReferentialType(JSON.stringify(reference))
      reference_map.set(reference.$id, reference)
    }
    const type = Collect(schema)
    if (recursive_set.has(schema.$id!)) {
      output.push(`export type ${schema.$id} = z.infer<typeof ${schema.$id}>`)
      output.push(`export const ${schema.$id || `T`} = z.lazy(() => ${Formatter.Format(type)})`)
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
      buffer.push(GenerateType(type, model.types))
    }
    return Formatter.Format(buffer.join('\n'))
  }
}
