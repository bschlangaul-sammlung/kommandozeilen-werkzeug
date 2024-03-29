import path from 'path'
import glob from 'glob'

import {
  AusgabeSammler,
  erzeugeGithubRawLink,
  konfiguration,
  macheRelativenPfad,
  hauptRepoPfad,
  zeigeFehler
} from './helfer'
import { Aufgabe, ExamensAufgabe } from './aufgabe'

export interface ExamenReferenz {
  nummer: string
  jahr: string
  monat: string
}

/**
 * Die Klasse Examen repräsentiert eine Examensprüfung.
 */
export class Examen {
  /**
   * Die sogenannte Einzelprüfungsnummer, z. B. `66115`.
   */
  public nummer: number

  /**
   * Das Jahr, in dem das Examen stattfindet.
   *
   * z. B. `2021`
   */
  public jahr: number

  /**
   * Der Monat, in dem das Examen stattfindet. Für Frühjahr `3` und für Herbst
   * `9`.
   */
  public monat: number

  /**
   * ```js
   * {
   *    'Examen/66116/2021/03/Thema-2/Teilaufgabe-2/Aufgabe-5.tex': aufgabe
   * }
   * ```
   */
  aufgaben: { [pfad: string]: Aufgabe } = {}

  static regExp: RegExp = /^.*(?<nummer>\d{5})\/(?<jahr>\d{4})\/(?<monat>\d{2})\/.*$/

  /**
   * @param nummer Die Examens-Nummer, z. B. 65116
   * @param jahr Das Jahr in dem das Examen statt fand, z. b. 2021
   * @param monat Das Monat, in dem das Examen statt fand. Mögliche Werte 3 für Frühjahr und 9 für Herbst.
   */
  constructor (nummer: number, jahr: number, monat: number) {
    this.nummer = nummer
    this.jahr = jahr
    this.monat = monat
  }

  /**
   * Zeigt an, ob das Examen Aufgaben hat.
   */
  get hatAufgaben (): boolean {
    return Object.keys(this.aufgaben).length > 1
  }

  /**
   * Der Pfad zum Scan
   *
   * z. B. `...github/hbschlang/Examen/66116/2020/09/Scan.pdf`
   */
  get pfad (): string {
    return path.join(
      hauptRepoPfad,
      Examen.erzeugePfad(this.nummer, this.jahr, this.monatMitNullen),
      'Scan.pdf'
    )
  }

  /**
   * Der übergeordnete Ordner, in dem das Examen liegt.
   *
   * @returns z. B. `...github/hbschlang/Examen/66116/2020/09`
   */
  get verzeichnis (): string {
    return path.dirname(this.pfad)
  }

  /**
   * Der übergeordnete Ordner, in dem das Examen liegt, als relativen Pfad.
   *
   * @returns z. B. `Examen/66116/2020/09`
   */
  get verzeichnisRelativ (): string {
    return macheRelativenPfad(this.verzeichnis)
  }

  /**
   * Generiere eine absoluten Dateipfad, der im Verzeichnis des Examens liegt.
   *
   * @param pfadSegmente - z. B. `'Thema-1', 'Teilaufgabe-1', 'Aufgabe-1.tex'`
   */
  public machePfad (...pfadSegmente: string[]): string {
    return path.join(this.verzeichnis, ...pfadSegmente)
  }

  /**
   * @param pfadSegmente - z. B. `'Thema-1', 'Teilaufgabe-1', 'Aufgabe-1.tex'`
   */
  public macheMarkdownLink (text: string, ...pfadSegmente: string[]): string {
    return erzeugeGithubRawLink(text, this.machePfad(...pfadSegmente), {
      linkePdf: false
    })
  }

  /**
   * In welcher Jahreszeit das Examen stattfindet. Der Monat 3 gibt
   * `Frühjahr` und der Monat 9 `Herbst`.
   *
   * @returns `Frühjahr` oder `Herbst`
   */
  get jahreszeit (): string {
    if (this.monat === 3) {
      return 'Frühjahr'
    } else if (this.monat === 9) {
      return 'Herbst'
    }
    zeigeFehler(
      'Die Monatsangabe in der Klasse Examen darf nur 3 oder 9 lauten.'
    )
  }

