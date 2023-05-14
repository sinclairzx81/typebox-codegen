import * as assert from 'node:assert'

export namespace Assert {
  export function IsTrue(value: unknown): asserts value is true {
    assert.strictEqual(value, true)
  }
  export function IsFalse(value: unknown): asserts value is false {
    assert.strictEqual(value, false)
  }
  export function IsEqual(actual: unknown, expect: unknown) {
    return assert.strictEqual(actual, expect)
  }
  export function NotEqual(actual: unknown, expect: unknown) {
    return assert.notEqual(actual, expect)
  }
  export function IsDeepEqual(actual: unknown, expect: unknown) {
    if (actual instanceof Uint8Array && expect instanceof Uint8Array) {
      assert.equal(actual.length, expect.length)
      for (let i = 0; i < actual.length; i++) assert.equal(actual[i], expect[i])
    }
    return assert.deepEqual(actual, expect)
  }
  export function Throws(callback: Function) {
    try {
      callback()
    } catch {
      return
    }
    throw Error('Expected throw')
  }
  export async function ThrowsAsync(callback: Function) {
    try {
      await callback()
    } catch {
      return
    }
    throw Error('Expected throw')
  }
  export function isTypeOf(value: any, type: any) {
    if (typeof value === type) return
    throw Error(`Value is not typeof ${type}`)
  }
  export function isInstanceOf(value: any, constructor: any) {
    if (value instanceof constructor) return
    throw Error(`Value is not instance of ${constructor}`)
  }
}
