/**
 * Aktionen, die über eine Sammlung an Aufgaben eine Ausgabe erzeugen.
 */

import path from 'path'
import { ExamensAufgabe, gibAufgabenSammlung } from '../aufgabe'
import { logger } from '../log'

import { gibExamenSammlung, Examen } from '../examen'
import {
  repositoryPfad,
  macheRelativenPfad,
  macheRepoPfad,
  löscheDatei,
  AusgabeSammler
} from '../helfer'
import { schreibeTexDatei, machePlist } from '../tex'

/**
 * ```md
 * - 2015 Frühjahr: [Scan.pdf](...46116/2015/03/Scan.pdf) [OCR.txt](…46116/2015/03/OCR.txt)
 *     - Thema 1
 *         - Teilaufgabe 1
 *             - [Aufgabe 3](…46116/2015/03/Thema-1/Teilaufgabe-1/Aufgabe-3.pdf)
 *         - Teilaufgabe 2
 *             - [Aufgabe 1](…46116/2015/03/Thema-1/Teilaufgabe-2/Aufgabe-1.pdf)
 *             - [Aufgabe 3](…46116/2015/03/Thema-1/Teilaufgabe-2/Aufgabe-3.pdf)
 *```
 */
function erzeugeAufgabenBaumMarkdown (examen: Examen): string {
  const baum = examen.aufgabenBaum
  if (baum == null) {
    logger.log('debug', 'Examen hat keine Aufgaben')
    return ''
  }

  function rückeEin (): string {
    return ' '.repeat(4 * ebene) + '- '
  }

  let ebene = 1
  const ausgabe = baum.registriereBesucher({
    besucheThema (nummer: number): string {
      ebene = 1
      const ausgabe = rückeEin() + `Thema ${nummer}`
      ebene++
      return ausgabe
    },
    besucheTeilaufgabe (nummer: number): string {
      ebene = 2
      const ausgabe = rückeEin() + `Teilaufgabe ${nummer}`
      ebene++
      return ausgabe
    },
    besucheAufgabe (
      nummer: number,
      examen?: Examen,
      aufgabe?: ExamensAufgabe
    ): string {
      let titel: string
      if (aufgabe != null) {
        titel = aufgabe.gibTitelNurAufgabe(true)
      } else {
        titel = `Aufgabe ${nummer}`
      }
      return rückeEin() + titel
    }
  })

  if (ausgabe == null) return ''
  return '\n' + ausgabe
}

function erzeugeDateiLink (examen: Examen, dateiName: string): string {
  return examen.macheMarkdownLink(dateiName, dateiName)
}

/**
 * Erzeugen den Markdown-Code für die README-Datei.
 */
export function generiereExamensÜbersicht (): string {
  const examenSammlung = gibExamenSammlung()
  const examenBaum = examenSammlung.baum as any
  const ausgabe = new AusgabeSammler()
  for (const nummer in examenBaum) {
    ausgabe.sammle(`\n### ${nummer}: ${Examen.fachDurchNummer(nummer)}\n`)
    for (const jahr in examenBaum[nummer]) {
      for (const monat in examenBaum[nummer][jahr]) {
        const examen = examenBaum[nummer][jahr][monat] as Examen
        const scanLink = erzeugeDateiLink(examen, 'Scan.pdf')
        const ocrLink = erzeugeDateiLink(examen, 'OCR.txt')
        ausgabe.sammle(
          `- ${
            examen.jahrJahreszeit
          }: ${scanLink} ${ocrLink} ${erzeugeAufgabenBaumMarkdown(examen)}`
        )
      }
    }
  }
  return ausgabe.gibText()
}

/**
 * Erzeugt eine TeX-Datei, die alle Examens-Scanns eines bestimmten Fachs (z. B.
 * 65116) als eine PDF-Datei zusammenfasst.
 */
