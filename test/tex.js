/* globals describe it */

const assert = require('assert')
const { machePlist } = require('../dist/tex.js')

describe('tex.ts', function () {
  it('Funktion macheTexPlist()', function () {
    assert.strictEqual(
      machePlist('bAufgabenMetadaten', { Titel: 'titel' }, ['Titel']),
      '\\bAufgabenMetadaten{\n  Titel = {titel},\n}'
    )
  })
})
