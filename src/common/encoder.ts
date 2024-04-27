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

// --------------------------------------------------------------------------
// Character
// --------------------------------------------------------------------------
namespace Character {
  export function DollarSign(code: number) {
    return code === 36
  }
  export function IsUnderscore(code: number) {
    return code === 95
  }
  export function IsAlpha(code: number) {
    return (code >= 65 && code <= 90) || (code >= 97 && code <= 122)
  }
  export function IsNumeric(code: number) {
    return code >= 48 && code <= 57
  }
}
// --------------------------------------------------------------------------
// MemberExpressionEncoder
// --------------------------------------------------------------------------
export namespace MemberExpressionEncoder {
  function IsFirstCharacterNumeric(value: string) {
    if (value.length === 0) return false
    return Character.IsNumeric(value.charCodeAt(0))
  }
  function IsAccessor(value: string) {
    if (IsFirstCharacterNumeric(value)) return false
    for (let i = 0; i < value.length; i++) {
      const code = value.charCodeAt(i)
      const check = Character.IsAlpha(code) || Character.IsNumeric(code) || Character.DollarSign(code) || Character.IsUnderscore(code)
      if (!check) return false
    }
    return true
  }
  function EscapeHyphen(key: string) {
    return key.replace(/'/g, "\\'")
  }
  export function Encode(object: string, key: string) {
    return IsAccessor(key) ? `${object}.${key}` : `${object}['${EscapeHyphen(key)}']`
  }
}
// --------------------------------------------------------------------------
// PropertyEncoder
// --------------------------------------------------------------------------
export namespace PropertyEncoder {
  function IsFirstCharacterNumeric(value: string) {
    if (value.length === 0) return false
    return Character.IsNumeric(value.charCodeAt(0))
  }
  function IsAccessor(value: string) {
    if (IsFirstCharacterNumeric(value)) return false
    for (let i = 0; i < value.length; i++) {
      const code = value.charCodeAt(i)
      const check = Character.IsAlpha(code) || Character.IsNumeric(code) || Character.DollarSign(code) || Character.IsUnderscore(code)
      if (!check) return false
    }
    return true
  }
  function EscapeHyphen(key: string) {
    return key.replace(/'/g, "\\'")
  }
  export function Encode(key: string) {
    return IsAccessor(key) ? `${key}` : `'${EscapeHyphen(key)}'`
  }
}
