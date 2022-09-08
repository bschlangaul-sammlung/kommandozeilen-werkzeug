/* globals describe it */

import assert from 'assert'

import {
  generiereExamensÜbersicht,
  erzeugeExamenScansSammlung,
  erzeugeExamensLösungen
} from '../../dist/aktionen/aufgaben-sammlung.js'

describe('aktionen/aufgaben-sammlung.ts', function () {
  it('Funktion generiereExamensÜbersicht()', function () {
    const übersicht = generiereExamensÜbersicht()
    assert.ok(
      übersicht.includes(
        '### 66115: Theoretische Informatik / Algorithmen (vertieft)'
      )
    )
    assert.ok(
      übersicht.includes(
        'https://raw.githubusercontent.com/bschlangaul-sammlung/examens-aufgaben/main/Examen/66116/2021/03/Thema-2/Teilaufgabe-2/Aufgabe-6.pdf'
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