  /**
   * In welcher Jahreszeit das Examen stattfindet. Der Monat `3` gibt
   * `F` (Frühjahr) und der Monat `9` `H` (Herbst).
   *
   * @returns `F` oder `H`
   */
  get jahreszeitBuchstabe (): string {
    return this.jahreszeit.charAt(0)
  }

  /**
   * @returns Ein lesbarer Dateiname, der das Examen identifiziert.
   */
  get dateiName (): string {
    return `Examen-Informatik_${this.nummer}-${this.jahr}-${this.jahreszeit}`
  }

  get jahrJahreszeit (): string {
    return `${this.jahr} ${this.jahreszeit}`
  }

  /**
   * @returns z. B. `03`
   */
  get monatMitNullen (): string {
    return this.monat.toString().padStart(2, '0')
  }

  /**
   * @returns z. B. `66116:2020:03`
   */
  get referenz (): string {
    return `${this.nummer}:${this.jahr}:${this.monatMitNullen}`
  }

  /**
   * @returns z. B. `Examen 66116 Frühjahr 2020`
   */
  get titelKurz (): string {
    return `Examen ${this.nummer} ${this.jahreszeit} ${this.jahr}`
  }

  /**
   * @returns z. B. `Datenbanksysteme / Softwaretechnologie (vertieft)`
   */
  get fach (): string {
    return examensTitel[this.nummer]
  }

  private macheExamenScansUrl (dateiName: string): string {
    return (
      konfiguration.github.rawUrl.replace(
        '<name>',
        konfiguration.repos.examenScans.name
      ) +
      '/' +
      path.join(
        this.nummer.toString(),
        this.jahr.toString(),
        this.monatMitNullen,
        dateiName
      )
    )
  }

  get scanUrl (): string {
    return this.macheExamenScansUrl('Scan.pdf')
  }

  get ocrUrl (): string {
    return this.macheExamenScansUrl('OCR.txt')
  }

  /**
   * @param nummer z. B. `66116`
   *
   * @returns 'Datenbanksysteme / Softwaretechnologie (vertieft)'
   */
  static fachDurchNummer (nummer: string | number): string {
    if (typeof nummer === 'string') {
      nummer = parseInt(nummer)
    }
    return examensTitel[nummer]
  }

  static erzeugeExamenDurchTextArgumente (
    nummer: string,
    jahr: string,
    monat: string
  ): Examen {
    return new Examen(parseInt(nummer), parseInt(jahr), parseInt(monat))
  }

  static erzeugeExamenVonPfad (pfad: string): Examen {
    const treffer = pfad.match(Examen.regExp)
    if (treffer == null || treffer.groups == null) {
      zeigeFehler(`Konnten den Examenspfad nicht lesen: ${pfad}`)
    }
    const gruppen = treffer.groups
    return Examen.erzeugeExamenDurchTextArgumente(
      gruppen.nummer,
      gruppen.jahr,
      gruppen.monat
    )
  }

  static gibReferenzVonPfad (pfad: string): string {
    const treffer = pfad.match(Examen.regExp)
    if (treffer == null || treffer.groups == null) {
      zeigeFehler(`Konnten den Examenspfad nicht lesen: ${pfad}`)
    }
    const gruppen = treffer.groups
    return `${gruppen.nummer}:${gruppen.jahr}:${gruppen.monat}`
  }

  static erzeugeExamenVonReferenz (referenz: string): Examen {
    const ergebnis = referenz.split(':')
    if (ergebnis.length !== 3) {
      zeigeFehler(
        'Eine Examens-Referenz muss in diesem Format sein: 66116:2020:09'
      )
    }
    return Examen.erzeugeExamenDurchTextArgumente(
      ergebnis[0],
      ergebnis[1],
      ergebnis[2]
    )
  }

