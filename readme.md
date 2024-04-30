<div align='center'>

<h1>TypeBox-Codegen</h1>

<p>Code Generation Tools for TypeBox</p>

<img src="https://github.com/sinclairzx81/typebox-codegen/blob/main/codegen.png?raw=true" />

<br />
<br />

[![npm version](https://badge.fury.io/js/%40sinclair%2Ftypebox-codegen.svg)](https://badge.fury.io/js/%40sinclair%2Ftypebox-codegen)
[![GitHub CI](https://github.com/sinclairzx81/typebox-codegen/actions/workflows/ci.yml/badge.svg)](https://github.com/sinclairzx81/typebox-codegen/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

## Install

```typescript
npm install @sinclair/typebox-codegen
```

## Example

```typescript
import * as Codegen from '@sinclair/typebox-codegen'

const Code = Codegen.TypeScriptToTypeBox.Generate(`
  type T = { x: number, y: number, z: number }
`)

console.log(Code)

// Output:
//
// import { Type, Static } from '@sinclair/typebox'
// 
// type T = Static<typeof T>
// const T = Type.Object({
//   x: Type.Number(),
//   y: Type.Number(),
//   z: Type.Number()
// })
```

## Overview

TypeBox-Codegen is a code generation tool that transforms TypeScript types into TypeBox types as well as several other schema and library representations. It works by mapping structural type information from the TypeScript compiler into a TypeBox model. This model is then passed on to code generators which generate via TypeBox schema introspection.

The library contains code transformations for libraries such as [zod](https://github.com/colinhacks/zod), [effect](https://github.com/Effect-TS/effect), [arktype](https://github.com/arktypeio/arktype), [io-ts](https://github.com/gcanti/io-ts) and [valibot](https://github.com/fabian-hiller/valibot), assertion generators for JavaScript and TypeScript as well as Json Schema derived from TypeBox's raw schematics.

[TypeBox Workbench Example](https://sinclairzx81.github.io/typebox-workbench/)

License MIT

## Usage

The following is the general usage

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
// Generates an in-memory TypeBox Model
//
// ----------------------------------------------------------------------------

const model = Codegen.TypeScriptToModel.Generate(Code)

// ----------------------------------------------------------------------------
//
// ModelToX
//
// The TypeBox Model can be passed to several generators which map the
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
console.log('Model To Effect', Codegen.ModelToEffect.Generate(model))
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
