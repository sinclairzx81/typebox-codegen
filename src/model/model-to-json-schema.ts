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
import { Formatter } from '../formatter/formatter'
import { Value } from '@sinclair/typebox/value'

export namespace ModelToJsonSchema {
  // -----------------------------------------------------------------
  // Visited (Used to transform referenced schematics in JS references)
  // -----------------------------------------------------------------
  const map = new Map<string, bigint>()
  function Visited(value: unknown) {
    const hash = Value.Hash(value)
    for (const hash_ of map.values()) if (hash_ === hash) return true
    return false
  }
  function SetVisited(key: string, value: unknown) {
    map.set(key, Value.Hash(value))
  }
  function GetVisited(value: unknown): string | undefined {
    const hash = Value.Hash(value)
    for (const [key, hash_] of map) if (hash_ === hash) return key
    return undefined
  }
  // -----------------------------------------------------------------
  // Traversal
  // -----------------------------------------------------------------
  function IsArray(value: unknown): value is unknown[] {
    return globalThis.Array.isArray(value)
  }
  function IsObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !IsArray(value)
  }
  function Array(value: unknown[]): string {
    // prettier-ignore
    const elements = value.map((value) => Visit(value)).join(',')
    return `[${elements}]`
  }
  function Object(value: Record<string, unknown>) {
    // prettier-ignore
    const properties = globalThis.Object.keys(value).map((key) => `${key}: ${Visit(value[key])}`).join(', ')
    return `{ ${properties} }`
  }
  function Primitive(value: unknown): string {
    return typeof value === 'string' ? `"${value}"` : `${value}`
  }
  function Visit(value: any): string {
    if (Visited(value)) return GetVisited(value)!
    if (IsArray(value)) return Array(value)
    if (IsObject(value)) return Object(value)
    return Primitive(value)
  }
  export function Generate(model: TypeBoxModel): string {
    map.clear()
    const definitions: string[] = []
    for (const [key, schema] of model.exports) {
      if (typeof schema === 'function') continue
      definitions.push(`export const ${key} = ${Visit(schema)}`)
      SetVisited(key, schema)
    }
    return Formatter.Format(definitions.join('\n\n'))
  }
}