  static erzeugePfad (
    nummer: string | number,
    jahr: string | number,
    monat: string | number
  ): string {
    return path.join('Examen', `${nummer}`, `${jahr}`, `${monat}`)
  }

  static teileReferenz (referenz: string): ExamenReferenz {
    const tmp = referenz.split(':')
    if (tmp.length !== 3) {
      console.log(
        'Eine Examens-Referenz muss in diesem Format sein: 66116:2020:09'
      )
      process.exit(1)
    }
    return {
      nummer: tmp[0],
      jahr: tmp[1],
      monat: tmp[2]
    }
  }

  get aufgabenBaum (): ExamenAufgabenBaum | undefined {
    if (this.hatAufgaben) {
      return new ExamenAufgabenBaum(this)
    }
  }
}

interface ExamensAufgabenBesucher {
  /**
   * Besuche / betrete die einzelnen Einzelprüfungsnummer.
   */
  betreteEinzelprüfungsNr?: (nummer: number) => string | undefined

  betreteJahr?: (jahr: number, nummer: number) => string | undefined

  betreteExamen?: (
    examen: Examen,
    monat: number,
    jahr: number,
    nummer: number
  ) => string | undefined

  betreteThema?: (themaNr: number, examen: Examen) => string | undefined

  betreteTeilaufgabe?: (
    teilaufgabeNr: number,
    themaNr: number,
    examen: Examen
  ) => string | undefined

  betreteAufgabe?: (
    aufgabe: ExamensAufgabe,
    aufgabeNr: number,
    teilaufgabeNr?: number,
    themaNr?: number
  ) => string | undefined

  /**
   * Verlasse die einzelnen Einzelprüfungsnummer. Zuvor wurden alle Jahre und
   * Monate / Examen besucht.
   */
  verlasseEinzelprüfungsNr?: (nummer: number) => string | undefined
}

/**
 * Interface für das Objekt, dass den rekursiven Baum mit den
 * ExamsAufgaben-Objekten enthält.
 */
interface ExamenAufgabenBaumBehälter {
  [aufgabe: string]: ExamenAufgabenBaumBehälter | Aufgabe
}

/**
 * Die Aufgaben eines Examens in einer rekursiven Baumdarstellung
 * präsentiert.
 * ```js
 * {
 *   'Thema 1': {
 *     'Teilaufgabe 1': {
 *       'Aufgabe 3': aufgabe,
 *       'Aufgabe 4': aufgabe
 *     },
 *     'Teilaufgabe 2': {
 *       'Aufgabe 2': aufgabe,
 *       'Aufgabe 4': aufgabe
 *     }
 *   },
 *   'Thema 2': {
 *     'Teilaufgabe 2': {
 *       'Aufgabe 2': aufgabe,
 *       'Aufgabe 5': aufgabe
 *     }
 *   }
 * }
 * ```
 */
class ExamenAufgabenBaum {
  baum?: ExamenAufgabenBaumBehälter

  examen: Examen

  constructor (examen: Examen) {
    this.examen = examen
    this.baum = this.baue(examen.aufgaben)
  }

  public gib (): ExamenAufgabenBaumBehälter | undefined {
    return this.baum
  }

