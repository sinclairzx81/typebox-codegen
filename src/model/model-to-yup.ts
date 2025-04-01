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
import { ModelToTypeScript } from './model-to-typescript'
import * as Types from '@sinclair/typebox'

// --------------------------------------------------------------------------
// ModelToYup
// --------------------------------------------------------------------------
export namespace ModelToYup {
  function IsDefined<T = any>(value: unknown): value is T {
    return value !== undefined
  }
  function Type(schema: Types.TSchema, type: string) {
    return schema.default === undefined ? type : `${type}.default(${JSON.stringify(schema.default)})`
  }
  function Any(schema: Types.TAny) {
    return Type(schema, `y.mixed((value): value is any => true).required()`)
  }
  function Array(schema: Types.TArray) {
    const items = Visit(schema.items)
    const buffer: string[] = []
    buffer.push(`y.array(${items})`)
    if (IsDefined<number>(schema.minItems)) buffer.push(`.min(${schema.minItems})`)
    if (IsDefined<number>(schema.maxItems)) buffer.push(`.max(${schema.maxItems})`)
    return Type(schema, buffer.join(``))
  }
  function BigInt(schema: Types.TBigInt) {
    return Type(schema, `y.mixed((value): value is bigint => typeof value === 'bigint')`)
  }
  function Boolean(schema: Types.TBoolean) {
    return Type(schema, `y.boolean().required()`)
  }
  function Date(schema: Types.TDate) {
    return Type(schema, `y.date().required()`)
  }
  function Constructor(schema: Types.TConstructor): string {
    return Type(schema, `y.mixed((value): value is Function => typeof value === 'function')`)
  }
  function Function(schema: Types.TFunction) {
    return Type(schema, `y.mixed((value): value is Function => typeof value === 'function')`)
  }
  function Integer(schema: Types.TInteger) {
    const buffer: string[] = []
    buffer.push(`y.number().integer().required()`)
    if (IsDefined<number>(schema.minimum)) buffer.push(`.min(${schema.minimum})`)
    if (IsDefined<number>(schema.maximum)) buffer.push(`.max(${schema.maximum})`)
    if (IsDefined<number>(schema.exclusiveMaximum)) buffer.push(`.max(${schema.exclusiveMaximum - 1})`)
    if (IsDefined<number>(schema.exclusiveMinimum)) buffer.push(`.max(${schema.exclusiveMinimum + 1})`)
    return Type(schema, buffer.join(``))
  }
  function Intersect(schema: Types.TIntersect) {
    const mergable = schema.allOf.every((schema) => Types.TypeGuard.IsObject(schema))
    if (!mergable) return UnsupportedType(schema)
    const composite = Types.Type.Composite(schema.allOf as any)
    return Visit(composite)
  }
  function Literal(schema: Types.TLiteral) {
    return typeof schema.const === `string`
      ? Type(schema, `y.mixed((value): value is '${schema.const}' => value === '${schema.const}').required()`)
      : Type(schema, `y.mixed((value): value is ${schema.const} => value === ${schema.const}).required()`)
  }
  function Never(schema: Types.TNever) {
    return Type(schema, `y.mixed((value): value is never => false).required()`)
  }
  function Null(schema: Types.TNull) {
    return Type(schema, `(y.mixed((value): value is any => value === null).required() as y.MixedSchema<null>)`)
  }
  function String(schema: Types.TString) {
    const buffer: string[] = []
    buffer.push(`y.string().required()`)
    if (IsDefined<number>(schema.maxLength)) buffer.push(`.max(${schema.maxLength})`)
    if (IsDefined<number>(schema.minLength)) buffer.push(`.min(${schema.minLength})`)
    return Type(schema, buffer.join(``))
  }
  function Number(schema: Types.TNumber) {
    const buffer: string[] = []
    buffer.push(`y.number().required()`)
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
      const optional = Types.TypeGuard.IsOptional(value)
      const property = PropertyEncoder.Encode(key)
      return optional ? `${property}: ${Visit(value)}.optional()` : `${property}: ${Visit(value)}`
    }).join(`,`)
    const buffer: string[] = []
    buffer.push(`y.object({\n${properties}\n})`)
    if (schema.additionalProperties === false) buffer.push(`.strict()`)
    return Type(schema, buffer.join(``))
  }
  function Promise(schema: Types.TPromise) {
    return Type(schema, `y.mixed((value): value is Promise<unknown> => value instanceof Promise<unknown>)`)
  }
  function Record(schema: Types.TRecord) {
    return UnsupportedType(schema)
  }
  function Ref(schema: Types.TRef) {
    return `${schema.$ref}`
  }
  function This(schema: Types.TThis) {
    return UnsupportedType(schema)
  }
  function Tuple(schema: Types.TTuple) {
    if (schema.items === undefined) return `[]`
    const items = schema.items.map((schema) => `${Visit(schema)}.required()`).join(`, `)
    return Type(schema, `y.tuple([${items}]).required()`)
  }
  function TemplateLiteral(schema: Types.TTemplateLiteral) {
    return Type(schema, `y.string().matches(/${schema.pattern}/)`)
  }
  function UInt8Array(schema: Types.TUint8Array): string {
    return Type(schema, `y.mixed((value): value is Uint8Array => value instanceof Uint8Array).required()`)
  }
  function Undefined(schema: Types.TUndefined) {
    return Type(schema, `(y.mixed((value): value is any => value === undefined) as y.MixedSchema<undefined>)`)
  }
  function Union(schema: Types.TUnion) {
    const isLiteralUnion = schema.anyOf.every((schema) => Types.TypeGuard.IsLiteral(schema))
    return isLiteralUnion
      ? Type(schema, `y.mixed().oneOf([${schema.anyOf.map((schema) => JSON.stringify(schema.const)).join(`, `)}]).required()`)
      : Type(schema, `y.mixed().oneOf([${schema.anyOf.map((schema) => Visit(schema)).join(`, `)}]).required()`)
  }
  function Unknown(schema: Types.TUnknown) {
    return Type(schema, `(y.mixed((value): value is any => true).required() as y.MixedSchema<unknown>)`)
  }
  function Void(schema: Types.TVoid) {
    return Type(schema, `(y.mixed((value): value is any => value === undefined) as y.MixedSchema<void>)`)
  }
  function UnsupportedType(schema: Types.TSchema) {
    return `${Type(schema, `y.mixed(/* unsupported */)`)}`
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
    if (recursive_set.has(schema.$id!)) {
      output.push(`export ${ModelToTypeScript.GenerateType(model, schema.$id!)}`)
      output.push(`export const ${schema.$id || `T`}: y.InferType<${schema.$id}> = z.lazy(() => ${Formatter.Format(type)})`)
    } else {
      output.push(`export type ${schema.$id} =  y.InferType<typeof ${schema.$id}>`)
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
    const buffer: string[] = [`import y from 'yup'`, '']
    for (const reference of model.types) {
      if (reference.$id) reference_map.set(reference.$id, reference);
    }
    for (const type of model.types.filter((type) => Types.TypeGuard.IsSchema(type))) {
      buffer.push(GenerateType(model, type))
    }
    return Formatter.Format(buffer.join('\n'))
  }
}
