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

/** JSDoc Property Parser */
export namespace JsDoc {
  // ----------------------------------------------------------------
  // Quotes
  // ----------------------------------------------------------------
  function ConsumeQuote(content: string): [consumed: string, rest: string] {
    if (!IsQuote(content)) return ['', content]
    const quote = content[0]
    for (let i = 1; i < content.length; i++) {
      if (content[i] === quote) return [content.slice(1, i), content.slice(i)]
      if (content[i] === '\n') return [content.slice(1, i), content.slice(i)]
    }
    return [content.slice(1), '']
  }
  function IsQuote(content: string) {
    return content[0] === '"' || content[0] === "'"
  }
  // ----------------------------------------------------------------
  // Decode
  // ----------------------------------------------------------------
  function DecodeWithNonQuotedProperties(content: string): any {
    // todo: implement better inline object parser
    return content in globalThis ? content : new Function(`return (${content});`)()
  }
  function Decode(content: string) {
    try {
      return DecodeWithNonQuotedProperties(content)
    } catch {
      return content
    }
  }
  function* ParseValue(key: string, content: string): IterableIterator<[string, any]> {
    if (IsQuote(content)) {
      const [consumed, rest] = ConsumeQuote(content)
      yield [key, Decode(consumed)]
      return yield* ParseContent(rest)
    }
    for (let i = 0; i < content.length; i++) {
      if (content[i] === '\n' || content[i] === '-') {
        const value = content.slice(0, i).trim()
        const rest = content.slice(i)
        yield [key, Decode(value)]
        return yield* ParseContent(rest)
      }
    }
  }
  function* ParseKey(content: string): IterableIterator<[string, any]> {
    for (let i = 1; i < content.length; i++) {
      if (content[i] === ' ') {
        const key = content.slice(1, i)
        const rest = content.slice(i).trimStart()
        return yield* ParseValue(key, rest)
      }
    }
  }
  function* ParseContent(content: string): IterableIterator<[string, any]> {
    for (let i = 0; i < content.length; i++) {
      if (content[i] === '@') {
        return yield* ParseKey(content.slice(i))
      }
    }
  }
  export function Parse(content: string): Record<string, any> {
    const properties = [...ParseContent(content)]
    return properties.reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})
  }
}
