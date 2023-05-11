/**
 * Functions used to add ability to parse jsdoc comments for types into JSON
 * schema options.
 **/
import * as ts from 'typescript'
import * as doctrine from 'doctrine'

const getJsDocStringFromNode = (node: ts.TypeAliasDeclaration | ts.PropertySignature | ts.InterfaceDeclaration): string[] => {
  const regexToGetComments = /\/\*\*([\s\S]*?)\*\//
  const match = node.getFullText().match(regexToGetComments)
  if (match !== undefined && match !== null) {
    return match.slice(1)
  }
  return []
}

const astTagsFromJsDoc = (jsDocStrings: string): doctrine.Tag[] => {
  const { tags } = doctrine.parse(jsDocStrings, { unwrap: true })
  return tags
}

const generateOptionsForNode = (tags: doctrine.Tag[], transform: (val: number | bigint | string) => number | bigint | string) => {
  return tags.reduce((prev, curr) => {
    if (curr.description !== null) {
      prev[curr.title] = transform(curr.description)
    }
    return prev
  }, {} as Record<any, any>)
}

/**
 * Generates an object containing valid JSON schema options for the given node
 * based on the given jsdoc ast.
 **/
export const generateOptionsBasedOnJsDocOfNode = (node: ts.TypeAliasDeclaration | ts.PropertySignature | ts.InterfaceDeclaration) => {
  const jsDocStrings = getJsDocStringFromNode(node)
  const tags = jsDocStrings.flatMap(astTagsFromJsDoc)
  return generateOptionsForNode(tags, (val) => {
    if (typeof val === 'number') {
      return val
    }
    if (typeof val === 'string') {
      // bigint
      if (val.endsWith('n')) {
        return BigInt(val)
      }
      // string
      // TODO: also allow quoted strings via 'test here'?
      if (val.startsWith('"')) {
        const valAfterFirstQuote = val.slice(1)
        // does it contain another (closing) '"'?
        if (valAfterFirstQuote.includes('"')) {
          const valInsideQuotes = valAfterFirstQuote.split('"')[0]
          return valInsideQuotes
        }
      }
      // number
      return parseInt(val, 10)
    }
    return val
  })
}

/**
 * Adds given JSON schema options to the string representation of the given
 * type.
 **/
export const addOptionsToType = (typeAsString: string, options?: Record<any, any>) => {
  if (options === undefined || Object.keys(options).length === 0) {
    return typeAsString
  }

  // const closingParensCount = getNumberOfEndingClosingParens(typeAsString);

  // TODO: probably add ": SchemaOptions" here. Was mentioned in discussion, but I
  // did not find the type anywhere? Perhaps I misunderstood something?
  // src: https://github.com/sinclairzx81/typebox-codegen/discussions/13#discussioncomment-5858910
  return `${typeAsString.slice(0, -1)},${JSON.stringify(options)})`
}

// const getNumberOfEndingClosingParens = (type: string) => {
//   let currentType = type;
//   let closingEndingParensCount = 0;
//   while (currentType.endsWith(")")) {
//     currentType = currentType.slice(0, -1);
//     closingEndingParensCount = closingEndingParensCount + 1;
//   }
//   return closingEndingParensCount;
// };
