/**
 * Functions used to add ability to parse jsdoc comments for types into JSON
 * schema options.
 **/
import * as ts from 'typescript'
import * as doctrine from 'doctrine'

const getJsDocStringFromNode = (node: ts.TypeAliasDeclaration): string[] => {
  const regexToGetComments = /\/\*\*([\s\S]*?)\*\//
  const match = node.getFullText().match(regexToGetComments)
  if (match !== undefined && match !== null) {
    return match.slice(1)
  }
  return []
}

const isNumericOption = (tag: doctrine.Tag): boolean => {
  const numericOptions = ['exclusiveMaximum', 'exclusiveMinimum', 'maximum', 'minimum', 'multipleOf']
  return numericOptions.includes(tag.title)
}

const astTagsFromJsDoc = (jsDocStrings: string): doctrine.Tag[] => {
  const { tags } = doctrine.parse(jsDocStrings, { unwrap: true })
  return tags
}

const generateOptionsForNode = (tags: doctrine.Tag[], predicate: (val: doctrine.Tag) => boolean, transform: (val: number | bigint | string) => number | bigint | string) => {
  return tags.reduce((prev, curr) => {
    if (predicate(curr) && curr.description !== null) {
      prev[curr.title] = transform(curr.description)
    }
    return prev
  }, {} as Record<any, any>)
}

const isNumericNode = (node: ts.TypeAliasDeclaration) => {
  const children = node.getChildren()
  return children.map((child) => child.kind).includes(ts.SyntaxKind.NumberKeyword)
}

/**
 * Generates an object containing valid JSON schema options for the given node
 * based on the given jsdoc ast.
 **/
export const generateOptionsBasedOnJsDocOfNode = (node: ts.TypeAliasDeclaration) => {
  const jsDocStrings = getJsDocStringFromNode(node)
  const tags = jsDocStrings.flatMap(astTagsFromJsDoc)
  if (isNumericNode(node)) {
    return generateOptionsForNode(tags, isNumericOption, (val) => {
      if (typeof val === 'number') {
        return val
      }
      if (typeof val === 'string') {
        if (val.endsWith('n')) {
          return BigInt(val)
        }
        return parseInt(val, 10)
      }
      return val
    })
  }
  return {}
}

/**
 * Adds given JSON schema options to the string representation of the given
 * type.
 **/
export const addOptionsToType = (typeAsString: string, options: Record<any, any>) => {
  if (Object.keys(options).length === 0) {
    return typeAsString
  }
  return `${typeAsString.slice(0, -1)}${JSON.stringify(options)})`
}
