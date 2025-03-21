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
// ModelToValibot
// --------------------------------------------------------------------------
export namespace ModelToValibot {
  function IsDefined<T = any>(value: unknown): value is T {
    return value !== undefined
  }
  function Type(type: string, parameter: string | null, constraints: string[]) {
    if (constraints.length > 0) {
      if (typeof parameter === 'string') {
        return `v.pipe(${type}(${parameter}), ${constraints.join(', ')})`
      } else {
        return `v.pipe(${type}(), ${constraints.join(', ')})`
      }
    } else {
      if (typeof parameter === 'string') {
        return `${type}(${parameter})`
      } else {
        return `${type}()`
      }
    }
  }
  function Any(schema: Types.TAny) {
    return Type(`v.any`, null, [])
  }
  function Array(schema: Types.TArray) {
    const items = Visit(schema.items)
    const constraints: string[] = []
    if (IsDefined<number>(schema.minItems)) constraints.push(`v.minLength(${schema.minItems})`)
    if (IsDefined<number>(schema.maxItems)) constraints.push(`v.maxLength(${schema.maxItems})`)
    return Type(`v.array`, items, constraints)
  }
  function BigInt(schema: Types.TBigInt) {
    return Type(`v.bigint`, null, [])
  }
  function Boolean(schema: Types.TBoolean) {
    return Type(`v.boolean`, null, [])
  }
  function Date(schema: Types.TDate) {
    return Type(`v.date`, null, [])
  }
  function Constructor(schema: Types.TConstructor): string {
    return UnsupportedType(schema)
  }
  function Function(schema: Types.TFunction) {
    return UnsupportedType(schema)
  }
  function Integer(schema: Types.TInteger) {
    return Type(`v.number`, null, [`v.integer()`])
  }
  function Intersect(schema: Types.TIntersect) {
    const inner = schema.allOf.map((inner) => Visit(inner))
    return Type(`v.intersect`, `[${inner.join(', ')}]`, [])
  }
  function Literal(schema: Types.TLiteral) {
    // prettier-ignore
    return typeof schema.const === `string` 
      ? Type(`v.literal`, `'${schema.const}'`, []) 
      : Type(`v.literal`, `${schema.const}`, [])
  }
  function Never(schema: Types.TNever) {
    return Type(`v.never`, null, [])
  }
  function Null(schema: Types.TNull) {
    return Type(`v.null`, null, [])
  }
  function String(schema: Types.TString) {
    const constraints: string[] = []
    if (IsDefined<number>(schema.maxLength)) constraints.push(`v.maxLength(${schema.maxLength})`)
    if (IsDefined<number>(schema.minLength)) constraints.push(`v.minLength(${schema.minLength})`)
    return Type(`v.string`, null, constraints)
  }
  function Number(schema: Types.TNumber) {
    const constraints: string[] = []
    if (IsDefined<number>(schema.minimum)) constraints.push(`v.minValue(${schema.minimum})`)
    if (IsDefined<number>(schema.maximum)) constraints.push(`v.maxValue(${schema.maximum})`)
    if (IsDefined<number>(schema.exclusiveMinimum)) constraints.push(`v.minValue(${schema.exclusiveMinimum + 1})`)
    if (IsDefined<number>(schema.exclusiveMaximum)) constraints.push(`v.maxValue(${schema.exclusiveMaximum - 1})`)
    return Type('v.number', null, constraints)
  }
  function Object(schema: Types.TObject) {
    const properties = globalThis.Object.entries(schema.properties)
      .map(([key, value]) => {
        const optional = Types.TypeGuard.IsOptional(value)
        const union = Types.TypeGuard.IsUnion(value)
        const property = PropertyEncoder.Encode(key)

        if (optional) {
          if (!union) {
            return `${property}: v.optional(${Visit(value)})`
          }

          if (union) {
            const isUndefined = value.anyOf.find(Types.TypeGuard.IsUndefined)
            const isNull = value.anyOf.find(Types.TypeGuard.IsNull)

            if (isUndefined && isNull) {
              const a = Types.Exclude(value, Types.Undefined())
              const b = Types.Exclude(a, Types.Null())
              return `${property}: v.nullish(${Visit(b)})`
            }
          }
          const a = Types.Exclude(value, Types.Undefined())
          return `${property}: v.optional(${Visit(a)})`
        }

        if (!optional) {
          if (union) {
            const notUndefined = Types.TypeGuard.IsNever(Types.Extract(value, Types.Undefined()))
            const notNull = Types.TypeGuard.IsNever(Types.Extract(value, Types.Null()))
            if (!notUndefined && notNull) {
              const a = Types.Exclude(value, Types.Undefined())
              return `${property}: v.undefinedable(${Visit(a)})`
            }
            if (notUndefined && !notNull) {
              const a = Types.Exclude(value, Types.Null())
              return `${property}: ${Visit(value)}`
            }
          }
          return `${property}: ${Visit(value)}`
        }
      })
      .join(`,`)
    const constraints: string[] = []
    return Type(`v.object`, `{\n${properties}\n}`, constraints)
  }
  function Promise(schema: Types.TPromise) {
    return UnsupportedType(schema)
  }
  function Record(schema: Types.TRecord) {
    for (const [key, value] of globalThis.Object.entries(schema.patternProperties)) {
      const type = Visit(value)
      if (key === `^(0|[1-9][0-9]*)$`) {
        return Type('v.record', `v.number(), ${type}`, [])
      } else {
        return Type(`v.record`, `v.string(), ${type}`, [])
      }
    }
    throw Error(`Unreachable`)
  }
  function Ref(schema: Types.TRef) {
    if (!reference_map.has(schema.$ref!)) return UnsupportedType(schema)
    return schema.$ref
  }
  function This(schema: Types.TThis) {
    return UnsupportedType(schema)
  }
  function Tuple(schema: Types.TTuple) {
    if (schema.items === undefined) return `[]`
    const items = schema.items.map((schema) => Visit(schema)).join(`, `)
    return Type(`v.tuple`, `[${items}]`, [])
  }
  function TemplateLiteral(schema: Types.TTemplateLiteral) {
    const constaint = Type(`v.regex`, `/${schema.pattern}/`, [])
    return Type(`v.string`, null, [constaint])
  }
  function UInt8Array(schema: Types.TUint8Array): string {
    return UnsupportedType(schema)
  }
  function Undefined(schema: Types.TUndefined) {
    return Type(`v.undefined`, null, [])
  }
  function Union(schema: Types.TUnion) {
    const inner = schema.anyOf.map((schema) => Visit(schema)).join(`, `)
    return Type(`v.union`, `[${inner}]`, [])
  }
  function Unknown(schema: Types.TUnknown) {
    return Type(`v.unknown`, null, [])
  }
  function Void(schema: Types.TVoid) {
    return Type(`v.void`, null, [])
  }
  function UnsupportedType(schema: Types.TSchema) {
    return `v.any(/* unsupported */)`
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
  function GenerateType(model: TypeBoxModel, schema: Types.TSchema, references: Types.TSchema[]) {
    const output: string[] = []
    for (const reference of references) {
      if (reference.$id === undefined) return UnsupportedType(schema)
      reference_map.set(reference.$id, reference)
    }
    const type = Collect(schema)
    if (recursive_set.has(schema.$id!)) {
      output.push(`export ${ModelToTypeScript.GenerateType(model, schema.$id!)}`)
      output.push(`export const ${schema.$id || `T`}: v.InferOutput<${schema.$id}> = v.lazy(() => ${Formatter.Format(type)})`)
    } else {
      output.push(`export type ${schema.$id} = v.InferOutput<typeof ${schema.$id}>`)
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
    const buffer: string[] = [`import * as v from 'valibot'`, '']
    for (const type of model.types.filter((type) => Types.TypeGuard.IsSchema(type))) {
      buffer.push(GenerateType(model, type, model.types))
    }
    return Formatter.Format(buffer.join('\n'))
  }
}
