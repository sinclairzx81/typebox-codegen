import { TypeScriptToModel } from '@sinclair/typebox-codegen'
import { Type, TypeGuard, PatternStringExact, TemplateLiteralGenerate, TTemplateLiteral } from '@sinclair/typebox'
import { Assert } from '../assert'
import { test } from 'node:test'

test('Model:Any', () => {
  const M = TypeScriptToModel.Generate(`type T = any`)
  const T = M.types.find((type) => type.$id === 'T') as any
  Assert.IsTrue(TypeGuard.IsAny(T))
})
test('Model:Array', () => {
  const M = TypeScriptToModel.Generate(`type T = number[]`)
  const T = M.types.find((type) => type.$id === 'T') as any
  Assert.IsTrue(TypeGuard.IsArray(T))
  Assert.IsTrue(TypeGuard.IsNumber(T.items))
})
test('Model:BigInt', () => {
  const M = TypeScriptToModel.Generate(`type T = bigint`)
  const T = M.types.find((type) => type.$id === 'T')
  Assert.IsTrue(TypeGuard.IsBigInt(T))
})
test('Model:Boolean', () => {
  const M = TypeScriptToModel.Generate(`type T = boolean`)
  const T = M.types.find((type) => type.$id === 'T')
  Assert.IsTrue(TypeGuard.IsBoolean(T))
})
test('Model:Date', () => {
  const M = TypeScriptToModel.Generate(`type T = Date`)
  const T = M.types.find((type) => type.$id === 'T')
  Assert.IsTrue(TypeGuard.IsDate(T))
})
test('Model:Uint8Array', () => {
  const M = TypeScriptToModel.Generate(`type T = Uint8Array`)
  const T = M.types.find((type) => type.$id === 'T')
  Assert.IsTrue(TypeGuard.IsUint8Array(T))
})
test('Model:String', () => {
  const M = TypeScriptToModel.Generate(`type T = string`)
  const T = M.types.find((type) => type.$id === 'T')
  Assert.IsTrue(TypeGuard.IsString(T))
})
test('Model:Number', () => {
  const M = TypeScriptToModel.Generate(`type T = number`)
  const T = M.types.find((type) => type.$id === 'T')
  Assert.IsTrue(TypeGuard.IsNumber(T))
})
test('Model:Symbol', () => {
  const M = TypeScriptToModel.Generate(`type T = symbol`)
  const T = M.types.find((type) => type.$id === 'T')
  Assert.IsTrue(TypeGuard.IsSymbol(T))
})
test('Model:Null', () => {
  const M = TypeScriptToModel.Generate(`type T = null`)
  const T = M.types.find((type) => type.$id === 'T')
  Assert.IsTrue(TypeGuard.IsNull(T))
})
test('Model:Never', () => {
  const M = TypeScriptToModel.Generate(`type T = never`)
  const T = M.types.find((type) => type.$id === 'T')
  Assert.IsTrue(TypeGuard.IsNever(T))
})
test('Model:Undefined', () => {
  const M = TypeScriptToModel.Generate(`type T = undefined`)
  const T = M.types.find((type) => type.$id === 'T')
  Assert.IsTrue(TypeGuard.IsUndefined(T))
})
test('Model:Void', () => {
  const M = TypeScriptToModel.Generate(`type T = void`)
  const T = M.types.find((type) => type.$id === 'T')
  Assert.IsTrue(TypeGuard.IsVoid(T))
})
test('Model:Tuple', () => {
  const M = TypeScriptToModel.Generate(`type T = [number, string]`)
  const T = M.types.find((type) => type.$id === 'T') as any
  Assert.IsTrue(TypeGuard.IsTuple(T))
  Assert.IsTrue(TypeGuard.IsNumber(T.items[0]))
  Assert.IsTrue(TypeGuard.IsString(T.items[1]))
})
test('Model:Object', () => {
  const M = TypeScriptToModel.Generate(`type T = { x: number, y: number }`)
  const T = M.types.find((type) => type.$id === 'T') as any
  Assert.IsTrue(TypeGuard.IsObject(T))
  Assert.IsTrue(TypeGuard.IsNumber(T.properties.x))
  Assert.IsTrue(TypeGuard.IsNumber(T.properties.y))
})
test('Model:Record', () => {
  const M = TypeScriptToModel.Generate(`type T = Record<string, number>`)
  const T = M.types.find((type) => type.$id === 'T') as any
  Assert.IsTrue(TypeGuard.IsRecord(T))
  Assert.IsTrue(TypeGuard.IsNumber(T.patternProperties[PatternStringExact]))
})
test('Model:Unknown', () => {
  const M = TypeScriptToModel.Generate(`type T = unknown`)
  const T = M.types.find((type) => type.$id === 'T') as any
  Assert.IsTrue(TypeGuard.IsUnknown(T))
})
test('Model:Promise', () => {
  const M = TypeScriptToModel.Generate(`type T = Promise<number>`)
  const T = M.types.find((type) => type.$id === 'T') as any
  Assert.IsTrue(TypeGuard.IsPromise(T))
  Assert.IsTrue(TypeGuard.IsNumber(T.item))
})
test('Model:Intersect 1', () => {
  const M = TypeScriptToModel.Generate(`type T = number & string`)
  const T = M.types.find((type) => type.$id === 'T') as any
  Assert.IsTrue(TypeGuard.IsIntersect(T))
  Assert.IsTrue(TypeGuard.IsNumber(T.allOf[0]))
  Assert.IsTrue(TypeGuard.IsString(T.allOf[1]))
})
test('Model:Intersect 2', () => {
  const M = TypeScriptToModel.Generate(`type T = { x: number } & { y: number }`)
  const T = M.types.find((type) => type.$id === 'T') as any
  Assert.IsTrue(TypeGuard.IsIntersect(T))
  Assert.IsTrue(TypeGuard.IsObject(T.allOf[0]))
  Assert.IsTrue(TypeGuard.IsObject(T.allOf[1]))
  Assert.IsTrue(TypeGuard.IsNumber(T.allOf[0].properties.x))
  Assert.IsTrue(TypeGuard.IsNumber(T.allOf[1].properties.y))
})
test('Model:Union 1', () => {
  const M = TypeScriptToModel.Generate(`type T = number | string`)
  const T = M.types.find((type) => type.$id === 'T') as any
  Assert.IsTrue(TypeGuard.IsUnion(T))
  Assert.IsTrue(TypeGuard.IsNumber(T.anyOf[0]))
  Assert.IsTrue(TypeGuard.IsString(T.anyOf[1]))
})
test('Model:Union 2', () => {
  const M = TypeScriptToModel.Generate(`type T = { x: number } | { y: number }`)
  const T = M.types.find((type) => type.$id === 'T') as any
  Assert.IsTrue(TypeGuard.IsUnion(T))
  Assert.IsTrue(TypeGuard.IsObject(T.anyOf[0]))
  Assert.IsTrue(TypeGuard.IsObject(T.anyOf[1]))
  Assert.IsTrue(TypeGuard.IsNumber(T.anyOf[0].properties.x))
  Assert.IsTrue(TypeGuard.IsNumber(T.anyOf[1].properties.y))
})
test('Model:Literal 1', () => {
  const M = TypeScriptToModel.Generate(`type T = 1`)
  const T = M.types.find((type) => type.$id === 'T') as any
  Assert.IsTrue(TypeGuard.IsLiteral(T))
  Assert.IsEqual(T.const, 1)
})
test('Model:Literal 2', () => {
  const M = TypeScriptToModel.Generate(`type T = 'hello'`)
  const T = M.types.find((type) => type.$id === 'T') as any
  Assert.IsTrue(TypeGuard.IsLiteral(T))
  Assert.IsEqual(T.const, 'hello')
})
test('Model:Literal 3', () => {
  const M = TypeScriptToModel.Generate(`type T = true`)
  const T = M.types.find((type) => type.$id === 'T') as any
  Assert.IsTrue(TypeGuard.IsLiteral(T))
  Assert.IsEqual(T.const, true)
})
test('Model:TemplateLiteral 1', () => {
  const M = TypeScriptToModel.Generate("type T = `on${'open' | 'close'}`")
  const T = M.types.find((type) => type.$id === 'T') as any
  Assert.IsTrue(TypeGuard.IsTemplateLiteral(T))
})
test('Model:TemplateLiteral 2', () => {
  const M = TypeScriptToModel.Generate("type T = `on${'open' | 'close'}`")
  const T = M.types.find((type) => type.$id === 'T') as TTemplateLiteral
  const G = TemplateLiteralGenerate(T) as string[]
  const U = Type.Union(G.map((value) => Type.Literal(value)))
  // not sure why we're testing for this, however Unions can no longer
  // accept TemplateLiterals as arguments in Revision 0.32.0. This may
  // need to be added back in depending on if the generation target
  // needs this functionality (I can't remember)
  Assert.IsTrue(TypeGuard.IsUnion(U))
  Assert.IsTrue(TypeGuard.IsLiteral(U.anyOf[0]))
  Assert.IsTrue(TypeGuard.IsLiteral(U.anyOf[1]))
  Assert.IsEqual(U.anyOf[0].const, 'onopen')
  Assert.IsEqual(U.anyOf[1].const, 'onclose')
})
test('Model:Function', () => {
  const M = TypeScriptToModel.Generate('type T = (a: number, b: string) => boolean')
  const T = M.types.find((type) => type.$id === 'T') as any
  Assert.IsTrue(TypeGuard.IsFunction(T))
  Assert.IsTrue(TypeGuard.IsNumber(T.parameters[0]))
  Assert.IsTrue(TypeGuard.IsString(T.parameters[1]))
  Assert.IsTrue(TypeGuard.IsBoolean(T.returns))
})
test('Model:Constructor', () => {
  const M = TypeScriptToModel.Generate('type T = new (a: number, b: string) => boolean')
  const T = M.types.find((type) => type.$id === 'T') as any
  Assert.IsTrue(TypeGuard.IsConstructor(T))
  Assert.IsTrue(TypeGuard.IsNumber(T.parameters[0]))
  Assert.IsTrue(TypeGuard.IsString(T.parameters[1]))
  Assert.IsTrue(TypeGuard.IsBoolean(T.returns))
})
test('Model:Mapped', () => {
  const M = TypeScriptToModel.Generate(`type T = {[K in \`\$\{'x' | 'y' | 'z'\}\` ]: string }`)
  const T = M.types.find((type) => type.$id === 'T') as any
  Assert.IsTrue(TypeGuard.IsObject(T))
  Assert.IsTrue(TypeGuard.IsString(T.properties.x))
  Assert.IsTrue(TypeGuard.IsString(T.properties.y))
  Assert.IsTrue(TypeGuard.IsString(T.properties.z))
  Assert.IsEqual(T.required.join(''), ['x', 'y', 'z'].join(''))
})
