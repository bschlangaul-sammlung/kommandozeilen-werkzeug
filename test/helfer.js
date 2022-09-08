/* globals describe it */

import assert from 'assert'

import { konfiguration } from '../dist/helfer.js'

describe('helfer.js', function () {
  it('Objekt „konfiguration“', function () {
    assert.strictEqual(
      konfiguration.einzelPruefungen['46110'],
      'Grundlagen der Informatik (nicht vertieft)'
    )
  })
})
