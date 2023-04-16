import { TypeScriptToModel } from '@sinclair/typebox/codegen'
import { TypeGuard } from '@sinclair/typebox'
import { Assert } from '../assert'
import { describe, it } from 'node:test'

describe('model/String', () => {
  it('Should evaluate', () => {
    const model = TypeScriptToModel.Generate(`type T = string`)
    const type = model.exports.get('T')
    Assert.isTrue(TypeGuard.TString(type))
  })
})
