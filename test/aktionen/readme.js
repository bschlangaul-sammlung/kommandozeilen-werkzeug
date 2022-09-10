/* globals describe it */

import {
  erzeugeReadmeHaupt,
  erzeugeReadmeExamenScans
} from '../../dist/aktionen/readme.js'

describe('aktionen/readme.ts', function () {
  it('erzeugeReadmeHaupt', function () {
    erzeugeReadmeHaupt()
  })

  it('erzeugeReadmeExamenScans', function () {
    erzeugeReadmeExamenScans()
  })
})
