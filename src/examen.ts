import path from 'path'
import glob from 'glob'

import {
  repositoryPfad,
  zeigeFehler,
  macheRelativenPfad,
  generiereLink,
  AusgabeSammler
} from './helfer'
import { Aufgabe, ExamensAufgabe } from './aufgabe'

export interface ExamenReferenz {
  nummer: string
  jahr: string
  monat: string
}

/**
 * Die Klasse Examen repräsentiert eine Staatsexamensprüfung.
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
   *    'Staatsexamen/66116/2021/03/Thema-2/Teilaufgabe-2/Aufgabe-5.tex': aufgabe
   * }
   * ```
   */
  aufgaben: { [pfad: string]: Aufgabe } = {}

  static regExp: RegExp = /^.*(?<nummer>\d{5})\/(?<jahr>\d{4})\/(?<monat>\d{2})\/.*$/

  /**
   * @param nummer Die Examens-Nummer, z. B. 65116
   * @param jahr Das Jahr in dem das Staatsexamen statt fand, z. b. 2021
   * @param monat Das Monat, in dem das Staatsexamen statt fand. Mögliche Werte 3 für Frühjahr und 9 für Herbst.
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
   * z. B. `...github/hbschlang/lehramt-informatik/Staatsexamen/66116/2020/09/Scan.pdf`
   */
  get pfad (): string {
    return path.join(
      repositoryPfad,
      Examen.erzeugePfad(this.nummer, this.jahr, this.monatMitNullen),
      'Scan.pdf'
    )
  }

  /**
   * Der übergeordnete Ordner, in dem das Staatsexamen liegt.
   *
   * @returns z. B. `...github/hbschlang/lehramt-informatik/Staatsexamen/66116/2020/09`
   */
  get verzeichnis (): string {
    return path.dirname(this.pfad)
  }

  /**
   * Der übergeordnete Ordner, in dem das Staatsexamen liegt, als relativen Pfad.
   *
   * @returns z. B. `Staatsexamen/66116/2020/09`
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
    return generiereLink(text, this.machePfad(...pfadSegmente))
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
      'Die Monatsangabe in der Klasse Staatsexamen darf nur 3 oder 9 lauten.'
    )
  }

  /**
   * @returns Ein lesbarer Dateiname, der das Examen identifiziert.
   */
  get dateiName (): string {
    return `Staatsexamen-Informatik_${this.nummer}-${this.jahr}-${this.jahreszeit}`
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
        'Eine Staatsexamens-Referenz muss in diesem Format sein: 66116:2020:09'
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
    return path.join('Staatsexamen', `${nummer}`, `${jahr}`, `${monat}`)
  }

  static teileReferenz (referenz: string): ExamenReferenz {
    const tmp = referenz.split(':')
    if (tmp.length !== 3) {
      console.log(
        'Eine Staatsexamens-Referenz muss in diesem Format sein: 66116:2020:09'
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
  besucheThema?: (
    nummer: number,
    examen?: Examen,
    aufgabe?: ExamensAufgabe
  ) => string | undefined

  besucheTeilaufgabe?: (
    nummer: number,
    examen?: Examen,
    aufgabe?: ExamensAufgabe
  ) => string | undefined

  besucheAufgabe?: (
    nummer: number,
    examen?: Examen,
    aufgabe?: ExamensAufgabe
  ) => string | undefined
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

    var collator = new Intl.Collator(undefined, {
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
  registriereBesucher (besucher: ExamensAufgabenBesucher): string | undefined {
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

    const rufeBesucherFunktionAuf = (
      titel: string,
      aufgabe?: ExamensAufgabe
    ): void => {
      const nr = extrahiereNummer(titel)
      if (titel.indexOf('Thema ') === 0) {
        if (besucher.besucheThema != null) {
          ausgabe.sammle(besucher.besucheThema(nr, this.examen, aufgabe))
        }
      } else if (titel.indexOf('Teilaufgabe ') === 0) {
        if (besucher.besucheTeilaufgabe != null) {
          ausgabe.sammle(besucher.besucheTeilaufgabe(nr, this.examen, aufgabe))
        }
      } else if (titel.indexOf('Aufgabe ') === 0) {
        if (besucher.besucheAufgabe != null) {
          ausgabe.sammle(besucher.besucheAufgabe(nr, this.examen, aufgabe))
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

interface ExamenBesucher {
  besucheNr?: (nummer: number) => string | undefined

  besucheJahr?: (jahr: number, nummer: number) => string | undefined

  besucheExamen?: (
    examen: Examen,
    monat: number,
    jahr: number,
    nummer: number
  ) => string | undefined
}

export class ExamenSammlung {
  public readonly speicher: { [referenz: string]: Examen }

  private examenBaum?: ExamenBaum

  constructor () {
    const dateien = glob.sync('**/Scan.pdf', { cwd: repositoryPfad })
    this.speicher = {}

    for (const pfad of dateien) {
      const examen = Examen.erzeugeExamenVonPfad(pfad)
      this.speicher[examen.referenz] = examen
    }
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
    if (this.examenBaum == null) {
      this.examenBaum = new ExamenBaum(this)
    }
    return this.examenBaum.baum
  }
}

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

  registriereBesucher (besucher: ExamenBesucher): string {
    const examenBaum = examenSammlung.baum as any
    const ausgabe = new AusgabeSammler()
    for (const nummer in examenBaum) {
      if (besucher.besucheNr != null) {
        ausgabe.sammle(besucher.besucheNr(parseInt(nummer)))
      }
      for (const jahr in examenBaum[nummer]) {
        if (besucher.besucheJahr != null) {
          ausgabe.sammle(besucher.besucheJahr(parseInt(jahr), parseInt(nummer)))
        }
        for (const monat in examenBaum[nummer][jahr]) {
          if (besucher.besucheExamen != null) {
            const examen = examenBaum[nummer][jahr][monat]
            ausgabe.sammle(
              besucher.besucheExamen(
                examen,
                parseInt(monat),
                parseInt(jahr),
                parseInt(nummer)
              )
            )
          }
        }
      }
    }
    return ausgabe.gibText()
  }
}

// auch in .tex/pakete/basis.sty
export const examensTitel: { [key: number]: string } = {
  46110: 'Grundlagen der Informatik (nicht vertieft)',
  46111: 'Programmentwicklung / Systemprogrammierung / Datenbanksysteme (nicht vertieft)',
  46112: 'Grundlagen der Informatik (nicht vertieft)',
  46113: 'Theoretische Informatik (nicht vertieft)',
  46114: 'Algorithmen / Datenstrukturen / Programmiermethoden (nicht vertieft)',
  46115: 'Theoretische Informatik / Algorithmen / Datenstrukturen (nicht vertieft)',
  46116: 'Softwaretechnologie / Datenbanksysteme (nicht vertieft)',
  46118: 'Fachdidaktik (Mittelschulen)',
  46119: 'Fachdidaktik (Realschulen)',
  46121: 'Fachdidaktik (berufliche Schulen)',
  66110: 'Automatentheorie, Algorithmische Sprache (vertieft)',
  66111: 'Betriebssysteme / Datenbanksysteme / Rechnerarchitektur (vertieft)',
  66112: 'Automatentheorie / Komplexität / Algorithmen (vertieft)',
  66113: 'Rechnerarchitektur / Datenbanken / Betriebssysteme (vertieft)',
  66114: 'Datenbank- und Betriebssysteme (vertieft)',
  66115: 'Theoretische Informatik / Algorithmen (vertieft)',
  66116: 'Datenbanksysteme / Softwaretechnologie (vertieft)',
  66118: 'Fachdidaktik (Gymnasium)'
}

let examenSammlung: ExamenSammlung

export function gibExamenSammlung (): ExamenSammlung {
  if (examenSammlung == null) {
    examenSammlung = new ExamenSammlung()
  }
  return examenSammlung
}
