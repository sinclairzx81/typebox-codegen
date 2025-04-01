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

import { Formatter, PropertyEncoder } from '../common/index'
import { TypeBoxModel } from './model'
import * as Types from '@sinclair/typebox'

// --------------------------------------------------------------------------
// ModelToEffect
// --------------------------------------------------------------------------
export namespace ModelToEffect {
  function IsDefined<T = any>(value: unknown): value is T {
    return value !== undefined
  }
  function Type(schema: Types.TSchema, type: string) {
    return type
  }
  function Any(schema: Types.TAny) {
    return Type(schema, `ES.Any`)
  }
  function Array(schema: Types.TArray) {
    const items = Visit(schema.items)
    const buffer: string[] = []
    buffer.push(`ES.Array(${items})`)
    if (IsDefined<number>(schema.minItems)) buffer.push(`.pipe(ES.minItems(${schema.minItems}))`)
    if (IsDefined<number>(schema.maxItems)) buffer.push(`.pipe(ES.maxItems(${schema.maxItems}))`)
    return Type(schema, buffer.join(``))
  }
  function BigInt(schema: Types.TBigInt) {
    return Type(schema, `ES.BigInt`)
  }
  function Boolean(schema: Types.TBoolean) {
    return Type(schema, `ES.Boolean`)
  }
  function Date(schema: Types.TDate) {
    return Type(schema, `ES.Date`)
  }
  function Constructor(schema: Types.TConstructor): string {
    return UnsupportedType(schema)
  }
  function Function(schema: Types.TFunction) {
    return UnsupportedType(schema)
  }
  function Integer(schema: Types.TInteger) {
    const buffer: string[] = []
    buffer.push(`ES.Int`)
    if (IsDefined<number>(schema.minimum)) buffer.push(`.pipe(ES.greaterThanOrEqualTo(${schema.minimum}))`)
    if (IsDefined<number>(schema.maximum)) buffer.push(`.pipe(ES.lessThanOrEqualTo(${schema.maximum}))`)
    if (IsDefined<number>(schema.exclusiveMinimum)) buffer.push(`.pipe(ES.greaterThan(${schema.exclusiveMinimum}))`)
    if (IsDefined<number>(schema.exclusiveMaximum)) buffer.push(`.pipe(ES.lessThan(${schema.exclusiveMaximum}))`)
    if (IsDefined<number>(schema.multipleOf)) buffer.push(`.pipe(ES.multipleOf(${schema.multipleOf}))`)
    return Type(schema, buffer.join(``))
  }
  function Intersect(schema: Types.TIntersect) {
    return Object(Types.Type.Composite(schema.allOf as never)) // No Intersect Type?
  }
  function Literal(schema: Types.TLiteral) {
    const value = typeof schema.const === `string` ? `'${schema.const}'` : schema.const
    return Type(schema, `ES.Literal(${value})`)
  }
  function Never(schema: Types.TNever) {
    return Type(schema, `ES.Never`)
  }
  function Null(schema: Types.TNull) {
    return Type(schema, `ES.Null`)
  }
  function String(schema: Types.TString) {
    const buffer: string[] = []
    buffer.push(`ES.String`)
    if (IsDefined<number>(schema.maxLength)) buffer.push(`.pipe(ES.maxLength(${schema.maxLength}))`)
    if (IsDefined<number>(schema.minLength)) buffer.push(`.pipe(ES.minLength(${schema.minLength}))`)
    return Type(schema, buffer.join(``))
  }
  function Number(schema: Types.TNumber) {
    const buffer: string[] = []
    buffer.push(`ES.Number`)
    if (IsDefined<number>(schema.minimum)) buffer.push(`.pipe(ES.greaterThanOrEqualTo(${schema.minimum}))`)
    if (IsDefined<number>(schema.maximum)) buffer.push(`.pipe(ES.lessThanOrEqualTo(${schema.maximum}))`)
    if (IsDefined<number>(schema.exclusiveMinimum)) buffer.push(`.pipe(ES.greaterThan(${schema.exclusiveMinimum}))`)
    if (IsDefined<number>(schema.exclusiveMaximum)) buffer.push(`.pipe(ES.lessThan(${schema.exclusiveMaximum}))`)
    if (IsDefined<number>(schema.multipleOf)) buffer.push(`.pipe(ES.multipleOf(${schema.multipleOf}))`)
    return Type(schema, buffer.join(``))
  }
  function Object(schema: Types.TObject) {
    // prettier-ignore
    const properties = globalThis.Object.entries(schema.properties).map(([key, value]) => {
      const optional = Types.TypeGuard.IsOptional(value)
      const property = PropertyEncoder.Encode(key)
      // prettier-ignore
      return (
        optional 
          ? `${property}: ES.optional(${Visit(value)})` 
          : `${property}: ${Visit(value)}`
      )
    }).join(`,`)
    const buffer: string[] = []
    buffer.push(`ES.Struct({\n${properties}\n})`)
    return Type(schema, buffer.join(``))
  }
  function Promise(schema: Types.TPromise) {
    return UnsupportedType(schema)
  }
  function Record(schema: Types.TRecord) {
    for (const [key, value] of globalThis.Object.entries(schema.patternProperties)) {
      const type = Visit(value)
      return `ES.Record(${key === `^(0|[1-9][0-9]*)$` ? `ES.Number` : `ES.String`}, ${type})`
    }
    return UnsupportedType(schema)
  }
  function Ref(schema: Types.TRef) {
    if (!reference_map.has(schema.$ref!)) return UnsupportedType(schema) // throw new ModelToZodNonReferentialType(schema.$ref!)
    return schema.$ref
  }
  function This(schema: Types.TThis) {
    return `${Type(schema, `ES.Any /* unsupported */`)}`
  }
  function Tuple(schema: Types.TTuple) {
    if (schema.items === undefined) return `[]`
    const items = schema.items.map((schema) => Visit(schema)).join(`, `)
    return Type(schema, `ES.Tuple(${items})`)
  }
  function TemplateLiteral(schema: Types.TTemplateLiteral) {
    return Type(schema, `ES.String.pipe(ES.pattern(/${schema.pattern}/))`)
  }
  function UInt8Array(schema: Types.TUint8Array): string {
    return Type(schema, `ES.Uint8Array`)
  }
  function Undefined(schema: Types.TUndefined) {
    return Type(schema, `ES.Undefined()`)
  }
  function Union(schema: Types.TUnion) {
    return Type(schema, `ES.Union(${schema.anyOf.map((schema) => Visit(schema)).join(`, `)})`)
  }
  function Unknown(schema: Types.TUnknown) {
    return Type(schema, `ES.Unknown`)
  }
  function Void(schema: Types.TVoid) {
    return Type(schema, `ES.Void`)
  }
  function UnsupportedType(schema: Types.TSchema) {
    return `${Type(schema, `ES.Any /* unsupported */`)}`
  }
  function Visit(schema: Types.TSchema): string {
    if (schema.$id !== undefined) reference_map.set(schema.$id, schema)
    if (schema.$id !== undefined && emitted_set.has(schema.$id!)) return schema.$id!
    if (Types.TypeGuard.IsAny(schema)) return Any(schema)
    if (Types.TypeGuard.IsArray(schema)) return Array(schema)
    if (Types.TypeGuard.IsBigInt(schema)) return BigInt(schema)
    if (Types.TypeGuard.IsBoolean(schema)) return Boolean(schema)
    if (Types.TypeGuard.IsDate(schema)) return Date(schema)
    if (Types.TypeGuard.IsConstructor(schema)) return Constructor(schema)
    if (Types.TypeGuard.IsFunction(schema)) return Function(schema)
    if (Types.TypeGuard.IsInteger(schema)) return Integer(schema)
    if (Types.TypeGuard.IsIntersect(schema)) return Intersect(schema)
    if (Types.TypeGuard.IsLiteral(schema)) return Literal(schema)
    if (Types.TypeGuard.IsNever(schema)) return Never(schema)
    if (Types.TypeGuard.IsNull(schema)) return Null(schema)
    if (Types.TypeGuard.IsNumber(schema)) return Number(schema)
    if (Types.TypeGuard.IsObject(schema)) return Object(schema)
    if (Types.TypeGuard.IsPromise(schema)) return Promise(schema)
    if (Types.TypeGuard.IsRecord(schema)) return Record(schema)
    if (Types.TypeGuard.IsRef(schema)) return Ref(schema)
    if (Types.TypeGuard.IsString(schema)) return String(schema)
    if (Types.TypeGuard.IsTemplateLiteral(schema)) return TemplateLiteral(schema)
    if (Types.TypeGuard.IsThis(schema)) return This(schema)
    if (Types.TypeGuard.IsTuple(schema)) return Tuple(schema)
    if (Types.TypeGuard.IsUint8Array(schema)) return UInt8Array(schema)
    if (Types.TypeGuard.IsUndefined(schema)) return Undefined(schema)
    if (Types.TypeGuard.IsUnion(schema)) return Union(schema)
    if (Types.TypeGuard.IsUnknown(schema)) return Unknown(schema)
    if (Types.TypeGuard.IsVoid(schema)) return Void(schema)
    return UnsupportedType(schema)
  }
  function Collect(schema: Types.TSchema) {
    return [...Visit(schema)].join(``)
  }
  function GenerateType(model: TypeBoxModel, schema: Types.TSchema) {
    const output: string[] = []
    if (!schema.$id || !reference_map.has(schema.$id)) return UnsupportedType(schema);
    const type = Collect(schema)
    output.push(`export type ${schema.$id} = ET.Type<typeof ${schema.$id}>`)
    output.push(`export const ${schema.$id || `T`} = ${Formatter.Format(type)}`)
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
    const buffer: string[] = []
    buffer.push(`import { Schema as ET } from '@effect/schema/Schema'`)
    buffer.push(`import { Schema as ES } from '@effect/schema'`)
    buffer.push(``)
    for (const reference of model.types) {
      if (reference.$id) reference_map.set(reference.$id, reference);
    }
    for (const type of model.types.filter((type) => Types.TypeGuard.IsSchema(type))) {
      buffer.push(GenerateType(model, type))
    }
    return Formatter.Format(buffer.join('\n'))
  }
}
