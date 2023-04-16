import { TypeScriptToModel } from '@sinclair/typebox/codegen'
import { Type, TypeGuard, PatternStringExact } from '@sinclair/typebox'
import { Assert } from '../assert'
import { test } from 'node:test'

test('Model:Any', () => {
  const M = TypeScriptToModel.Generate(`type T = any`)
  const T = M.exports.get('T') as any
  Assert.isTrue(TypeGuard.TAny(T))
})
test('Model:Array', () => {
  const M = TypeScriptToModel.Generate(`type T = number[]`)
  const T = M.exports.get('T') as any
  Assert.isTrue(TypeGuard.TArray(T))
  Assert.isTrue(TypeGuard.TNumber(T.items))
})
test('Model:BigInt', () => {
  const M = TypeScriptToModel.Generate(`type T = bigint`)
  const T = M.exports.get('T')
  Assert.isTrue(TypeGuard.TBigInt(T))
})
test('Model:Boolean', () => {
  const M = TypeScriptToModel.Generate(`type T = boolean`)
  const T = M.exports.get('T')
  Assert.isTrue(TypeGuard.TBoolean(T))
})
test('Model:Date', () => {
  const M = TypeScriptToModel.Generate(`type T = Date`)
  const T = M.exports.get('T')
  Assert.isTrue(TypeGuard.TDate(T))
})
test('Model:Uint8Array', () => {
  const M = TypeScriptToModel.Generate(`type T = Uint8Array`)
  const T = M.exports.get('T')
  Assert.isTrue(TypeGuard.TUint8Array(T))
})
test('Model:String', () => {
  const M = TypeScriptToModel.Generate(`type T = string`)
  const T = M.exports.get('T')
  Assert.isTrue(TypeGuard.TString(T))
})
test('Model:Number', () => {
  const M = TypeScriptToModel.Generate(`type T = number`)
  const T = M.exports.get('T')
  Assert.isTrue(TypeGuard.TNumber(T))
})
test('Model:Symbol', () => {
  const M = TypeScriptToModel.Generate(`type T = symbol`)
  const T = M.exports.get('T')
  Assert.isTrue(TypeGuard.TSymbol(T))
})
test('Model:Null', () => {
  const M = TypeScriptToModel.Generate(`type T = null`)
  const T = M.exports.get('T')
  Assert.isTrue(TypeGuard.TNull(T))
})
test('Model:Never', () => {
  const M = TypeScriptToModel.Generate(`type T = never`)
  const T = M.exports.get('T')
  Assert.isTrue(TypeGuard.TNever(T))
})
test('Model:Undefined', () => {
  const M = TypeScriptToModel.Generate(`type T = undefined`)
  const T = M.exports.get('T')
  Assert.isTrue(TypeGuard.TUndefined(T))
})
test('Model:Void', () => {
  const M = TypeScriptToModel.Generate(`type T = void`)
  const T = M.exports.get('T')
  Assert.isTrue(TypeGuard.TVoid(T))
})
test('Model:Tuple', () => {
  const M = TypeScriptToModel.Generate(`type T = [number, string]`)
  const T = M.exports.get('T') as any
  Assert.isTrue(TypeGuard.TTuple(T))
  Assert.isTrue(TypeGuard.TNumber(T.items[0]))
  Assert.isTrue(TypeGuard.TString(T.items[1]))
})
test('Model:Object', () => {
  const M = TypeScriptToModel.Generate(`type T = { x: number, y: number }`)
  const T = M.exports.get('T') as any
  Assert.isTrue(TypeGuard.TObject(T))
  Assert.isTrue(TypeGuard.TNumber(T.properties.x))
  Assert.isTrue(TypeGuard.TNumber(T.properties.y))
})
test('Model:Record', () => {
  const M = TypeScriptToModel.Generate(`type T = Record<string, number>`)
  const T = M.exports.get('T') as any
  Assert.isTrue(TypeGuard.TRecord(T))
  Assert.isTrue(TypeGuard.TNumber(T.patternProperties[PatternStringExact]))
})
test('Model:Unknown', () => {
  const M = TypeScriptToModel.Generate(`type T = unknown`)
  const T = M.exports.get('T') as any
  Assert.isTrue(TypeGuard.TUnknown(T))
})
test('Model:Promise', () => {
  const M = TypeScriptToModel.Generate(`type T = Promise<number>`)
  const T = M.exports.get('T') as any
  Assert.isTrue(TypeGuard.TPromise(T))
  Assert.isTrue(TypeGuard.TNumber(T.item))
})
test('Model:Intersect 1', () => {
  const M = TypeScriptToModel.Generate(`type T = number & string`)
  const T = M.exports.get('T') as any
  Assert.isTrue(TypeGuard.TIntersect(T))
  Assert.isTrue(TypeGuard.TNumber(T.allOf[0]))
  Assert.isTrue(TypeGuard.TString(T.allOf[1]))
})
test('Model:Intersect 2', () => {
  const M = TypeScriptToModel.Generate(`type T = { x: number } & { y: number }`)
  const T = M.exports.get('T') as any
  Assert.isTrue(TypeGuard.TIntersect(T))
  Assert.isTrue(TypeGuard.TObject(T.allOf[0]))
  Assert.isTrue(TypeGuard.TObject(T.allOf[1]))
  Assert.isTrue(TypeGuard.TNumber(T.allOf[0].properties.x))
  Assert.isTrue(TypeGuard.TNumber(T.allOf[1].properties.y))
})
test('Model:Union 1', () => {
  const M = TypeScriptToModel.Generate(`type T = number | string`)
  const T = M.exports.get('T') as any
  Assert.isTrue(TypeGuard.TUnion(T))
  Assert.isTrue(TypeGuard.TNumber(T.anyOf[0]))
  Assert.isTrue(TypeGuard.TString(T.anyOf[1]))
})
test('Model:Union 2', () => {
  const M = TypeScriptToModel.Generate(`type T = { x: number } | { y: number }`)
  const T = M.exports.get('T') as any
  Assert.isTrue(TypeGuard.TUnion(T))
  Assert.isTrue(TypeGuard.TObject(T.anyOf[0]))
  Assert.isTrue(TypeGuard.TObject(T.anyOf[1]))
  Assert.isTrue(TypeGuard.TNumber(T.anyOf[0].properties.x))
  Assert.isTrue(TypeGuard.TNumber(T.anyOf[1].properties.y))
})
test('Model:Literal 1', () => {
  const M = TypeScriptToModel.Generate(`type T = 1`)
  const T = M.exports.get('T') as any
  Assert.isTrue(TypeGuard.TLiteral(T))
  Assert.equal(T.const, 1)
})
test('Model:Literal 2', () => {
  const M = TypeScriptToModel.Generate(`type T = 'hello'`)
  const T = M.exports.get('T') as any
  Assert.isTrue(TypeGuard.TLiteral(T))
  Assert.equal(T.const, 'hello')
})
test('Model:Literal 3', () => {
  const M = TypeScriptToModel.Generate(`type T = true`)
  const T = M.exports.get('T') as any
  Assert.isTrue(TypeGuard.TLiteral(T))
  Assert.equal(T.const, true)
})
test('Model:TemplateLiteral 1', () => {
  const M = TypeScriptToModel.Generate("type T = `on${'open' | 'close'}`")
  const T = M.exports.get('T') as any
  Assert.isTrue(TypeGuard.TTemplateLiteral(T))
})
test('Model:TemplateLiteral 2', () => {
  const M = TypeScriptToModel.Generate("type T = `on${'open' | 'close'}`")
  const T = M.exports.get('T') as any
  const U = Type.Union(T)
  Assert.isTrue(TypeGuard.TUnion(U))
  Assert.isTrue(TypeGuard.TLiteral(U.anyOf[0]))
  Assert.isTrue(TypeGuard.TLiteral(U.anyOf[1]))
  Assert.equal(U.anyOf[0].const, 'onopen')
  Assert.equal(U.anyOf[1].const, 'onclose')
})
test('Model:Function', () => {
  const M = TypeScriptToModel.Generate('type T = (a: number, b: string) => boolean')
  const T = M.exports.get('T') as any
  Assert.isTrue(TypeGuard.TFunction(T))
  Assert.isTrue(TypeGuard.TNumber(T.parameters[0]))
  Assert.isTrue(TypeGuard.TString(T.parameters[1]))
  Assert.isTrue(TypeGuard.TBoolean(T.returns))
})
test('Model:Constructor', () => {
  const M = TypeScriptToModel.Generate('type T = new (a: number, b: string) => boolean')
  const T = M.exports.get('T') as any
  Assert.isTrue(TypeGuard.TConstructor(T))
  Assert.isTrue(TypeGuard.TNumber(T.parameters[0]))
  Assert.isTrue(TypeGuard.TString(T.parameters[1]))
  Assert.isTrue(TypeGuard.TBoolean(T.returns))
})
