/* globals describe it */

import assert from 'assert'
import path from 'path'
import { URL } from 'url'

import {
  Aufgabe,
  gibAufgabenSammlung,
  ExamensAufgabe
} from '../dist/aufgabe.js'

const aufgabenSammlung = gibAufgabenSammlung()

function gibTestPfad (dateiName) {
  return path.resolve(
    new URL('.', import.meta.url).pathname,
    'files',
    dateiName
  )
}

describe('aufgabe.ts', function () {
  describe('Klasse Aufgabe()', function () {
    it('Initialisierung', function () {
      const aufgabe = new Aufgabe(gibTestPfad('Aufgabe.tex'))
      assert.strictEqual(aufgabe.istExamen, false)
    })

    describe('Getter-Methoden', function () {
      const aufgabe = aufgabenSammlung.gib(
        'Examen/66116/2020/09/Thema-1/Teilaufgabe-1/Aufgabe-1.tex'
      )

      it('Getter-Methode „titel“', function () {
        assert.strictEqual(aufgabe.titel, 'Aufgabe 1')
      })

      it('Getter-Methode „thematik“', function () {
        assert.strictEqual(aufgabe.thematik, 'Verifikation')
      })

      describe('Getter-Methode „zitat“', function () {
        it('ein Element', function () {
          assert.deepStrictEqual(aufgabe.zitat, ['examen:66116:2020:09'])
        })

        it('zwei Elemente', function () {
          const a = aufgabenSammlung.gib(
            'Examen/66116/2014/03/Thema-2/Teilaufgabe-2/Aufgabe-1.tex'
          )
          assert.deepStrictEqual(a.zitat, [
            'examen:66116:2014:03',
            'Thema 2 Teilaufgabe 2 Aufgabe 1 Seite 11'
          ])
        })
      })

      it('Getter-Methode „bearbeitungsStand“', function () {
        assert.deepStrictEqual(aufgabe.bearbeitungsStand, 'mit Lösung')
      })

      it('Getter-Methode „bearbeitungsStandGrad“', function () {
        assert.deepStrictEqual(aufgabe.bearbeitungsStandGrad, 4)
      })

      it('Getter-Methode „relativerPfad“', function () {
        assert.deepStrictEqual(
          aufgabe.relativerPfad,
          'Examen/66116/2020/09/Thema-1/Teilaufgabe-1/Aufgabe-1.tex'
        )
      })

      it('Getter-Methode „texQuelltextUrl“', function () {
        assert.deepStrictEqual(
          aufgabe.texQuelltextUrl,
          'https://github.com/bschlangaul-sammlung/examens-aufgaben-tex/blob/main/Examen/66116/2020/09/Thema-1/Teilaufgabe-1/Aufgabe-1.tex'
        )
      })

      it('Getter-Methode „pdfUrl“', function () {
        assert.deepStrictEqual(
          aufgabe.pdfUrl,
          'Examen/66116/2020/09/Thema-1/Teilaufgabe-1/Aufgabe-1.tex'
        )
      })
    })

    it('Methode leseMetadataVonTex()', function () {
      const aufgabe = new Aufgabe(gibTestPfad('Aufgabe.tex'))
      const titel = aufgabe.leseMetadatenVonTex()
      assert.strictEqual(titel.Titel, 'Grammatik aus Automat')
      assert.strictEqual(titel.Thematik, 'Reguläre Sprache')
      assert.strictEqual(
        titel.RelativerPfad,
        'Aufgabe_Grammatik-aus-Automat.tex'
      )
      assert.strictEqual(titel.ZitatBeschreibung, 'Seite 4, Aufgabe 3')
      assert.strictEqual(titel.ZitatSchluessel, 'theo:ab:1')
    })

    it('Normale Aufgabe keine Examensaufgabe', function () {
      const aufgabe = aufgabenSammlung.gib(
        'Module/30_AUD/20_Vollstaendige-Induktion/Aufgabe_Geometrische-Summenformel.tex'
      )
      assert.strictEqual(
        aufgabe.referenz,
        'AUD.Vollstaendige-Induktion.Geometrische-Summenformel'
      )
    })
  })

  describe('Klasse ExamensAufgabe()', function () {
    it('Initialisierung', function () {
      const aufgabe = aufgabenSammlung.gib(
        'Examen/66116/2020/09/Thema-1/Teilaufgabe-1/Aufgabe-1.tex'
      )
      assert.strictEqual(aufgabe.istExamen, true)
      assert.strictEqual(aufgabe.referenz, '66116-2020-H.T1-TA1-A1')
    })

    describe('Statische Methode „ExamensAufgabe.erzeugeExamensAufgabe()“', function () {
      it('66116:2020:09 1 2 3', function () {
        const aufgabe = ExamensAufgabe.erzeugeExamensAufgabe(
          '66116:2020:09',
          1,
          2,
          3
        )
        assert.strictEqual(aufgabe.thema, 1)
        assert.strictEqual(aufgabe.teilaufgabe, 2)
        assert.strictEqual(aufgabe.aufgabe, 3)
      })

      it('66116:2020:09 1 2', function () {
        const aufgabe = ExamensAufgabe.erzeugeExamensAufgabe(
          '66116:2020:09',
          1,
          2
        )
        assert.strictEqual(aufgabe.thema, 1)
        assert.strictEqual(aufgabe.teilaufgabe, undefined)
        assert.strictEqual(aufgabe.aufgabe, 2)
      })

      it('66116:2020:09 1', function () {
        const aufgabe = ExamensAufgabe.erzeugeExamensAufgabe('66116:2020:09', 1)
        assert.strictEqual(aufgabe.thema, undefined)
        assert.strictEqual(aufgabe.teilaufgabe, undefined)
        assert.strictEqual(aufgabe.aufgabe, 1)
      })
    })

    it('Methode „erzeugeMetadaten()“', function () {
      const aufgabe = aufgabenSammlung.gib(
        'Examen/66116/2020/09/Thema-1/Teilaufgabe-1/Aufgabe-1.tex'
      )
      const metadaten = aufgabe.erzeugeMetadaten()
      assert.strictEqual(metadaten.Titel, '{Aufgabe 1}')
      assert.strictEqual(metadaten.Thematik, '{Verifikation}')
      assert.strictEqual(
        metadaten.RelativerPfad,
        'Examen/66116/2020/09/Thema-1/Teilaufgabe-1/Aufgabe-1.tex'
      )
      assert.strictEqual(metadaten.ZitatSchluessel, 'examen:66116:2020:09')
      assert.strictEqual(metadaten.Stichwoerter, '{Verifikation, wp-Kalkül}')
      assert.strictEqual(metadaten.EinzelpruefungsNr, 66116)
      assert.strictEqual(metadaten.Jahr, 2020)
      assert.strictEqual(metadaten.Monat, '09')
      assert.strictEqual(metadaten.ThemaNr, 1)
      assert.strictEqual(metadaten.TeilaufgabeNr, 1)
      assert.strictEqual(metadaten.AufgabeNr, 1)
    })
  })
})
