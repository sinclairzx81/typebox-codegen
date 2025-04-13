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
// ModelToArkType
// --------------------------------------------------------------------------
export namespace ModelToArkType {
  // ------------------------------------------------------------------------
  // Constraints
  // ------------------------------------------------------------------------
  function Wrap(value: string) {
    return `'${value}'`
  }
  function Unwrap(value: string) {
    if (value.indexOf("'") !== 0) return value
    return value.slice(1, value.length - 1)
  }
  // ------------------------------------------------------------------------
  // Composite
  // ------------------------------------------------------------------------
  function IsTuple(types: string[]) {
    return types.some((type) => type.indexOf('[') === 0)
  }
  /**
   * Check if the type need to be wrapped in an api chain (`type(...).some()`)
   * Instead of string.
   */
  function IsApiChain(type: string) {
    return type.indexOf('type(') === 0
  }
  function ConstructUnionOrIntersect(types: string[], operator: '&' | '|') {
    function Reduce(types: string[]): string {
      if (types.length === 0) return ''
      const [left, ...right] = types
      return right.length > 0 ? `[${left}, '${operator}', ${Reduce(right)}]` : `${left}`
    }
    if (IsTuple(types)) {
      return Reduce(types)
    } else {
      // For some cases arktype cannot construct types from string literals,
      // i.e `{ [key: string]: any } | undefined` to `'{} | undefined'`.
      // Instead, create api chain `type({}).or('undefined')`.
      const [left, ...right] = types
      if (IsApiChain(left)) {
        let chainOperator = null
        if (operator === '&') {
          chainOperator = 'intersect'
        } else if (operator === '|') {
          chainOperator = 'or'
        }
        return [left, ...right.map((v) => `${chainOperator}(${v})`)].join('.')
      } else {
        const mapped = types.map((type) => Unwrap(type)).join(` ${operator} `)
        return Wrap(mapped)
      }
    }
  }
  // ------------------------------------------------------------------------
  // Constraints
  // ------------------------------------------------------------------------
  function ConstrainedSequenceType(type: string, options: { minimum?: number; maximum?: number }) {
    if (IsDefined<number>(options.minimum) && IsDefined<number>(options.maximum)) {
      return Wrap(`${options.minimum}<=${type}<=${options.maximum}`)
    } else if (IsDefined<number>(options.minimum)) {
      return Wrap(`${type}>=${options.minimum}`)
    } else if (IsDefined<number>(options.maximum)) {
      return Wrap(`${type}<=${options.maximum}`)
    } else {
      return Wrap(`${type}`)
    }
  }
  function ConstrainedNumericType(type: string, options: Types.NumberOptions | Types.BigIntOptions) {
    // prettier-ignore
    const minimum = IsDefined<number>(options.exclusiveMinimum) ? (options.exclusiveMinimum + 1) :
      IsDefined<number>(options.minimum) ? (options.minimum) :
        undefined
    // prettier-ignore
    const maximum = IsDefined<number>(options.exclusiveMaximum) ? (options.exclusiveMaximum - 1) :
      IsDefined<number>(options.maximum) ? (options.maximum) :
        undefined
    if (IsDefined<number>(minimum) && IsDefined<number>(maximum)) {
      return Wrap(`${minimum}<=${type}<=${maximum}`)
    } else if (IsDefined<number>(minimum)) {
      return Wrap(`${type}>=${minimum}`)
    } else if (IsDefined<number>(maximum)) {
      return Wrap(`${type}<=${maximum}`)
    } else {
      return Wrap(`${type}`)
    }
  }
  function IsDefined<T = any>(value: unknown): value is T {
    return value !== undefined
  }
  function Any(schema: Types.TAny) {
    return Wrap('any')
  }
  function Array(schema: Types.TArray) {
    const type = Visit(schema.items)
    const mapped = `${Unwrap(type)}[]`
    return ConstrainedSequenceType(mapped, {
      minimum: schema.minItems,
      maximum: schema.maxItems,
    })
  }
  function BigInt(schema: Types.TBigInt) {
    return Wrap('bigint')
  }
  function Boolean(schema: Types.TBoolean) {
    return Wrap('boolean')
  }
  function Constructor(schema: Types.TConstructor): string {
    return Wrap('Function')
  }
  function Date(schema: Types.TDate): string {
    return Wrap('Date')
  }
  function Function(schema: Types.TFunction) {
    return Wrap('Function')
  }
  function Integer(schema: Types.TInteger) {
    return ConstrainedNumericType('integer', schema)
  }
  function Intersect(schema: Types.TIntersect) {
    const types = schema.allOf.map((schema) => Collect(schema))
    return ConstructUnionOrIntersect(types, '&')
  }
  function Literal(schema: Types.TLiteral) {
    return typeof schema.const === 'string' ? Wrap(`"${schema.const}"`) : Wrap(schema.const.toString())
  }
  function Never(schema: Types.TNever) {
    return Wrap('never')
  }
  function Null(schema: Types.TNull) {
    return Wrap('null')
  }
  function String(schema: Types.TString) {
    return ConstrainedSequenceType('string', {
      minimum: schema.minLength,
      maximum: schema.maxLength,
    })
  }
  function Number(schema: Types.TNumber) {
    return ConstrainedNumericType('number', schema)
  }
  function Object(schema: Types.TObject) {
    const properties = globalThis.Object.entries(schema.properties)
      .map(([key, schema]) => {
        const optional = Types.TypeGuard.IsOptional(schema)
        const property1 = PropertyEncoder.Encode(key)
        const property2 = optional ? `'${property1}?'` : `${property1}`
        return `${property2}: ${Visit(schema)}`
      })
      .join(`,`)
    const buffer: string[] = []
    buffer.push(`type({\n${properties}\n})`)
    import_references.add('type')
    return buffer.join(`\n`)
  }
  function Promise(schema: Types.TPromise) {
    return Wrap('Promise')
  }
  function Record(schema: Types.TRecord) {
    return Wrap('never') // not sure how to express
  }
  function Ref(schema: Types.TRef) {
    return Wrap(schema.$ref)
  }
  function This(schema: Types.TThis) {
    return Wrap(schema.$ref)
  }
  function Tuple(schema: Types.TTuple) {
    if (schema.items === undefined) return `[]`
    const items = schema.items.map((schema) => Visit(schema)).join(`, `)
    return `[${items}]`
  }
  function TemplateLiteral(schema: Types.TTemplateLiteral) {
    return `/${schema.pattern}/`
  }
  function UInt8Array(schema: Types.TUint8Array): string {
    return `['instanceof', Uint8Array]`
  }
  function Undefined(schema: Types.TUndefined) {
    return Wrap('undefined')
  }
  function Union(schema: Types.TUnion) {
    const types = schema.anyOf.map((schema) => Collect(schema))
    return ConstructUnionOrIntersect(types, '|')
  }
  function Unknown(schema: Types.TUnknown) {
    return Wrap('unknown')
  }
  function Void(schema: Types.TVoid) {
    return Wrap('void')
  }
  function UnsupportedType(schema: Types.TSchema) {
    return Wrap('never')
  }
  function Visit(schema: Types.TSchema): string {
    if (schema.$id !== undefined) reference_map.set(schema.$id, schema)
    if (schema.$id !== undefined && emitted_types.has(schema.$id!)) return `'${schema.$id!}'`
    if (Types.TypeGuard.IsAny(schema)) return Any(schema)
    if (Types.TypeGuard.IsArray(schema)) return Array(schema)
    if (Types.TypeGuard.IsBigInt(schema)) return BigInt(schema)
    if (Types.TypeGuard.IsBoolean(schema)) return Boolean(schema)
    if (Types.TypeGuard.IsConstructor(schema)) return Constructor(schema)
    if (Types.TypeGuard.IsDate(schema)) return Date(schema)
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
  function GenerateType(schema: Types.TSchema, references: Types.TSchema[]) {
    const buffer: string[] = []
    for (const reference of references) {
      if (reference.$id === undefined) return UnsupportedType(schema)
      reference_map.set(reference.$id, reference)
    }
    const type = Collect(schema)
    buffer.push(`${schema.$id || `T`}: ${type}`)
    if (schema.$id) emitted_types.add(schema.$id)
    return buffer.join('\n')
  }
  const reference_map = new Map<string, Types.TSchema>()
  const emitted_types = new Set<string>()
  const import_references = new Set<string>()
  export function Generate(model: TypeBoxModel): string {
    reference_map.clear()
    emitted_types.clear()
    const buffer: string[] = []
    buffer.push('export const types = scope({')
    for (const type of model.types.filter((type) => Types.TypeGuard.IsSchema(type))) {
      buffer.push(`${GenerateType(type, model.types)},`)
    }
    buffer.push('}).export()')
    buffer.push('\n')
    for (const type of model.types.filter((type) => Types.TypeGuard.IsSchema(type))) {
      buffer.push(`export type ${type.$id} = typeof ${type.$id}.infer`)
      buffer.push(`export const ${type.$id} = types.${type.$id}`)
    }

    const imports = ['scope', ...import_references].join(',')
    buffer.unshift(`import { ${imports} } from 'arktype'`, '')
    import_references.clear()

    return Formatter.Format(buffer.join('\n'))
  }
}
