import { TypeScriptToModel } from '@sinclair/typebox-codegen'
import { Type, TypeGuard, PatternStringExact } from '@sinclair/typebox'
import { Assert } from '../assert'
import { test } from 'node:test'

test('Indexer:StringKey', () => {
  const M = TypeScriptToModel.Generate(`
    type S = { x: number }
    type T = S['x']
  `)
  const T = M.exports.get('T') as any
  Assert.IsTrue(TypeGuard.IsNumber(T))
})
test('Indexer:NumberKey', () => {
  const M = TypeScriptToModel.Generate(`
    type S = { 0: number }
    type T = S[0]
  `)
  const T = M.exports.get('T') as any
  Assert.IsTrue(TypeGuard.IsNumber(T))
})
