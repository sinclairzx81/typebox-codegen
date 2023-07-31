<div align='center'>

<h1>TypeBox Codegen</h1>

<p>Code Generation Tools for TypeBox</p>

<img src="codegen.png" />

<br />

</div>

## Overview

This library implements various code generation tools for transforming TypeScript types into TypeBox types as well as several other type representations. This library works by first transforming TypeScript type representations into a TypeBox Type Model. The Model can then be passed to various code generators that map the TypeBox Model into various target representations.

The library contains various code generators for libraries such as Zod, Io-Ts, ArkType and Valibot, no-library function generators for JavaScript and TypeScript as well as TypeScript to JSON Schema generation derived from TypeBox schematics. These tools are written as a backend for CLI tooling, website integration and as a system to assert TypeBox alignment with the TypeScript type system.

License MIT

## Usage

```typescript
import * as Codegen from '@sinclair/typebox-codegen'

const Code = `
export type T = {
  x: number,
  y: number,
  z: number
}
`
// ----------------------------------------------------------------------------
//
// TypeScriptToTypeBox
//
// Generates an immediate TypeScript to TypeBox type code transformation
//
// ----------------------------------------------------------------------------

console.log('TypeScript To TypeBox', Codegen.TypeScriptToTypeBox.Generate(Code))

// ----------------------------------------------------------------------------
//
// TypeScriptToModel
//
// Generates an in-memory TypeBox Type Model
//
// ----------------------------------------------------------------------------

const model = Codegen.TypeScriptToModel.Generate(Code)

// ----------------------------------------------------------------------------
//
// ModelToX
//
// The TypeBox Type Model can be passed to several generators which map the
// Model into varying type representations.
//
// ----------------------------------------------------------------------------

console.log('TypeBoxModel', model)
console.log('Model To JsonSchema', Codegen.ModelToJsonSchema.Generate(model))
console.log('Model To JavaScript', Codegen.ModelToJavaScript.Generate(model))
console.log('Model To TypeScript', Codegen.ModelToTypeScript.Generate(model))
console.log('Model To Valibot', Codegen.ModelToValibot.Generate(model))
console.log('Model To Value', Codegen.ModelToValue.Generate(model))
console.log('Model To Yup', Codegen.ModelToYup.Generate(model))
console.log('Model To Zod', Codegen.ModelToZod.Generate(model))
console.log('Model To ArkType', Codegen.ModelToArkType.Generate(model))
```

## Running Local

Clone the project and run the following commands.

```bash
$ npm install      # install dependencies

$ npm format       # prettier pass for `src` and `example`

$ npm clean        # remove the `target` directory.

$ npm start        # run the `example` script in node
```

## Formatting hook

Set up pre-commit formatting hook by running `cp ./.git-hooks/pre-commit ./.git/hooks/`
