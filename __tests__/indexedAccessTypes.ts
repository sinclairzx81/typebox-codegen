import { expectEqualIgnoreFormatting } from "./utils";
import { TypeScriptToTypeBox } from "../src/typescript-to-typebox";

describe("IndexedAccessTypes - Typescript to Typebox", () => {
  it("Interface", async () => {
    const tsInput = `
export interface Vector {
  x: number;
  y: number;
  z: number;
}`;
    const expectedTypeboxOutput = `import { Type, Static } from '@sinclair/typebox'

export type Vector = Static<typeof Vector>
export const Vector = Type.Object({
  x: Type.Number(),
  y: Type.Number(),
  z: Type.Number()
})
`;
    const output = TypeScriptToTypeBox.Generate(tsInput);
    expectEqualIgnoreFormatting(output, expectedTypeboxOutput);
  });

  it("Type", async () => {
    const tsInput = `
export type Vector {
  x: number;
  y: number;
  z: number;
}`;
    const expectedTypeboxOutput = `import { Type, Static } from '@sinclair/typebox'

export type Vector = Static<typeof Vector>
export const Vector = Type.Object({
  x: Type.Number(),
  y: Type.Number(),
  z: Type.Number()
})
`;
    const output = TypeScriptToTypeBox.Generate(tsInput);
    expectEqualIgnoreFormatting(output, expectedTypeboxOutput);
  });
});
