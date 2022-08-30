/**
 * Aktionen, die über eine Sammlung an Aufgaben eine Ausgabe erzeugen.
 */

import { Aufgabe, ExamensAufgabe, gibAufgabenSammlung } from '../aufgabe'
import { log } from '../log'
import { gibExamenSammlung, Examen } from '../examen'
import {
  macheRepoPfad,
  löscheDatei,
  AusgabeSammler,
  macheRelativenPfad
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
    log('debug', 'Examen hat keine Aufgaben')
    return ''
  }

  function rückeEin (): string {
    return ' '.repeat(4 * ebene) + '- '
  }

  let ebene = 1
  const ausgabe = baum.besuche({
    betreteThema (nummer: number): string {
      ebene = 1
      const ausgabe = rückeEin() + `Thema ${nummer}`
      ebene++
      return ausgabe
    },
    betreteTeilaufgabe (nummer: number): string {
      ebene = 2
      const ausgabe = rückeEin() + `Teilaufgabe ${nummer}`
      ebene++
      return ausgabe
    },
    betreteAufgabe (aufgabe: ExamensAufgabe, nummer: number): string {
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

  const baum = examenSammlung.examenBaum
  if (baum == null) {
    log('info', 'Konnte keinen Examensbaum aufbauen')
    return ''
  }

  return baum.besuche({
    betreteEinzelprüfungsNr (nummer: number): string {
      return `\n### ${nummer}: ${Examen.fachDurchNummer(nummer)}\n`
    },
    betreteExamen (examen: Examen, monat: number, nummer: number): string {
      const scanLink = erzeugeDateiLink(examen, 'Scan.pdf')
      const ocrLink = erzeugeDateiLink(examen, 'OCR.txt')
      return `- ${
        examen.jahrJahreszeit
      }: ${scanLink} ${ocrLink} ${erzeugeAufgabenBaumMarkdown(examen)}`
    }
  })
}

/**
 * Erzeugt eine TeX-Datei, die alle Examens-Scans eines bestimmten Fachs (z. B.
 * 65116) als eine PDF-Datei zusammenfasst.
 */
export function erzeugeExamenScansSammlung (): void {
  const examenSammlung = gibExamenSammlung()

  const baum = examenSammlung.examenBaum
  if (baum == null) {
    log('info', 'Konnte keinen Examensbaum aufbauen')
    return
  }

  const ausgabe = new AusgabeSammler()

  baum.besuche({
    betreteEinzelprüfungsNr (nummer: number): undefined {
      ausgabe.leere()
      return undefined
    },
    betreteExamen (examen: Examen, monat: number, nummer: number): undefined {
      ausgabe.sammle(`\n\\bTrennSeite{${examen.jahreszeit} ${examen.jahr}}`)
      ausgabe.sammle(`\\bBindePdfEin{${macheRelativenPfad(examen.pfad)}}`)
      return undefined
    },
    verlasseEinzelprüfungsNr (nummer: number): undefined {
      const textKörper = ausgabe.gibText()
      const kopf =
        `\\bPruefungsNummer{${nummer}}\n` +
        `\\bPruefungsTitel{${Examen.fachDurchNummer(nummer)}}\n`

      schreibeTexDatei(
        macheRepoPfad('Staatsexamen', nummer.toString(), 'Examensammlung.tex'),
        'examen-scans',
        kopf,
        textKörper
      )
      return undefined
    }
  })
}

/**
 * Erzeugt pro Examen eine TeX-Datei, die alle zum diesem Examen gehörenden
 * Aufgaben samt Lösungen einbindet.
 *
 * ```latex
 * \bSetzeExamen{66116}{2021}{03}
 *
 * \bSetzeThemaNr{1}
 *
 * \bSetzeTeilaufgabeNr{1}
 *
 * \bBindeAufgabeEin{1}
 * \bBindeAufgabeEin{2}
 * \bBindeAufgabeEin{3}
 * ```
 */
function erzeugeExamensLösung (examen: Examen): void {
  log('debug', 'Besuche Examen %s', examen.referenz)

  const baum = examen.aufgabenBaum
  if (baum == null) {
    log('debug', 'Examen hat keine Aufgaben')
    return
  }

  log('verbose', examen.pfad)
  const textKörper = baum.besuche({
    betreteThema (nummer: number): string {
      return `\n\n\\bSetzeThemaNr{${nummer}}`
    },
    betreteTeilaufgabe (nummer: number): string {
      return `\n\\bSetzeTeilaufgabeNr{${nummer}}\n`
    },
    betreteAufgabe (aufgaben: Aufgabe, nummer: number): string {
      return `\\bBindeAufgabeEin{${nummer}}`
    }
  })

  const kopf = machePlist('liMetaSetze', {
    EinzelpruefungsNr: examen.nummer,
    ExamenFach: examen.fach,
    Jahr: examen.jahr,
    Monat: examen.monatMitNullen,
    Jahreszeit: examen.jahreszeit
  })

  const pfad = examen.machePfad('Examen.tex')
  if (textKörper != null) {
    log('info', 'Schreibe %s', pfad)
    schreibeTexDatei(pfad, 'examen', kopf, textKörper)
  } else {
    log('verbose', 'Lösche %s', pfad)
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

/**
 * Erzeuge das Haupt-Dokument mit dem Dateinamen `Bschlangaul-Sammlung.tex`
 */
export function erzeugeAufgabenSammlung (
  nurExamen: boolean = true,
  minKorrektheitNr: number = 2
): void {
  // Damit die Aufgabensammlung in den Examensobjekten vorhanden ist.
  gibAufgabenSammlung()
  const examenSammlung = gibExamenSammlung()

  const baum = examenSammlung.examenBaum
  if (baum == null) {
    log('info', 'Konnte keinen Examensbaum aufbauen')
    return
  }

  let einzelprüfungsNr: number

  const textkörper = baum.besuche({
    betreteAufgabe (aufgabe: Aufgabe, nummer: number): string | undefined {
      if (nurExamen && !aufgabe.istExamen) {
        return
      }

      if (aufgabe.korrektheitNr < minKorrektheitNr) {
        return
      }

      const examensAufgabe = aufgabe as ExamensAufgabe
      const examen = examensAufgabe.examen
      log('info', 'Die Aufgabe %s ist anscheinend korrekt.', aufgabe.referenz)
      let ausgabe: string = ''
      if (einzelprüfungsNr == null || examen.nummer !== einzelprüfungsNr) {
        log(
          'verbose',
          'Beginne neue Überschrift für Einzelprüfungs-Nummer %s.',
          einzelprüfungsNr
        )
        einzelprüfungsNr = examen.nummer
        const überschrift =
          einzelprüfungsNr.toString() + ' (' + examen.fach + ')'
        ausgabe += `\n\\section{${überschrift}}\n`
      }
      return ausgabe + aufgabe.einbindenTexMakro
    }
  })
  schreibeTexDatei(
    macheRepoPfad('Bschlangaul-Sammlung.tex'),
    'haupt',
    '',
    textkörper
  )
}
