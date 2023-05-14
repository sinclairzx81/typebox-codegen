import { TypeScriptToModel } from '@sinclair/typebox-codegen'
import { Type, TypeGuard, PatternStringExact } from '@sinclair/typebox'
import { Assert } from '../assert'
import { test } from 'node:test'

test('Model:Any', () => {
  const M = TypeScriptToModel.Generate(`type T = any`)
  const T = M.exports.get('T') as any
  Assert.IsTrue(TypeGuard.TAny(T))
})
test('Model:Array', () => {
  const M = TypeScriptToModel.Generate(`type T = number[]`)
  const T = M.exports.get('T') as any
  Assert.IsTrue(TypeGuard.TArray(T))
  Assert.IsTrue(TypeGuard.TNumber(T.items))
})
test('Model:BigInt', () => {
  const M = TypeScriptToModel.Generate(`type T = bigint`)
  const T = M.exports.get('T')
  Assert.IsTrue(TypeGuard.TBigInt(T))
})
test('Model:Boolean', () => {
  const M = TypeScriptToModel.Generate(`type T = boolean`)
  const T = M.exports.get('T')
  Assert.IsTrue(TypeGuard.TBoolean(T))
})
test('Model:Date', () => {
  const M = TypeScriptToModel.Generate(`type T = Date`)
  const T = M.exports.get('T')
  Assert.IsTrue(TypeGuard.TDate(T))
})
test('Model:Uint8Array', () => {
  const M = TypeScriptToModel.Generate(`type T = Uint8Array`)
  const T = M.exports.get('T')
  Assert.IsTrue(TypeGuard.TUint8Array(T))
})
test('Model:String', () => {
  const M = TypeScriptToModel.Generate(`type T = string`)
  const T = M.exports.get('T')
  Assert.IsTrue(TypeGuard.TString(T))
})
test('Model:Number', () => {
  const M = TypeScriptToModel.Generate(`type T = number`)
  const T = M.exports.get('T')
  Assert.IsTrue(TypeGuard.TNumber(T))
})
test('Model:Symbol', () => {
  const M = TypeScriptToModel.Generate(`type T = symbol`)
  const T = M.exports.get('T')
  Assert.IsTrue(TypeGuard.TSymbol(T))
})
test('Model:Null', () => {
  const M = TypeScriptToModel.Generate(`type T = null`)
  const T = M.exports.get('T')
  Assert.IsTrue(TypeGuard.TNull(T))
})
test('Model:Never', () => {
  const M = TypeScriptToModel.Generate(`type T = never`)
  const T = M.exports.get('T')
  Assert.IsTrue(TypeGuard.TNever(T))
})
test('Model:Undefined', () => {
  const M = TypeScriptToModel.Generate(`type T = undefined`)
  const T = M.exports.get('T')
  Assert.IsTrue(TypeGuard.TUndefined(T))
})
test('Model:Void', () => {
  const M = TypeScriptToModel.Generate(`type T = void`)
  const T = M.exports.get('T')
  Assert.IsTrue(TypeGuard.TVoid(T))
})
test('Model:Tuple', () => {
  const M = TypeScriptToModel.Generate(`type T = [number, string]`)
  const T = M.exports.get('T') as any
  Assert.IsTrue(TypeGuard.TTuple(T))
  Assert.IsTrue(TypeGuard.TNumber(T.items[0]))
  Assert.IsTrue(TypeGuard.TString(T.items[1]))
})
test('Model:Object', () => {
  const M = TypeScriptToModel.Generate(`type T = { x: number, y: number }`)
  const T = M.exports.get('T') as any
  Assert.IsTrue(TypeGuard.TObject(T))
  Assert.IsTrue(TypeGuard.TNumber(T.properties.x))
  Assert.IsTrue(TypeGuard.TNumber(T.properties.y))
})
test('Model:Record', () => {
  const M = TypeScriptToModel.Generate(`type T = Record<string, number>`)
  const T = M.exports.get('T') as any
  Assert.IsTrue(TypeGuard.TRecord(T))
  Assert.IsTrue(TypeGuard.TNumber(T.patternProperties[PatternStringExact]))
})
test('Model:Unknown', () => {
  const M = TypeScriptToModel.Generate(`type T = unknown`)
  const T = M.exports.get('T') as any
  Assert.IsTrue(TypeGuard.TUnknown(T))
})
test('Model:Promise', () => {
  const M = TypeScriptToModel.Generate(`type T = Promise<number>`)
  const T = M.exports.get('T') as any
  Assert.IsTrue(TypeGuard.TPromise(T))
  Assert.IsTrue(TypeGuard.TNumber(T.item))
})
test('Model:Intersect 1', () => {
  const M = TypeScriptToModel.Generate(`type T = number & string`)
  const T = M.exports.get('T') as any
  Assert.IsTrue(TypeGuard.TIntersect(T))
  Assert.IsTrue(TypeGuard.TNumber(T.allOf[0]))
  Assert.IsTrue(TypeGuard.TString(T.allOf[1]))
})
test('Model:Intersect 2', () => {
  const M = TypeScriptToModel.Generate(`type T = { x: number } & { y: number }`)
  const T = M.exports.get('T') as any
  Assert.IsTrue(TypeGuard.TIntersect(T))
  Assert.IsTrue(TypeGuard.TObject(T.allOf[0]))
  Assert.IsTrue(TypeGuard.TObject(T.allOf[1]))
  Assert.IsTrue(TypeGuard.TNumber(T.allOf[0].properties.x))
  Assert.IsTrue(TypeGuard.TNumber(T.allOf[1].properties.y))
})
test('Model:Union 1', () => {
  const M = TypeScriptToModel.Generate(`type T = number | string`)
  const T = M.exports.get('T') as any
  Assert.IsTrue(TypeGuard.TUnion(T))
  Assert.IsTrue(TypeGuard.TNumber(T.anyOf[0]))
  Assert.IsTrue(TypeGuard.TString(T.anyOf[1]))
})
test('Model:Union 2', () => {
  const M = TypeScriptToModel.Generate(`type T = { x: number } | { y: number }`)
  const T = M.exports.get('T') as any
  Assert.IsTrue(TypeGuard.TUnion(T))
  Assert.IsTrue(TypeGuard.TObject(T.anyOf[0]))
  Assert.IsTrue(TypeGuard.TObject(T.anyOf[1]))
  Assert.IsTrue(TypeGuard.TNumber(T.anyOf[0].properties.x))
  Assert.IsTrue(TypeGuard.TNumber(T.anyOf[1].properties.y))
})
test('Model:Literal 1', () => {
  const M = TypeScriptToModel.Generate(`type T = 1`)
  const T = M.exports.get('T') as any
  Assert.IsTrue(TypeGuard.TLiteral(T))
  Assert.IsEqual(T.const, 1)
})
test('Model:Literal 2', () => {
  const M = TypeScriptToModel.Generate(`type T = 'hello'`)
  const T = M.exports.get('T') as any
  Assert.IsTrue(TypeGuard.TLiteral(T))
  Assert.IsEqual(T.const, 'hello')
})
test('Model:Literal 3', () => {
  const M = TypeScriptToModel.Generate(`type T = true`)
  const T = M.exports.get('T') as any
  Assert.IsTrue(TypeGuard.TLiteral(T))
  Assert.IsEqual(T.const, true)
})
test('Model:TemplateLiteral 1', () => {
  const M = TypeScriptToModel.Generate("type T = `on${'open' | 'close'}`")
  const T = M.exports.get('T') as any
  Assert.IsTrue(TypeGuard.TTemplateLiteral(T))
})
test('Model:TemplateLiteral 2', () => {
  const M = TypeScriptToModel.Generate("type T = `on${'open' | 'close'}`")
  const T = M.exports.get('T') as any
  const U = Type.Union(T)
  Assert.IsTrue(TypeGuard.TUnion(U))
  Assert.IsTrue(TypeGuard.TLiteral(U.anyOf[0]))
  Assert.IsTrue(TypeGuard.TLiteral(U.anyOf[1]))
  Assert.IsEqual(U.anyOf[0].const, 'onopen')
  Assert.IsEqual(U.anyOf[1].const, 'onclose')
})
test('Model:Function', () => {
  const M = TypeScriptToModel.Generate('type T = (a: number, b: string) => boolean')
  const T = M.exports.get('T') as any
  Assert.IsTrue(TypeGuard.TFunction(T))
  Assert.IsTrue(TypeGuard.TNumber(T.parameters[0]))
  Assert.IsTrue(TypeGuard.TString(T.parameters[1]))
  Assert.IsTrue(TypeGuard.TBoolean(T.returns))
})
test('Model:Constructor', () => {
  const M = TypeScriptToModel.Generate('type T = new (a: number, b: string) => boolean')
  const T = M.exports.get('T') as any
  Assert.IsTrue(TypeGuard.TConstructor(T))
  Assert.IsTrue(TypeGuard.TNumber(T.parameters[0]))
  Assert.IsTrue(TypeGuard.TString(T.parameters[1]))
  Assert.IsTrue(TypeGuard.TBoolean(T.returns))
})
