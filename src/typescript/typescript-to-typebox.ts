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

import { JsDoc } from '../common/jsdoc'
import * as Ts from 'typescript'

export class TypeScriptToTypeBoxError extends Error {
  constructor(public readonly diagnostics: Ts.Diagnostic[]) {
    super('')
  }
}
// --------------------------------------------------------------------------
// TypeScriptToTypeBox
// --------------------------------------------------------------------------

export interface TypeScriptToTypeBoxOptions {
  /**
   * Setting this to true will ensure all types are exports as const values. This setting is
   * used by the TypeScriptToTypeBoxModel to gather TypeBox definitions during runtime eval
   * pass. The default is false
   */
  useExportEverything?: boolean
  /**
   * Specifies if the output code should specify a default `import` statement. For TypeScript
   * generated code this is typically desirable, but for Model generated code, the `Type`
   * build is passed in into scope as a variable. The default is true.
   */
  useTypeBoxImport?: boolean
  /**
   * Specifies if the output types should include an identifier associated with the assigned
   * variable name. This is useful for remapping model types to targets, but optional for
   * for TypeBox which can operate on vanilla JS references. The default is false.
   */
  useIdentifiers?: boolean
}
/** Generates TypeBox types from TypeScript code */
export namespace TypeScriptToTypeBox {
  // ------------------------------------------------------------------------------------------------------------
  // Transpile Options
  // ------------------------------------------------------------------------------------------------------------
  const transpilerOptions: Ts.TranspileOptions = {
    compilerOptions: {
      strict: true,
      target: Ts.ScriptTarget.ES2022,
    },
  }
  // ------------------------------------------------------------------------------------------------------------
  // Transpile States
  // ------------------------------------------------------------------------------------------------------------
  // (auto) tracked on calls to find type name
  const typenames = new Set<string>()
  // (auto) tracked for recursive types and used to associate This type references
  let recursiveDeclaration: Ts.TypeAliasDeclaration | Ts.InterfaceDeclaration | null = null
  // (auto) tracked for scoped block level definitions and used to prevent `export` emit when not in global scope.
  let blockLevel: number = 0
  // (auto) tracked for injecting typebox import statements
  let useImports = false
  // (auto) tracked for injecting JSON schema optios
  let useOptions = false
  // (auto) tracked for injecting TSchema import statements
  let useGenerics = false
  // (auto) tracked for cases where composition requires deep clone
  let useCloneType = false
  // (option) export override to ensure all schematics
  let useExportsEverything = false
  // (option) inject identifiers
  let useIdentifiers = false
  // (option) specifies if typebox imports should be included
  let useTypeBoxImport = true
  // ------------------------------------------------------------------------------------------------------------
  // AST Query
  // ------------------------------------------------------------------------------------------------------------
  function FindRecursiveParent(decl: Ts.InterfaceDeclaration | Ts.TypeAliasDeclaration, node: Ts.Node): boolean {
    return (Ts.isTypeReferenceNode(node) && decl.name.getText() === node.typeName.getText()) || node.getChildren().some((node) => FindRecursiveParent(decl, node))
  }
  function FindRecursiveThis(node: Ts.Node): boolean {
    return node.getChildren().some((node) => Ts.isThisTypeNode(node) || FindRecursiveThis(node))
  }
  function FindTypeName(node: Ts.Node, name: string): boolean {
    const found =
      typenames.has(name) ||
      node.getChildren().some((node) => {
        return ((Ts.isInterfaceDeclaration(node) || Ts.isTypeAliasDeclaration(node)) && node.name.getText() === name) || FindTypeName(node, name)
      })
    if (found) typenames.add(name)
    return found
  }
  function IsRecursiveType(decl: Ts.InterfaceDeclaration | Ts.TypeAliasDeclaration) {
    const check1 = Ts.isTypeAliasDeclaration(decl) ? [decl.type].some((node) => FindRecursiveParent(decl, node)) : decl.members.some((node) => FindRecursiveParent(decl, node))
    const check2 = Ts.isInterfaceDeclaration(decl) && FindRecursiveThis(decl)
    return check1 || check2
  }
  function IsReadonlyProperty(node: Ts.PropertySignature): boolean {
    return node.modifiers !== undefined && node.modifiers.find((modifier) => modifier.getText() === 'readonly') !== undefined
  }
  function IsOptionalProperty(node: Ts.PropertySignature) {
    return node.questionToken !== undefined
  }
  function IsOptionalParameter(node: Ts.ParameterDeclaration) {
    return node.questionToken !== undefined
  }
  function IsExport(node: Ts.InterfaceDeclaration | Ts.TypeAliasDeclaration | Ts.EnumDeclaration | Ts.ModuleDeclaration): boolean {
    return blockLevel === 0 && (useExportsEverything || (node.modifiers !== undefined && node.modifiers.find((modifier) => modifier.getText() === 'export') !== undefined))
  }
  function IsNamespace(node: Ts.ModuleDeclaration) {
    return node.flags === Ts.NodeFlags.Namespace
  }
  // ------------------------------------------------------------------------------------------------------------
  // Options
  // ------------------------------------------------------------------------------------------------------------
  function ResolveJsDocComment(node: Ts.TypeAliasDeclaration | Ts.PropertySignature | Ts.InterfaceDeclaration): string {
    const content = node.getFullText().trim()
    const indices = [content.indexOf('/**'), content.indexOf('type'), content.indexOf('interface')].map((n) => (n === -1 ? Infinity : n))
    if (indices[0] === -1 || indices[1] < indices[0] || indices[2] < indices[0]) return '' // no comment or declaration before comment
    for (let i = indices[0]; i < content.length; i++) {
      if (content[i] === '*' && content[i + 1] === '/') return content.slice(0, i + 2)
    }
    return ''
  }
  function ResolveOptions(node: Ts.TypeAliasDeclaration | Ts.PropertySignature | Ts.InterfaceDeclaration): Record<string, unknown> {
    const content = ResolveJsDocComment(node)
    return JsDoc.Parse(content)
  }
  // ------------------------------------------------------------------------------------------------------------
  // Identifiers
  // ------------------------------------------------------------------------------------------------------------
  function ResolveIdentifier(node: Ts.InterfaceDeclaration | Ts.TypeAliasDeclaration) {
    function* resolve(node: Ts.Node): IterableIterator<string> {
      if (node.parent) yield* resolve(node.parent)
      if (Ts.isModuleDeclaration(node)) yield node.name.getText()
    }
    return [...resolve(node), node.name.getText()].join('.')
  }
  function UnwrapModifier(type: string) {
    for (let i = 0; i < type.length; i++) if (type[i] === '(') return type.slice(i + 1, type.length - 1)
    return type
  }
  // Note: This function is only called when 'useIdentifiers' is true. What we're trying to achieve with
  // identifier injection is a referential type model over the default inline model. For the purposes of
  // code generation, we tend to prefer referential types as these can be both inlined or referenced in
  // the codegen target; and where different targets may have different referential requirements. It
  // should be possible to implement a more robust injection mechanism however. For review.
  // prettier-ignore
  function InjectOptions(type: string, options: Record<string, unknown>): string {
    if (globalThis.Object.keys(options).length === 0) return type
    // unwrap for modifiers
    if (type.indexOf('Type.ReadonlyOptional') === 0) return `Type.ReadonlyOptional( ${InjectOptions(UnwrapModifier(type), options)} )`
    if (type.indexOf('Type.Readonly') === 0) return `Type.Readonly( ${InjectOptions(UnwrapModifier(type), options)} )`
    if (type.indexOf('Type.Optional') === 0) return `Type.Optional( ${InjectOptions(UnwrapModifier(type), options)} )`
    const encoded = JSON.stringify(options)
    // indexer type
    if (type.lastIndexOf(']') === type.length - 1) useCloneType = true
    if (type.lastIndexOf(']') === type.length - 1) return `CloneType(${type}, ${encoded})`
    // referenced type
    if (type.indexOf('(') === -1) { useCloneType = true; return `CloneType(${type}, ${encoded})` }
    if (type.lastIndexOf('()') === type.length - 2) return type.slice(0, type.length - 1) + `${encoded})`
    if (type.lastIndexOf('})') === type.length - 2) return type.slice(0, type.length - 1) + `, ${encoded})`
    if (type.lastIndexOf('])') === type.length - 2) return type.slice(0, type.length - 1) + `, ${encoded})`
    if (type.lastIndexOf(')') === type.length - 1) return type.slice(0, type.length - 1) + `, ${encoded})`
    return type
  }
  // ------------------------------------------------------------------------------------------------------------
  // Nodes
  // ------------------------------------------------------------------------------------------------------------
  function* SourceFile(node: Ts.SourceFile): IterableIterator<string> {
    for (const next of node.getChildren()) {
      yield* Visit(next)
    }
  }
  function* PropertySignature(node: Ts.PropertySignature): IterableIterator<string> {
    const [readonly, optional] = [IsReadonlyProperty(node), IsOptionalProperty(node)]
    const options = ResolveOptions(node)
    const type_0 = Collect(node.type)
    const type_1 = InjectOptions(type_0, options)
    if (readonly && optional) {
      return yield `${node.name.getText()}: Type.ReadonlyOptional(${type_1})`
    } else if (readonly) {
      return yield `${node.name.getText()}: Type.Readonly(${type_1})`
    } else if (optional) {
      return yield `${node.name.getText()}: Type.Optional(${type_1})`
    } else {
      return yield `${node.name.getText()}: ${type_1}`
    }
  }
  function* ArrayTypeNode(node: Ts.ArrayTypeNode): IterableIterator<string> {
    const type = Collect(node.elementType)
    yield `Type.Array(${type})`
  }
  function* Block(node: Ts.Block): IterableIterator<string> {
    blockLevel += 1
    const statments = node.statements.map((statement) => Collect(statement)).join('\n\n')
    blockLevel -= 1
    yield `{\n${statments}\n}`
  }
  function* TupleTypeNode(node: Ts.TupleTypeNode): IterableIterator<string> {
    const types = node.elements.map((type) => Collect(type)).join(',\n')
    yield `Type.Tuple([\n${types}\n])`
  }
  function* UnionTypeNode(node: Ts.UnionTypeNode): IterableIterator<string> {
    const types = node.types.map((type) => Collect(type)).join(',\n')
    yield `Type.Union([\n${types}\n])`
  }
  function* MappedTypeNode(node: Ts.MappedTypeNode): IterableIterator<string> {
    const K = Collect(node.typeParameter)
    const T = Collect(node.type)
    const C = Collect(node.typeParameter.constraint)
    const readonly = node.readonlyToken !== undefined
    const optional = node.questionToken !== undefined
    const readonly_subtractive = readonly && Ts.isMinusToken(node.readonlyToken)
    const optional_subtractive = optional && Ts.isMinusToken(node.questionToken)
    // prettier-ignore
    return yield (
      (readonly && optional) ? (
        (readonly_subtractive && optional_subtractive) ? `Type.Mapped(${C}, ${K} => Type.Readonly(Type.Optional(${T}, false), false))` :
        (readonly_subtractive) ? `Type.Mapped(${C}, ${K} => Type.Readonly(Type.Optional(${T}), false))` :
        (optional_subtractive) ? `Type.Mapped(${C}, ${K} => Type.Readonly(Type.Optional(${T}, false)))` :
        `Type.Mapped(${C}, ${K} => Type.Readonly(Type.Optional(${T})))`
      ) : (readonly) ? (
        readonly_subtractive 
          ? `Type.Mapped(${C}, ${K} => Type.Readonly(${T}, false))` 
          : `Type.Mapped(${C}, ${K} => Type.Readonly(${T}))`
      ) : (optional) ? (
        optional_subtractive 
          ? `Type.Mapped(${C}, ${K} => Type.Optional(${T}, false))` 
          : `Type.Mapped(${C}, ${K} => Type.Optional(${T}))`
      ) : `Type.Mapped(${C}, ${K} => ${T})`
    )
  }
  function* MethodSignature(node: Ts.MethodSignature): IterableIterator<string> {
    const parameters = node.parameters.map((parameter) => (parameter.dotDotDotToken !== undefined ? `...Type.Rest(${Collect(parameter)})` : Collect(parameter))).join(', ')
    const returnType = node.type === undefined ? `Type.Unknown()` : Collect(node.type)
    yield `${node.name.getText()}: Type.Function([${parameters}], ${returnType})`
  }
  // prettier-ignore
  function* TemplateLiteralTypeNode(node: Ts.TemplateLiteralTypeNode) {
    const collect = node.getChildren().map(node => Collect(node)).join('')
    yield `Type.TemplateLiteral([${collect.slice(0, collect.length - 2)}])` // can't remove trailing here
  }
  // prettier-ignore
  function* TemplateLiteralTypeSpan(node: Ts.TemplateLiteralTypeSpan) {
    const collect = node.getChildren().map(node => Collect(node)).join(', ')
    if (collect.length > 0) yield `${collect}`
  }
  function* TemplateHead(node: Ts.TemplateHead) {
    if (node.text.length > 0) yield `Type.Literal('${node.text}'), `
  }
  function* TemplateMiddle(node: Ts.TemplateMiddle) {
    if (node.text.length > 0) yield `Type.Literal('${node.text}'), `
  }
  function* TemplateTail(node: Ts.TemplateTail) {
    if (node.text.length > 0) yield `Type.Literal('${node.text}'), `
  }
  function* ThisTypeNode(node: Ts.ThisTypeNode) {
    yield `This`
  }
  function* IntersectionTypeNode(node: Ts.IntersectionTypeNode): IterableIterator<string> {
    const types = node.types.map((type) => Collect(type)).join(',\n')
    yield `Type.Intersect([\n${types}\n])`
  }
  function* TypeOperatorNode(node: Ts.TypeOperatorNode): IterableIterator<string> {
    if (node.operator === Ts.SyntaxKind.KeyOfKeyword) {
      const type = Collect(node.type)
      yield `Type.KeyOf(${type})`
    }
    if (node.operator === Ts.SyntaxKind.ReadonlyKeyword) {
      yield `Type.Readonly(${Collect(node.type)})`
    }
  }
  function* Parameter(node: Ts.ParameterDeclaration): IterableIterator<string> {
    yield IsOptionalParameter(node) ? `Type.Optional(${Collect(node.type)})` : Collect(node.type)
  }
  function* FunctionTypeNode(node: Ts.FunctionTypeNode): IterableIterator<string> {
    const parameters = node.parameters.map((parameter) => (parameter.dotDotDotToken !== undefined ? `...Type.Rest(${Collect(parameter)})` : Collect(parameter))).join(', ')
    const returns = Collect(node.type)
    yield `Type.Function([${parameters}], ${returns})`
  }
  function* ConstructorTypeNode(node: Ts.ConstructorTypeNode): IterableIterator<string> {
    const parameters = node.parameters.map((param) => Collect(param)).join(', ')
    const returns = Collect(node.type)
    yield `Type.Constructor([${parameters}], ${returns})`
  }
  function* EnumDeclaration(node: Ts.EnumDeclaration): IterableIterator<string> {
    useImports = true
    const exports = IsExport(node) ? 'export ' : ''
    const members = node.members.map((member) => member.getText()).join(', ')
    const enumType = `${exports}enum Enum${node.name.getText()} { ${members} }`
    const staticType = `${exports}type ${node.name.getText()} = Static<typeof ${node.name.getText()}>`
    const type = `${exports}const ${node.name.getText()} = Type.Enum(Enum${node.name.getText()})`
    yield [enumType, '', staticType, type].join('\n')
  }
  function PropertiesFromTypeElementArray(members: Ts.NodeArray<Ts.TypeElement>): string {
    const properties = members.filter((member) => !Ts.isIndexSignatureDeclaration(member))
    const indexers = members.filter((member) => Ts.isIndexSignatureDeclaration(member))
    const propertyCollect = properties.map((property) => Collect(property)).join(',\n')
    const indexer = indexers.length > 0 ? Collect(indexers[indexers.length - 1]) : ''
    if (properties.length === 0 && indexer.length > 0) {
      return `{},\n{\nadditionalProperties: ${indexer}\n }`
    } else if (properties.length > 0 && indexer.length > 0) {
      return `{\n${propertyCollect}\n},\n{\nadditionalProperties: ${indexer}\n }`
    } else {
      return `{\n${propertyCollect}\n}`
    }
  }
  function* TypeLiteralNode(node: Ts.TypeLiteralNode): IterableIterator<string> {
    const members = PropertiesFromTypeElementArray(node.members)
    yield* `Type.Object(${members})`
  }
  function* InterfaceDeclaration(node: Ts.InterfaceDeclaration): IterableIterator<string> {
    useImports = true
    const isRecursiveType = IsRecursiveType(node)
    if (isRecursiveType) recursiveDeclaration = node
    const heritage = node.heritageClauses !== undefined ? node.heritageClauses.flatMap((node) => Collect(node)) : []
    if (node.typeParameters) {
      useGenerics = true
      const exports = IsExport(node) ? 'export ' : ''
      const identifier = ResolveIdentifier(node)
      const options = useIdentifiers ? { ...ResolveOptions(node), $id: identifier } : { ...ResolveOptions(node) }
      const constraints = node.typeParameters.map((param) => `${Collect(param)} extends TSchema`).join(', ')
      const parameters = node.typeParameters.map((param) => `${Collect(param)}: ${Collect(param)}`).join(', ')
      const members = PropertiesFromTypeElementArray(node.members)
      const names = node.typeParameters.map((param) => `${Collect(param)}`).join(', ')
      const staticDeclaration = `${exports}type ${node.name.getText()}<${constraints}> = Static<ReturnType<typeof ${node.name.getText()}<${names}>>>`
      const rawTypeExpression = IsRecursiveType(node) ? `Type.Recursive(This => Type.Object(${members}))` : `Type.Object(${members})`
      const typeExpression = heritage.length === 0 ? rawTypeExpression : `Type.Composite([${heritage.join(', ')}, ${rawTypeExpression}])`
      const type = InjectOptions(typeExpression, options)
      const typeDeclaration = `${exports}const ${node.name.getText()} = <${constraints}>(${parameters}) => ${type}`
      yield `${staticDeclaration}\n${typeDeclaration}`
    } else {
      const exports = IsExport(node) ? 'export ' : ''
      const identifier = ResolveIdentifier(node)
      const options = useIdentifiers ? { ...ResolveOptions(node), $id: identifier } : { ...ResolveOptions(node) }
      const members = PropertiesFromTypeElementArray(node.members)
      const staticDeclaration = `${exports}type ${node.name.getText()} = Static<typeof ${node.name.getText()}>`
      const rawTypeExpression = IsRecursiveType(node) ? `Type.Recursive(This => Type.Object(${members}))` : `Type.Object(${members})`
      const typeExpression = heritage.length === 0 ? rawTypeExpression : `Type.Composite([${heritage.join(', ')}, ${rawTypeExpression}])`
      const type = InjectOptions(typeExpression, options)
      const typeDeclaration = `${exports}const ${node.name.getText()} = ${type}`
      yield `${staticDeclaration}\n${typeDeclaration}`
    }
    recursiveDeclaration = null
  }
  function* TypeAliasDeclaration(node: Ts.TypeAliasDeclaration): IterableIterator<string> {
    useImports = true
    const isRecursiveType = IsRecursiveType(node)
    if (isRecursiveType) recursiveDeclaration = node
    // Generics case
    if (node.typeParameters) {
      useGenerics = true
      const exports = IsExport(node) ? 'export ' : ''
      const options = useIdentifiers ? { $id: ResolveIdentifier(node) } : {}
      const constraints = node.typeParameters.map((param) => `${Collect(param)} extends TSchema`).join(', ')
      const parameters = node.typeParameters.map((param) => `${Collect(param)}: ${Collect(param)}`).join(', ')
      const type_0 = Collect(node.type)
      const type_1 = isRecursiveType ? `Type.Recursive(This => ${type_0})` : type_0
      const type_2 = InjectOptions(type_1, options)
      const names = node.typeParameters.map((param) => Collect(param)).join(', ')
      const staticDeclaration = `${exports}type ${node.name.getText()}<${constraints}> = Static<ReturnType<typeof ${node.name.getText()}<${names}>>>`
      const typeDeclaration = `${exports}const ${node.name.getText()} = <${constraints}>(${parameters}) => ${type_2}`
      yield `${staticDeclaration}\n${typeDeclaration}`
    } else {
      const exports = IsExport(node) ? 'export ' : ''
      const options = useIdentifiers ? { $id: ResolveIdentifier(node), ...ResolveOptions(node) } : { ...ResolveOptions(node) }
      const type_0 = Collect(node.type)
      const type_1 = isRecursiveType ? `Type.Recursive(This => ${type_0})` : type_0
      const type_2 = InjectOptions(type_1, options)
      const staticDeclaration = `${exports}type ${node.name.getText()} = Static<typeof ${node.name.getText()}>`
      const typeDeclaration = `${exports}const ${node.name.getText()} = ${type_2}`
      yield `${staticDeclaration}\n${typeDeclaration}`
    }
    recursiveDeclaration = null
  }
  function* HeritageClause(node: Ts.HeritageClause): IterableIterator<string> {
    const types = node.types.map((node) => Collect(node))
    // Note: Heritage clauses are only used in interface extends cases. We expect the
    // outer type to be a Composite, and where this type will be prepended before the
    // interface definition.
    yield types.join(', ')
  }
  function* IndexedAccessType(node: Ts.IndexedAccessTypeNode): IterableIterator<string> {
    const obj = node.objectType.getText()
    const key = Collect(node.indexType)
    yield `Type.Index(${obj}, ${key})`
  }
  function* ExpressionWithTypeArguments(node: Ts.ExpressionWithTypeArguments): IterableIterator<string> {
    const name = Collect(node.expression)
    const typeArguments = node.typeArguments === undefined ? [] : node.typeArguments.map((node) => Collect(node))
    // todo: default type argument (resolve `= number` from `type Foo<T = number>`)
    return yield typeArguments.length === 0 ? `${name}` : `${name}(${typeArguments.join(', ')})`
  }
  function* TypeParameterDeclaration(node: Ts.TypeParameterDeclaration): IterableIterator<string> {
    yield node.name.getText()
  }
  function* ParenthesizedTypeNode(node: Ts.ParenthesizedTypeNode): IterableIterator<string> {
    yield Collect(node.type)
  }
  function* PropertyAccessExpression(node: Ts.PropertyAccessExpression): IterableIterator<string> {
    yield node.getText()
  }
  function* RestTypeNode(node: Ts.RestTypeNode): IterableIterator<string> {
    yield `...Type.Rest(${node.type.getText()})`
  }
  function* ConditionalTypeNode(node: Ts.ConditionalTypeNode): IterableIterator<string> {
    const checkType = Collect(node.checkType)
    const extendsType = Collect(node.extendsType)
    const trueType = Collect(node.trueType)
    const falseType = Collect(node.falseType)
    yield `Type.Extends(${checkType}, ${extendsType}, ${trueType}, ${falseType})`
  }
  function* isIndexSignatureDeclaration(node: Ts.IndexSignatureDeclaration) {
    // note: we ignore the key and just return the type. this is a mismatch between
    // object and record types. Address in TypeBox by unifying validation paths
    // for objects and record types.
    yield Collect(node.type)
  }
  function* TypeReferenceNode(node: Ts.TypeReferenceNode): IterableIterator<string> {
    const name = node.typeName.getText()
    const args = node.typeArguments ? `(${node.typeArguments.map((type) => Collect(type)).join(', ')})` : ''
    // --------------------------------------------------------------
    // Instance Types
    // --------------------------------------------------------------
    if (name === 'Date') return yield `Type.Date()`
    if (name === 'Uint8Array') return yield `Type.Uint8Array()`
    if (name === 'String') return yield `Type.String()`
    if (name === 'Number') return yield `Type.Number()`
    if (name === 'Boolean') return yield `Type.Boolean()`
    if (name === 'Function') return yield `Type.Function([], Type.Unknown())`
    // --------------------------------------------------------------
    // Types
    // --------------------------------------------------------------
    if (name === 'Array') return yield `Type.Array${args}`
    if (name === 'Record') return yield `Type.Record${args}`
    if (name === 'Partial') return yield `Type.Partial${args}`
    if (name === 'Required') return yield `Type.Required${args}`
    if (name === 'Omit') return yield `Type.Omit${args}`
    if (name === 'Pick') return yield `Type.Pick${args}`
    if (name === 'Promise') return yield `Type.Promise${args}`
    if (name === 'ReturnType') return yield `Type.ReturnType${args}`
    if (name === 'InstanceType') return yield `Type.InstanceType${args}`
    if (name === 'Parameters') return yield `Type.Parameters${args}`
    if (name === 'AsyncIterableIterator') return yield `Type.AsyncIterator${args}`
    if (name === 'IterableIterator') return yield `Type.Iterator${args}`
    if (name === 'ConstructorParameters') return yield `Type.ConstructorParameters${args}`
    if (name === 'Exclude') return yield `Type.Exclude${args}`
    if (name === 'Extract') return yield `Type.Extract${args}`
    if (name === 'Awaited') return yield `Type.Awaited${args}`
    if (name === 'Uppercase') return yield `Type.Uppercase${args}`
    if (name === 'Lowercase') return yield `Type.Lowercase${args}`
    if (name === 'Capitalize') return yield `Type.Capitalize${args}`
    if (name === 'Uncapitalize') return yield `Type.Uncapitalize${args}`
    if (recursiveDeclaration !== null && FindRecursiveParent(recursiveDeclaration, node)) return yield `This`
    if (FindTypeName(node.getSourceFile(), name) && args.length === 0 /** non-resolvable */) {
      return yield `${name}${args}`
    }
    if (name in globalThis) return yield `Type.Never()`
    return yield `${name}${args}`
  }
  function* LiteralTypeNode(node: Ts.LiteralTypeNode): IterableIterator<string> {
    const text = node.getText()
    if (text === 'null') return yield `Type.Null()`
    yield `Type.Literal(${node.getText()})`
  }
  function* NamedTupleMember(node: Ts.NamedTupleMember): IterableIterator<string> {
    yield* Collect(node.type)
  }
  function* ModuleDeclaration(node: Ts.ModuleDeclaration): IterableIterator<string> {
    const export_specifier = IsExport(node) ? 'export ' : ''
    const module_specifier = IsNamespace(node) ? 'namespace' : 'module'
    yield `${export_specifier}${module_specifier} ${node.name.getText()} {`
    yield* Visit(node.body)
    yield `}`
  }
  function* ModuleBlock(node: Ts.ModuleBlock): IterableIterator<string> {
    for (const statement of node.statements) {
      yield* Visit(statement)
    }
  }
  function* FunctionDeclaration(node: Ts.FunctionDeclaration): IterableIterator<string> {
    // ignore
  }
  function* ClassDeclaration(node: Ts.ClassDeclaration): IterableIterator<string> {
    // ignore
  }
  function Collect(node: Ts.Node | undefined): string {
    return `${[...Visit(node)].join('')}`
  }
  function* Visit(node: Ts.Node | undefined): IterableIterator<string> {
    if (node === undefined) return
    if (Ts.isArrayTypeNode(node)) return yield* ArrayTypeNode(node)
    if (Ts.isBlock(node)) return yield* Block(node)
    if (Ts.isClassDeclaration(node)) return yield* ClassDeclaration(node)
    if (Ts.isConditionalTypeNode(node)) return yield* ConditionalTypeNode(node)
    if (Ts.isConstructorTypeNode(node)) return yield* ConstructorTypeNode(node)
    if (Ts.isEnumDeclaration(node)) return yield* EnumDeclaration(node)
    if (Ts.isExpressionWithTypeArguments(node)) return yield* ExpressionWithTypeArguments(node)
    if (Ts.isFunctionDeclaration(node)) return yield* FunctionDeclaration(node)
    if (Ts.isFunctionTypeNode(node)) return yield* FunctionTypeNode(node)
    if (Ts.isHeritageClause(node)) return yield* HeritageClause(node)
    if (Ts.isIndexedAccessTypeNode(node)) return yield* IndexedAccessType(node)
    if (Ts.isIndexSignatureDeclaration(node)) return yield* isIndexSignatureDeclaration(node)
    if (Ts.isInterfaceDeclaration(node)) return yield* InterfaceDeclaration(node)
    if (Ts.isLiteralTypeNode(node)) return yield* LiteralTypeNode(node)
    if (Ts.isNamedTupleMember(node)) return yield* NamedTupleMember(node)
    if (Ts.isPropertySignature(node)) return yield* PropertySignature(node)
    if (Ts.isModuleDeclaration(node)) return yield* ModuleDeclaration(node)
    if (Ts.isIdentifier(node)) return yield node.getText()
    if (Ts.isIntersectionTypeNode(node)) return yield* IntersectionTypeNode(node)
    if (Ts.isUnionTypeNode(node)) return yield* UnionTypeNode(node)
    if (Ts.isMappedTypeNode(node)) return yield* MappedTypeNode(node)
    if (Ts.isMethodSignature(node)) return yield* MethodSignature(node)
    if (Ts.isModuleBlock(node)) return yield* ModuleBlock(node)
    if (Ts.isParameter(node)) return yield* Parameter(node)
    if (Ts.isParenthesizedTypeNode(node)) return yield* ParenthesizedTypeNode(node)
    if (Ts.isPropertyAccessExpression(node)) return yield* PropertyAccessExpression(node)
    if (Ts.isRestTypeNode(node)) return yield* RestTypeNode(node)
    if (Ts.isTupleTypeNode(node)) return yield* TupleTypeNode(node)
    if (Ts.isTemplateLiteralTypeNode(node)) return yield* TemplateLiteralTypeNode(node)
    if (Ts.isTemplateLiteralTypeSpan(node)) return yield* TemplateLiteralTypeSpan(node)
    if (Ts.isTemplateHead(node)) return yield* TemplateHead(node)
    if (Ts.isTemplateMiddle(node)) return yield* TemplateMiddle(node)
    if (Ts.isTemplateTail(node)) return yield* TemplateTail(node)
    if (Ts.isThisTypeNode(node)) return yield* ThisTypeNode(node)
    if (Ts.isTypeAliasDeclaration(node)) return yield* TypeAliasDeclaration(node)
    if (Ts.isTypeLiteralNode(node)) return yield* TypeLiteralNode(node)
    if (Ts.isTypeOperatorNode(node)) return yield* TypeOperatorNode(node)
    if (Ts.isTypeParameterDeclaration(node)) return yield* TypeParameterDeclaration(node)
    if (Ts.isTypeReferenceNode(node)) return yield* TypeReferenceNode(node)
    if (Ts.isSourceFile(node)) return yield* SourceFile(node)
    if (node.kind === Ts.SyntaxKind.ExportKeyword) return yield `export`
    if (node.kind === Ts.SyntaxKind.KeyOfKeyword) return yield `Type.KeyOf()`
    if (node.kind === Ts.SyntaxKind.NumberKeyword) return yield `Type.Number()`
    if (node.kind === Ts.SyntaxKind.BigIntKeyword) return yield `Type.BigInt()`
    if (node.kind === Ts.SyntaxKind.StringKeyword) return yield `Type.String()`
    if (node.kind === Ts.SyntaxKind.SymbolKeyword) return yield `Type.Symbol()`
    if (node.kind === Ts.SyntaxKind.BooleanKeyword) return yield `Type.Boolean()`
    if (node.kind === Ts.SyntaxKind.UndefinedKeyword) return yield `Type.Undefined()`
    if (node.kind === Ts.SyntaxKind.UnknownKeyword) return yield `Type.Unknown()`
    if (node.kind === Ts.SyntaxKind.AnyKeyword) return yield `Type.Any()`
    if (node.kind === Ts.SyntaxKind.NeverKeyword) return yield `Type.Never()`
    if (node.kind === Ts.SyntaxKind.NullKeyword) return yield `Type.Null()`
    if (node.kind === Ts.SyntaxKind.VoidKeyword) return yield `Type.Void()`
    if (node.kind === Ts.SyntaxKind.EndOfFileToken) return
    if (node.kind === Ts.SyntaxKind.SyntaxList) {
      for (const child of node.getChildren()) {
        yield* Visit(child)
      }
      return
    }
    console.warn('Unhandled:', Ts.SyntaxKind[node.kind], node.getText())
  }
  function ImportStatement(): string {
    if (!(useImports && useTypeBoxImport)) return ''
    const set = new Set<string>(['Type', 'Static'])
    if (useGenerics) {
      set.add('TSchema')
    }
    if (useOptions) {
      set.add('SchemaOptions')
    }
    if (useCloneType) {
      set.add('CloneType')
    }
    const imports = [...set].join(', ')
    return `import { ${imports} } from '@sinclair/typebox'`
  }
  /** Generates TypeBox types from TypeScript interface and type definitions */
  export function Generate(typescriptCode: string, options?: TypeScriptToTypeBoxOptions) {
    useExportsEverything = options?.useExportEverything ?? false
    useIdentifiers = options?.useIdentifiers ?? false
    useTypeBoxImport = options?.useTypeBoxImport ?? true
    typenames.clear()
    useImports = false
    useOptions = false
    useGenerics = false
    useCloneType = false
    blockLevel = 0
    const source = Ts.createSourceFile('types.ts', typescriptCode, Ts.ScriptTarget.ESNext, true)
    const declarations = [...Visit(source)].join('\n\n')
    const imports = ImportStatement()
    const typescript = [imports, '', '', declarations].join('\n')
    const assertion = Ts.transpileModule(typescript, transpilerOptions)
    if (assertion.diagnostics && assertion.diagnostics.length > 0) {
      throw new TypeScriptToTypeBoxError(assertion.diagnostics)
    }
    return typescript
  }
}