export function erzeugeExamenScansSammlung (): void {
  const examenSammlung = gibExamenSammlung()
  const examenBaum = examenSammlung.baum as any
  for (const nummer in examenBaum) {
    const ausgabe = new AusgabeSammler()
    const nummernPfad = path.join(repositoryPfad, 'Staatsexamen', nummer)
    for (const jahr in examenBaum[nummer]) {
      const jahrPfad = path.join(nummernPfad, jahr)
      for (const monat in examenBaum[nummer][jahr]) {
        const examen = gibExamenSammlung().gib(nummer, jahr, monat)
        ausgabe.sammle(`\n\\liTrennSeite{${examen.jahreszeit} ${examen.jahr}}`)
        const scanPfad = macheRelativenPfad(
          path.join(jahrPfad, monat, 'Scan.pdf')
        )
        const includePdf = `\\liBindePdfEin{${scanPfad}}`
        ausgabe.sammle(includePdf)
      }
    }
    const textKörper = ausgabe.gibText()
    const kopf =
      `\\liPruefungsNummer{${nummer}}\n` +
      `\\liPruefungsTitel{${Examen.fachDurchNummer(nummer)}}\n`

    schreibeTexDatei(
      macheRepoPfad('Staatsexamen', nummer, 'Examensammlung.tex'),
      'examen-scans',
      kopf,
      textKörper
    )
  }
}

/**
 * Erzeugt pro Examen eine TeX-Datei, die alle zum diesem Examen gehörenden
 * Aufgaben samt Lösungen einbindet.
 *
 * ```latex
 * \liSetzeExamen{66116}{2021}{03}
 *
 * \liSetzeExamenThemaNr{1}
 *
 * \liSetzeExamenTeilaufgabeNr{1}
 *
 * \liBindeAufgabeEin{1}
 * \liBindeAufgabeEin{2}
 * \liBindeAufgabeEin{3}
 * ```
 */
function erzeugeExamensLösung (examen: Examen): void {
  logger.log('debug', 'Besuche Examen %s', examen.referenz)

  const baum = examen.aufgabenBaum
  if (baum == null) {
    logger.log('debug', 'Examen hat keine Aufgaben')
    return
  }

  logger.verbose(examen.pfad)
  const textKörper = baum.registriereBesucher({
    besucheThema (nummer: number): string {
      return `\n\n\\liSetzeExamenThemaNr{${nummer}}`
    },
    besucheTeilaufgabe (nummer: number): string {
      return `\n\\liSetzeExamenTeilaufgabeNr{${nummer}}\n`
    },
    besucheAufgabe (nummer: number): string {
      return `\\liBindeAufgabeEin{${nummer}}`
    }
  })

  const kopf = machePlist('liMetaSetze', {
    ExamenNummer: examen.nummer,
    ExamenFach: examen.fach,
    ExamenJahr: examen.jahr,
    ExamenMonat: examen.monatMitNullen,
    ExamenJahreszeit: examen.jahreszeit
  })

  const pfad = examen.machePfad('Examen.tex')
  if (textKörper != null) {
    logger.log('info', 'Schreibe %s', pfad)
    schreibeTexDatei(pfad, 'examen', kopf, textKörper)
  } else {
    logger.log('verbose', 'Lösche %s', pfad)
    löscheDatei(pfad)
  }
}

/**
 * Erzeugt pro Examen eine TeX-Datei, die alle zum diesem Examen gehörenden
 * Aufgaben samt Lösungen einbindet.
 */
export function erzeugeExamensLösungen (): void {
  // Damit die Aufgabensammlung in den Examensobjekten vorhanden ist.
  gibAufgabenSammlung()
  const examenSammlung = gibExamenSammlung()
  const examenBaum = examenSammlung.baum as any
  for (const nummer in examenBaum) {
    for (const jahr in examenBaum[nummer]) {
      for (const monat in examenBaum[nummer][jahr]) {
        const examen = examenBaum[nummer][jahr][monat] as Examen
        erzeugeExamensLösung(examen)
      }
    }
  }
}
