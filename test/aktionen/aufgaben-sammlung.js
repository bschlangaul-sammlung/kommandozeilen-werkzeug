/* globals describe it */

import assert from 'assert'

import {
  erzeugeExamensÜbersicht,
  erzeugeExamenScansSammlung,
  erzeugeExamensLösungen
} from '../../dist/aktionen/aufgaben-sammlung.js'

describe('aktionen/aufgaben-sammlung.ts', function () {
  it('Funktion erzeugeExamensÜbersicht()', function () {
    const übersicht = erzeugeExamensÜbersicht()
    assert.ok(
      übersicht.includes(
        '### 66115: Theoretische Informatik / Algorithmen (vertieft)'
      )
    )
    assert.ok(
      übersicht.includes(
        'https://raw.githubusercontent.com/bschlangaul-sammlung/examens-aufgaben-pdf/main/Examen/66116/2021/03/Thema-2/Teilaufgabe-2/Aufgabe-6.pdf'
      )
    )
  })

  it('Funktion erzeugeExamenScansSammlung()', function () {
    erzeugeExamenScansSammlung()
  })

  it('Funktion erzeugeExamensLösungen()', function () {
    erzeugeExamensLösungen()
  })
})