  private baue (aufgaben: {
    [pfad: string]: Aufgabe
  }): ExamenAufgabenBaumBehälter | undefined {
    const aufgabenPfade = Object.keys(aufgaben)

    if (aufgabenPfade.length === 0) {
      return
    }

    /**
     * Thema-1: Thema 1
     * Teilaufgabe-2: Teilaufgabe 2
     * Aufgabe-3.tex: Aufgabe 3
     */
    function macheSegmenteLesbar (segment: string): string {
      return segment.replace('-', ' ').replace('.tex', '')
    }

    const collator = new Intl.Collator(undefined, {
      numeric: true,
      sensitivity: 'base'
    })

    aufgabenPfade.sort(collator.compare)

    const baum: ExamenAufgabenBaumBehälter = {}
    for (const pfad of aufgabenPfade) {
      const aufgabenPfad = pfad.replace(
        this.examen.verzeichnisRelativ + path.sep,
        ''
      )
      if (
        aufgabenPfad.match(
          /(Thema-(?<thema>\d)\/)?(Teilaufgabe-(?<teilaufgabe>\d)\/)?Aufgabe-(?<aufgabe>\d+)\.tex$/
        ) != null
      ) {
        const aufgabe = aufgaben[pfad]
        const segmente = aufgabenPfad.split(path.sep)
        let unterBaum: ExamenAufgabenBaumBehälter = baum
        for (const segment of segmente) {
          const segmentLesbar = macheSegmenteLesbar(segment)
          if (unterBaum[segmentLesbar] == null && !segment.includes('.tex')) {
            unterBaum[segmentLesbar] = {}
          } else if (segment.includes('.tex')) {
            unterBaum[segmentLesbar] = aufgabe
          }
          if (!segment.includes('.tex')) {
            unterBaum = unterBaum[segmentLesbar] as ExamenAufgabenBaumBehälter
          }
        }
      }
    }
    return baum
  }

  /**
   * Registiere die verschiedenen Besucher-Funktionen, die dann aufgerufen
   * werden sobald eine Aufgabe besucht wird.
   *
   * @param besucher - Die Besucher-Funktionen als Objekt.
   *
   * @returns Die gesammelten String-Ergebnisse, der einzelnen
   * Besucher-Funktionen-Aufrufe
   */
  besuche (besucher: ExamensAufgabenBesucher): string | undefined {
    const baum = this.baum as any

    if (baum == null) {
      return
    }

    const ausgabe = new AusgabeSammler()

    function extrahiereNummer (titel: string): number {
      const match = titel.match(/\d+/)
      if (match != null) {
        return parseInt(match[0])
      }
      throw new Error('Konnte keine Zahl finden')
    }

    let themaNr: number | undefined
    let teilaufgabeNr: number | undefined
    let aufgabeNr: number | undefined

    const rufeBesucherFunktionAuf = (
      titel: string,
      aufgabe?: ExamensAufgabe
    ): void => {
      const nr = extrahiereNummer(titel)
      if (titel.indexOf('Thema ') === 0) {
        themaNr = nr
        if (besucher.betreteThema != null) {
          ausgabe.sammle(besucher.betreteThema(themaNr, this.examen))
        }
      } else if (titel.indexOf('Teilaufgabe ') === 0) {
        teilaufgabeNr = nr
        if (besucher.betreteTeilaufgabe != null && themaNr != null) {
          ausgabe.sammle(
            besucher.betreteTeilaufgabe(teilaufgabeNr, themaNr, this.examen)
          )
        }
      } else if (titel.indexOf('Aufgabe ') === 0) {
        aufgabeNr = nr
        if (besucher.betreteAufgabe != null && aufgabe != null) {
          ausgabe.sammle(
            besucher.betreteAufgabe(aufgabe, aufgabeNr, teilaufgabeNr, themaNr)
          )
        }
      }
    }

    for (const thema in baum) {
      rufeBesucherFunktionAuf(thema, baum[thema])

      if (!(baum[thema] instanceof ExamensAufgabe)) {
        for (const teilaufgabe in baum[thema]) {
          rufeBesucherFunktionAuf(teilaufgabe, baum[thema][teilaufgabe])

          if (!(baum[thema][teilaufgabe] instanceof ExamensAufgabe)) {
            for (const aufgabe in baum[thema][teilaufgabe]) {
              rufeBesucherFunktionAuf(
                aufgabe,
                baum[thema][teilaufgabe][aufgabe]
              )
            }
          }
        }
      }
    }
    return ausgabe.gibText()
  }
}

/**
 * Interface für das Objekt, dass den rekursiven Baum mit den Examen-Objekten
 * enthält.
 */
interface ExamenBaumBehälter {
  [referenz: string]: ExamenBaumBehälter | Examen
}

export class ExamenSammlung {
  public readonly speicher: { [referenz: string]: Examen }

  public examenBaum: ExamenBaum

