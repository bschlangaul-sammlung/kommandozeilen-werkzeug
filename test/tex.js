/* globals describe it */

import assert from 'assert'

import { machePlist } from '../dist/tex.js'

describe('tex.ts', function () {
  it('Funktion macheTexPlist()', function () {
    assert.strictEqual(
      machePlist('bAufgabenMetadaten', { Titel: 'titel' }, ['Titel']),
      '\\bAufgabenMetadaten{\n  Titel = {titel},\n}'
    )
  })
})
