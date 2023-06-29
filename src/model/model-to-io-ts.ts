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
// ModelToIoTs
// --------------------------------------------------------------------------
export namespace ModelToIoTs {
  function IsDefined<T = any>(value: unknown): value is T {
    return value !== undefined
  }
  function Type(schema: Types.TSchema, type: string) {
    return type
  }
  function Any(schema: Types.TAny) {
    return Type(schema, `t.any`)
  }
  function Array(schema: Types.TArray) {
    const items = Visit(schema.items)
    const type = `t.array(${items})`
    const refinements: string[] = []
    if (IsDefined<number>(schema.minItems)) refinements.push(`value.length >= ${schema.minItems}`)
    if (IsDefined<number>(schema.maxItems)) refinements.push(`value.length <= ${schema.maxItems}`)
    return refinements.length === 0 ? type : `t.refinement(${type}, value => ${refinements.join('&&')})`
  }
  function BigInt(schema: Types.TBigInt) {
    return `t.bigint`
  }
  function Boolean(schema: Types.TBoolean) {
    return `t.boolean`
  }
  const support_types = new Map<string, string>()
  function Date(schema: Types.TDate) {
    support_types.set(
      'Date',
      ` const t_date = new t.Type<Date, Date, unknown>(
      'Date',
      (value: unknown): value is Date => value instanceof Date,
      (value, context) => (value instanceof Date ? t.success(value) : t.failure(value, context)),
      t.identity
    )`,
    )
    return `t_date`
  }
  function Constructor(schema: Types.TConstructor): string {
    support_types.set(
      'Function',
      `const t_Function = new t.Type<Function, Function, unknown>(
      'Promise',
      (value: unknown): value is Function => typeof value === 'function',
      (value, context) => (typeof value === 'function' ? t.success(value) : t.failure(value, context)),
      t.identity
    )`,
    )
    return `t_Function`
  }
  function Function(schema: Types.TFunction) {
    support_types.set(
      'Function',
      `const t_Function = new t.Type<Function, Function, unknown>(
      'Promise',
      (value: unknown): value is Function => typeof value === 'function',
      (value, context) => (typeof value === 'function' ? t.success(value) : t.failure(value, context)),
      t.identity
    )`,
    )
    return `t_Function`
  }
  function Integer(schema: Types.TInteger) {
    const type = `t.number`
    const refinements: string[] = []
    refinements.push(`value => Number.isInteger(value)`)
    if (IsDefined<number>(schema.minimum)) refinements.push(`value >= ${schema.minimum}`)
    if (IsDefined<number>(schema.maximum)) refinements.push(`value <= ${schema.maximum}`)
    if (IsDefined<number>(schema.exclusiveMaximum)) refinements.push(`value > ${schema.exclusiveMinimum}`)
    if (IsDefined<number>(schema.exclusiveMinimum)) refinements.push(`value < ${schema.exclusiveMaximum}`)
    if (IsDefined<number>(schema.multipleOf)) refinements.push(`value % ${schema.multipleOf} === 0`)
    return `t.refinement(${type}, value => ${refinements.join('&&')})`
  }
  function Intersect(schema: Types.TIntersect) {
    const types = schema.allOf.map((type) => Visit(type))
    return `t.intersection([${types.join(', ')}])`
  }
  function Literal(schema: Types.TLiteral) {
    return typeof schema.const === `string` ? Type(schema, `t.literal('${schema.const}')`) : Type(schema, `t.literal(${schema.const})`)
  }
  function Never(schema: Types.TNever) {
    return Type(schema, `t.never`)
  }
  function Null(schema: Types.TNull) {
    return Type(schema, `t.null`)
  }
  function String(schema: Types.TString) {
    const type = `t.string`
    const refinements: string[] = []
    if (IsDefined<number>(schema.minLength)) refinements.push(`value.length >= ${schema.minLength}`)
    if (IsDefined<number>(schema.maxLength)) refinements.push(`value.length <= ${schema.maxLength}`)
    return refinements.length === 0 ? type : `t.refinement(${type}, value => ${refinements.join('&&')})`
  }
  function Number(schema: Types.TNumber) {
    const type = `t.number`
    const refinements: string[] = []
    if (IsDefined<number>(schema.minimum)) refinements.push(`value >= ${schema.minimum}`)
    if (IsDefined<number>(schema.maximum)) refinements.push(`value <= ${schema.maximum}`)
    if (IsDefined<number>(schema.exclusiveMaximum)) refinements.push(`value > ${schema.exclusiveMinimum}`)
    if (IsDefined<number>(schema.exclusiveMinimum)) refinements.push(`value < ${schema.exclusiveMaximum}`)
    if (IsDefined<number>(schema.multipleOf)) refinements.push(`value % ${schema.multipleOf} === 0`)
    return refinements.length === 0 ? type : `t.refinement(${type}, value => ${refinements.join('&&')})`
  }
  function Object(schema: Types.TObject) {
    // prettier-ignore
    const properties = globalThis.Object.entries(schema.properties).map(([key, value]) => {
      const optional = Types.TypeGuard.TOptional(value) || Types.TypeGuard.TReadonlyOptional(value)
      const readonly = Types.TypeGuard.TReadonly(value) || Types.TypeGuard.TReadonlyOptional(value)
      const property = PropertyEncoder.Encode(key)
      const resolved = optional ? `t.union([t.undefined, ${Visit(value)}])` : Visit(value)
      return readonly ? `${property} : t.readonly(${resolved})` : `${property} : ${resolved}`
    }).join(`,`)
    const buffer: string[] = []
    if (schema.additionalProperties === false) {
      buffer.push(`t.strict({\n${properties}\n})`)
    } else {
      buffer.push(`t.type({\n${properties}\n})`)
    }
    return Type(schema, buffer.join(``))
  }
  function Promise(schema: Types.TPromise) {
    support_types.set(
      'Promise',
      `const t_Promise = new t.Type<Promise<any>, Promise<any>, unknown>(
      'Promise',
      (value: unknown): value is Promise<unknown> => value instanceof Promise,
      (value, context) => (value instanceof Promise<unknown> ? t.success(value) : t.failure(value, context)),
      t.identity
    )`,
    )
    return `t_Promise`
  }
  function Record(schema: Types.TRecord) {
    for (const [key, value] of globalThis.Object.entries(schema.patternProperties)) {
      const type = Visit(value)
      if (key === `^(0|[1-9][0-9]*)$`) {
        return `t.record(t.number, ${type})`
      } else {
        return `t.record(t.string, ${type})`
      }
    }
    throw Error(`Unreachable`)
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
    return Type(schema, `t.tuple([${items}])`)
  }
  function TemplateLiteral(schema: Types.TTemplateLiteral) {
    return Type(schema, `t.refinement(t.string, value => /${schema.pattern}/.test(value))`)
  }
  function UInt8Array(schema: Types.TUint8Array): string {
    support_types.set(
      'Uint8Array',
      `const t_Uint8Array = new t.Type<Uint8Array, Uint8Array, unknown>(
      'Uint8Array',
      (value: unknown): value is Uint8Array => value instanceof Uint8Array,
      (value, context) => (value instanceof Uint8Array ? t.success(value) : t.failure(value, context)),
      t.identity
    )`,
    )
    return `t_Uint8Array`
  }
  function Undefined(schema: Types.TUndefined) {
    return Type(schema, `t.undefined`)
  }
  function Union(schema: Types.TUnion) {
    return Type(schema, `t.union([${schema.anyOf.map((schema) => Visit(schema)).join(`, `)}])`)
  }
  function Unknown(schema: Types.TUnknown) {
    return Type(schema, `t.unknown`)
  }
  function Void(schema: Types.TVoid) {
    return Type(schema, `t.void`)
  }
  function UnsupportedType(schema: Types.TSchema) {
    return Type(schema, `t.any /* unresolved */`)
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
      output.push(`export const ${schema.$id || `T`}: t.Type<${schema.$id}> = t.recursion('${schema.$id}', () => ${Formatter.Format(type)})`)
    } else {
      output.push(`export type ${schema.$id} = t.TypeOf<typeof ${schema.$id}>`)
      output.push(`export const ${schema.$id || `T`} = ${Formatter.Format(type)}`)
    }
    if (schema.$id) emitted_set.add(schema.$id)
    return output.join('\n')
  }
  const reference_map = new Map<string, Types.TSchema>()
  const recursive_set = new Set<string>()
  const emitted_set = new Set<string>()
  export function Generate(model: TypeBoxModel): string {
    support_types.clear()
    reference_map.clear()
    recursive_set.clear()
    emitted_set.clear()
    const buffer: string[] = [`import t from 'io-ts'`, '']
    const types = model.types.map((type) => GenerateType(model, type, model.types))
    buffer.push(...support_types.values())
    buffer.push('\n')
    buffer.push(...types)
    return Formatter.Format(buffer.join('\n'))
  }
}
