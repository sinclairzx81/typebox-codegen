import { expectEqualIgnoreFormatting } from "./utils";
import { TypeScriptToTypeBox } from "../src/typescript-to-typebox";

describe("IndexedAccessTypes - Typescript to Typebox", () => {
  it("Interface depth 1", async () => {
    const tsInput = `
      export interface Address {
        street: string;
        test: {
          a: string;
        };
      }

      export interface Address2 {
        street2: Address["test"];
      }
      `;
    const expectedTypeboxOutput = `
      import { Type, Static } from '@sinclair/typebox';

      export type Address = Static<typeof Address>;
      export const Address = Type.Object({
        street: Type.String(),
        test: Type.Object({
          a: Type.String()
        })
      });

      export type Address2 = Static<typeof Address2>;
      export const Address2 = Type.Object({
        street2: Type.Object({
          a: Type.String()
        })
      });
      `;
    const output = TypeScriptToTypeBox.Generate(tsInput);
    expectEqualIgnoreFormatting(output, expectedTypeboxOutput);
  });

  it("Interface depth 2", async () => {
    const tsInput = `
      export interface Address {
        street: string;
        test: {
          a: string;
        };
      }

      export interface Address2 {
        street2: Address["test"]["a"];
      }
      `;
    const expectedTypeboxOutput = `
      import { Type, Static } from '@sinclair/typebox'

      export type Address = Static<typeof Address>
      export const Address = Type.Object({
        street: Type.String(),
        test: Type.Object({
          a: Type.String()
        })
      })

      export type Address2 = Static<typeof Address2>
      export const Address2 = Type.Object({
        street2: Type.String()
      })
      `;
    const output = TypeScriptToTypeBox.Generate(tsInput);
    expectEqualIgnoreFormatting(output, expectedTypeboxOutput);
  });

  it("Type depth 1", async () => {
    const tsInput = `
      export type Address = {
        street: string;
        test: {
          a: string;
        };
      };

      export type Address2 = {
        street2: Address["test"];
      };
      `;
    const expectedTypeboxOutput = `
      import { Type, Static } from '@sinclair/typebox'

      export type Address = Static<typeof Address>
      export const Address = Type.Object({
        street: Type.String(),
        test: Type.Object({
          a: Type.String()
        })
      })

      export type Address2 = Static<typeof Address2>
      export const Address2 = Type.Object({
        street2: Type.Object({
          a: Type.String()
        })
      })
      `;
    const output = TypeScriptToTypeBox.Generate(tsInput);
    expectEqualIgnoreFormatting(output, expectedTypeboxOutput);
  });

  it("Type depth 2", async () => {
    const tsInput = `
      export type Address = {
        street: string;
        test: {
          a: string;
        };
      };

      export type Address2 = {
        street2: Address["test"]["a"];
      };
      `;
    const expectedTypeboxOutput = `
      import { Type, Static } from '@sinclair/typebox'

      export type Address = Static<typeof Address>
      export const Address = Type.Object({
        street: Type.String(),
        test: Type.Object({
          a: Type.String()
        })
      })

      export type Address2 = Static<typeof Address2>
      export const Address2 = Type.Object({
        street2: Type.String()
      })
      `;
    const output = TypeScriptToTypeBox.Generate(tsInput);
    expectEqualIgnoreFormatting(output, expectedTypeboxOutput);
  });
});
