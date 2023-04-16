import { TypeScriptToModel } from '@sinclair/typebox/codegen'
import { TypeGuard } from '@sinclair/typebox'
import { Assert } from '../assert'
import { describe, it } from 'node:test'

describe('model/Boolean', () => {
  it('Should evaluate', () => {
    const model = TypeScriptToModel.Generate(`type T = boolean`)
    const type = model.exports.get('T')
    Assert.isTrue(TypeGuard.TBoolean(type))
  })
})
