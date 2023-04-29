import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import * as prettier from 'prettier'
import { TypeScriptToTypeBox } from '@typebox/codegen'

const formatWithPrettier = (input: string): string => {
  return prettier.format(input, { parser: 'typescript' })
}

/**
 * Formats given input with prettier and returns the result. This is used for
 * testing to be able to compare generated types with expected types without
 * having to take care of formatting.
 * @throws Error
 **/
export const expectEqualIgnoreFormatting = (input1: string, input2: string): void => {
  assert.equal(formatWithPrettier(input1), formatWithPrettier(input2))
}

describe('ts2typebox - Typescript to Typebox', () => {
  describe('Primitives', () => {
    test('string', () => {
      const generatedTypebox = TypeScriptToTypeBox.Generate(`type T = string`)
      const expectedResult = `
      import { Type, Static } from "@sinclair/typebox";

      type T = Static<typeof T>;
      const T = Type.String();
      `
      expectEqualIgnoreFormatting(generatedTypebox, expectedResult)
    })
    test('number', () => {
      const generatedTypebox = TypeScriptToTypeBox.Generate(`type T = number`)
      const expectedResult = `
      import { Type, Static } from "@sinclair/typebox";

      type T = Static<typeof T>;
      const T = Type.Number();
      `
      expectEqualIgnoreFormatting(generatedTypebox, expectedResult)
    })
    test('boolean', () => {
      const generatedTypebox = TypeScriptToTypeBox.Generate(`type T = boolean`)
      const expectedResult = `
      import { Type, Static } from "@sinclair/typebox";

      type T = Static<typeof T>;
      const T = Type.Boolean();
      `
      expectEqualIgnoreFormatting(generatedTypebox, expectedResult)
    })
    test('any', () => {
      const generatedTypebox = TypeScriptToTypeBox.Generate(`type T = any`)
      const expectedResult = `
      import { Type, Static } from '@sinclair/typebox'

      type T = Static<typeof T>
      const T = Type.Any()
      `
      expectEqualIgnoreFormatting(generatedTypebox, expectedResult)
    })
    test('unknown', () => {
      const generatedTypebox = TypeScriptToTypeBox.Generate(`type T = unknown`)
      const expectedResult = `
      import { Type, Static } from "@sinclair/typebox";

      type T = Static<typeof T>;
      const T = Type.Unknown();
      `
      expectEqualIgnoreFormatting(generatedTypebox, expectedResult)
    })
    describe('Array', () => {
      test('Array<string>', () => {
        const generatedTypebox = TypeScriptToTypeBox.Generate(`type T = Array<string>`)
        const expectedResult = `
        import { Type, Static } from "@sinclair/typebox";

        type T = Static<typeof T>;
        const T = Type.Array(Type.String());
        `
        expectEqualIgnoreFormatting(generatedTypebox, expectedResult)
      })
      test('string[]', () => {
        const generatedTypebox = TypeScriptToTypeBox.Generate(`type T = string[]`)
        const expectedResult = `
        import { Type, Static } from "@sinclair/typebox";

        type T = Static<typeof T>;
        const T = Type.Array(Type.String());
        `
        expectEqualIgnoreFormatting(generatedTypebox, expectedResult)
      })
    })
    // TODO: Map, typeof, as, unions, literal types, etc..
    // TODO: Implement support for "Map"?
    // test('Map', () => {
    //   const generatedTypebox = TypeScriptToTypeBox.Generate(`type T = Map<number,string>`)
    //   expectEqualIgnoreFormatting(generatedTypebox, expectedResult)
    // })
  })
})