  constructor () {
    const dateien = glob.sync('**/Scan.pdf', {
      cwd: path.join(hauptRepoPfad, '.repos', 'examen-scans')
    })
    this.speicher = {}

    for (const pfad of dateien) {
      const examen = Examen.erzeugeExamenVonPfad(pfad)
      this.speicher[examen.referenz] = examen
    }

    this.examenBaum = new ExamenBaum(this)
  }

  gib (nummer: string, jahr: string, monat: string): Examen {
    return this.gibDurchReferenz(`${nummer}:${jahr}:${monat}`)
  }

  gibDurchPfad (pfad: string): Examen {
    return this.gibDurchReferenz(Examen.gibReferenzVonPfad(pfad))
  }

  gibDurchReferenz (referenz: string): Examen {
    return this.speicher[referenz]
  }

  /**
   * @returns
   *
   * ```js
   * {
   *    '66116' : { '2021': { '03': Examen } }
   * }
   * ```
   */
  get baum (): ExamenBaumBehälter {
    return this.examenBaum.baum
  }
}

/**
 * ```js
 * {
 *    '66116' : {
 *      '2021': {
 *        '03': Examen,
 *        '09': Examen
 *     }
 *   }
 * }
 * ```
 */
class ExamenBaum {
  sammlung: ExamenSammlung

  baum: ExamenBaumBehälter
  constructor (sammlung: ExamenSammlung) {
    this.sammlung = sammlung
    this.baum = this.baue()
  }

  /**
   * @returns
   *
   * ```js
   * {
   *    '66116' : { '2021': { '03': Examen } }
   * }
   * ```
   */
  private baue (): ExamenBaumBehälter {
    const referenzen = Object.keys(this.sammlung.speicher)
    referenzen.sort(undefined)

    const baum: ExamenBaumBehälter = {}
    for (const referenz of referenzen) {
      const examen = this.sammlung.speicher[referenz]
      const segmente = referenz.split(':')
      let unterBaum: ExamenBaumBehälter = baum
      for (const segment of segmente) {
        if (unterBaum[segment] == null) {
          unterBaum[segment] = {}
        }

        if (segment === '03' || segment === '09') {
          unterBaum[segment] = examen
        } else {
          unterBaum = unterBaum[segment] as ExamenBaumBehälter
        }
      }
    }
    return baum
  }

  besuche (besucher: ExamensAufgabenBesucher): string {
    const examenBaum = examenSammlung.baum as any
    const ausgabe = new AusgabeSammler()
    for (const nummer in examenBaum) {
      if (besucher.betreteEinzelprüfungsNr != null) {
        ausgabe.sammle(besucher.betreteEinzelprüfungsNr(parseInt(nummer)))
      }
      for (const jahr in examenBaum[nummer]) {
        if (besucher.betreteJahr != null) {
          ausgabe.sammle(besucher.betreteJahr(parseInt(jahr), parseInt(nummer)))
        }
        for (const monat in examenBaum[nummer][jahr]) {
          const examen = examenBaum[nummer][jahr][monat] as Examen
          if (besucher.betreteExamen != null) {
            ausgabe.sammle(
              besucher.betreteExamen(
                examen,
                parseInt(monat),
                parseInt(jahr),
                parseInt(nummer)
              )
            )
          }
          if (
            besucher.betreteThema != null ||
            besucher.betreteTeilaufgabe != null ||
            besucher.betreteAufgabe != null
          ) {
            ausgabe.sammle(examen.aufgabenBaum?.besuche(besucher))
          }
        }
      }

      if (besucher.verlasseEinzelprüfungsNr != null) {
        ausgabe.sammle(besucher.verlasseEinzelprüfungsNr(parseInt(nummer)))
      }
    }
    return ausgabe.gibText()
  }
}

// auch in .tex/pakete/basis.sty
export const examensTitel: { [key: number]: string } =
  konfiguration.einzelPruefungen

let examenSammlung: ExamenSammlung

export function gibExamenSammlung (): ExamenSammlung {
  if (examenSammlung == null) {
    examenSammlung = new ExamenSammlung()
  }
  return examenSammlung
}
