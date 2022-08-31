import path from 'path'
import fs from 'fs'
import glob from 'glob'

import {
  leseRepoDatei,
  repositoryPfad,
  generiereLink,
  macheRelativenPfad,
  öffneVSCode,
  zeigeFehler
} from './helfer'
import { sammleStichwörter, gibInhaltEinesTexMakros } from './tex'
import { Examen, ExamenSammlung, gibExamenSammlung } from './examen'

function umgebeMitKlammern (text: string): string {
  return `{${text}}`
}

const bearbeitungsStand = [
  'unbekannt',
  'OCR',
  'TeX-Fehler',
  'nur Angabe',
  'mit Lösung'
] as const

/**
 * Wie ist der Bearbeitungsstand in Bezug auf den Satz im TeX-System.
 *
 * - unbekannt:  Werden die Metadaten automatisch erzeugt, ist der
 *               Bearbeitungsstand zuerst unbekannt.
 * - OCR:        Das Ergebnis der Texterkennung (OCR = Optical Character
 *               Recognition) wurde übernommen. Außer der TeX-Klasse ist noch
 *               nichts geTeXt.
 * - TeX-Fehler: Die TeX-Datei kompiliert nicht.
 * - nur Angabe: Die Angabe, d.h. die Aufgabenstellung wurde geTeXt.
 * - mit Lösung: Auch die Lösung wurde geTeXt.
 */
type BearbeitungsStand = typeof bearbeitungsStand[number]

const korrektheit = [
  'wahrscheinlich falsch',
  'unbekannt',
  'korrekt',
  'korrekt und überprüft'
] as const

/**
 * Information im Bezug auf die Korrektheit der Lösung.
 *
 * - `wahrscheinlich falsch`: Die Lösung ist wahrscheinlich falsch.
 * - `unbekannt`: Die Korrektheit der Lösung ist unbekannt.
 * - `korrekt`: Die Lösung ist korrekt.
 * - `korrekt und überprüft`: Die Lösung ist korrekt, da sie überprüft und bestätigt wurde.
 */
type Korrektheit = typeof korrektheit[number]

/**
 * Die Attribute beginnen hier mit Großbuchstaben, damit sie nicht für
 * die TeX-Ausgabe konvertiert werden müssen. Wir verwenden `PascalCase` als
 * Schlüsselnamen ähnlich wie das TeX-Paket `fontspec`.
 *
 * Siehe `.tex/pakete/aufgaben-metadaten.sty` und `.tex/pakete/basis.sty`
 */
export interface AufgabenMetadaten {
  /**
   * Der Titel der Aufgabe. Bei Examensaufgabe schlichtweg `Aufgabe 1`
   */
  Titel: string

  /**
   * Kurze Beschreibung, damit wir uns an die Aufgabe erinnern können. Was ist
   * das besondere an dieser Aufgabe?
   */
  Thematik?: string

  /**
   *
   */
  Referenz?: string

  /**
   * Alle Stichwörter mit `, ` zu einem String zusammengefügt.
   */
  Stichwoerter?: string

  /**
   * Erstes Makro `\footcite`, der Inhalt in den geschweiften Klammern, z. B.
   * `\footcite[Aufgabe 2]{aud:ab:7}`: `aud:ab:7`
   */
  ZitatSchluessel?: string

  /**
   * Erstes Makro `\footcite`, der Inhalt in den eckigen Klammern, z. B.
   * `\footcite[Aufgabe 2]{aud:ab:7}`: `Aufgabe 2`
   */
  ZitatBeschreibung?: string

  /**
   * Siehe Dokumentation des Typs.
   */
  BearbeitungsStand: BearbeitungsStand

  /**
   * Siehe Dokumentation des Typs.
   */
  Korrektheit: Korrektheit

  /**
   * Wie würde die Korrektheit der Aufgabe überprüft? Mit welchem Online-Tool
   * wurde die Aufgabe überprüft. Wer hat die Aufgabe überprüft?
   */
  Ueberprueft?: string

  /**
   * Der relative Datei-Pfad der Aufgabe, z. B. `Staatsexamen/46116/2016/03/Thema-2/Teilaufgabe-1/Aufgabe-2.tex`
   */
  RelativerPfad: string

  /**
   * Relativer Pfad zu einer identischen Aufgabe z. B. `Staatsexamen/46116/2016/03/Thema-2/Teilaufgabe-1/Aufgabe-2.tex`
   */
  IdentischeAufgabe?: string

  /**
   * Die sogenannte Einzelprüfungsnummer, z. B. `66115`.
   */
  EinzelpruefungsNr?: number

  /**
   * z. B. `Datenbanksysteme / Softwaretechnologie (vertieft)`
   */
  ExamenFach?: string

  /**
   * Das Jahr, in dem das Examen stattfindet.
   *
   * z. B. `2021`
   */
  Jahr?: number

  /**
   * Der Monat mit Nullen, in dem das Examen stattfindet. Für Frühjahr `03` und
   * für Herbst `09`.
   */
  Monat?: string

  /**
   * In welcher Jahreszeit das Examen stattfindet. Der Monat 3 gibt
   * `Frühjahr` und der Monat 9 `Herbst`.
   */
  Jahreszeit?: string
  ThemaNr?: number
  TeilaufgabeNr?: number
  AufgabeNr?: number
}

/**
 * Eine allgemeine Aufgabe, die keinem Examen zugeordnet werden kann.
 */
export class Aufgabe {
  /**
   * Der absolute Pfad zur Aufgabe
   */
  pfad: string

  /**
   * Der Textinhalt der Aufgabe, d. h. das TeX-Markup als String.
   */
  inhalt: string

  stichwörter: string[] = []

  metadaten_?: AufgabenMetadaten

  /**
   * Zeigt an, ob die Aufgabe eine normale Aufgabe ist oder eine Examensaufgabe.
   * Dieser Wert wird in der spezialisierten Klasse Examensaufgabe auf wahr gesetzt.
   */
  istExamen: boolean = false

  static pfadRegExp: RegExp = /.*Aufgabe_.*\.tex/

  constructor (pfad: string) {
    this.pfad = Aufgabe.normalisierePfad(pfad)
    if (!fs.existsSync(this.pfad)) {
      this.inhalt = ''
    } else {
      this.inhalt = leseRepoDatei(this.pfad)
    }

    this.stichwörter = sammleStichwörter(this.inhalt)

    const metaDaten = this.leseMetadatenVonTex()
    if (metaDaten != null) {
      this.metadaten_ = metaDaten
    }

    this.validiere(this.bearbeitungsStand, bearbeitungsStand)
    this.validiere(this.korrektheit, korrektheit)
  }

  /**
   * Normalisiere den Dateipfad der Aufgabe. Er sollte immer als absoluter Pfad vorliegen.
   *
   * @param pfad - Ein möglicherweise relativer Dateipfad
   * @returns Ein absoluter Pfad.
   */
  static normalisierePfad (pfad: string): string {
    if (pfad.charAt(0) === path.sep) {
      return pfad
    }
    if (pfad.includes(repositoryPfad)) {
      return pfad
    }
    return path.join(repositoryPfad, pfad)
  }

  static istAufgabe (pfad: string): boolean {
    if (pfad.match(Aufgabe.pfadRegExp) != null) {
      return true
    }
    return false
  }

  static vergleichePfade (a: Aufgabe, b: Aufgabe): number {
    if (a.pfad < b.pfad) {
      return -1
    }
    if (a.pfad > b.pfad) {
      return 1
    }
    return 0
  }

  /**
   * ```tex
   * \bAufgabenMetadaten{
   *   Titel = {Aufgabe 5},
   *   Thematik = {Regal mit DVDs, CDs und BDs},
   *   RelativerPfad = Staatsexamen/66116/2014/09/Thema-2/Teilaufgabe-2/Aufgabe-5.tex,
   *   ZitatSchluessel = examen:66116:2014:09,
   *   EinzelpruefungsNr = 66116,
   *   Jahr = 2014,
   *   Monat = 09,
   *   ThemaNr = 2,
   *   TeilaufgabeNr = 2,
   *   AufgabeNr = 5,
   * }
   * ```
   */
  private leseMetadatenVonTex (): AufgabenMetadaten | undefined {
    function reinige (text: string): string {
      text = text.trim()
      text = text.replace(/\}?,$/, '')
      text = text.replace(/^\{?/, '')
      text = text.trim()
      return text
    }
    const ergebnis: any = {}
    const match = this.inhalt.match(
      new RegExp(/\\bAufgabenMetadaten{(.*)\n}/, 's')
    )
    if (match != null) {
      const zeilen = match[1]
      for (const zeile of zeilen.split('\n')) {
        const schlüsselWert = zeile.split('=')
        if (schlüsselWert.length === 2) {
          ergebnis[reinige(schlüsselWert[0])] = reinige(schlüsselWert[1])
        }
      }
      return ergebnis as AufgabenMetadaten
    }
  }

  /**
   * Erzeuge eine Objekt, dass dem Interface AufgabenMetadaten entspricht.
   * Die Reihenfolge der Attribute sollte eingehalten werden.
   */
  public erzeugeMetadaten (): AufgabenMetadaten {
    // eslint-disable-next-line
    const meta: AufgabenMetadaten = {
      Titel: umgebeMitKlammern(this.titel),
      Thematik: umgebeMitKlammern(this.thematik),
      Referenz: this.referenz,
      RelativerPfad: this.relativerPfad
    } as AufgabenMetadaten

    if (this.identischeAufgabe != null) {
      meta.IdentischeAufgabe = this.identischeAufgabe
    }

    // Zitat
    if (this.zitat != null) {
      meta.ZitatSchluessel = this.zitat[0]
      if (this.zitat.length > 1) {
        meta.ZitatBeschreibung = umgebeMitKlammern(this.zitat[1])
      }
    }

    meta.BearbeitungsStand = this.bearbeitungsStand
    meta.Korrektheit = this.korrektheit
    if (this.überprüft != null) {
      meta.Ueberprueft = umgebeMitKlammern(this.überprüft)
    } else {
      meta.Ueberprueft = umgebeMitKlammern('unbekannt')
    }

    if (this.stichwörter.length > 0) {
      meta.Stichwoerter = umgebeMitKlammern(this.stichwörter.join(', '))
    }

    return meta
  }

  private validiere (
    gegebenerWert: string | undefined,
    gültigeWerte: readonly string[]
  ): void {
    if (gegebenerWert != null && !gültigeWerte.includes(gegebenerWert)) {
      console.log('Der Wert ist nicht gültig: ' + gegebenerWert)
      console.log('Gültige Werte: ' + gültigeWerte.toString())
      öffneVSCode(this.pfad)
    }
  }

  /**
   * Der Titel einer Aufgabe. Er wird zuerst aus den TeX-Metadaten
   * `\bAufgabenMetadaten` (`Titel`) gelesen, anschließend aus dem ersten
   * `\section`-Makro. Wird kein Titel in der TeX-Datei gefunden, so lautet der
   * Titel `Aufgabe`.
   */
  get titel (): string {
    if (this.metadaten_ != null) {
      return this.metadaten_.Titel
    }

    const section = this.inhalt.match(/\\section\{(.+?)[\n\\}{]/)
    if (section?.[1] != null) {
      return section[1]
    }

    return 'Aufgabe'
  }

  /**
   * Die Thematik (wenige Wörter um sich an eine Aufgabe erinnern zu können)
   * einer Aufgabe. Er wird zuerst aus den TeX-Metadaten `\bAufgabenMetadaten`
   * (`Themaik`) gelesen, anschließend aus dem ersten `\bAufgabenTitel`-Makro.
   * Wird kein Titel in der TeX-Datei gefunden, so lautet der Titel `keine
   * Thematik`.
   */
  get thematik (): string {
    if (this.metadaten_?.Thematik != null) {
      return this.metadaten_.Thematik
    }

    const thematik = gibInhaltEinesTexMakros('bAufgabenTitel', this.inhalt)
    if (thematik != null) {
      return thematik
    }

    return 'keine Thematik'
  }

  /**
   * Inhalt des ersten `\footcite[ZitatBeschreibung]{ZitatSchluessel}` Makros
   * als Array `[ZitatSchluessel, ZitatBeschreibung]`.
   */
  get zitat (): string[] | undefined {
    const match = this.inhalt.match(/\\footcite(\[([^\]]+)\])?\{([^}]+)\}/)
    if (match != null) {
      const zitat = []
      if (match[3] != null) {
        zitat.push(match[3])
      }
      if (match[2] != null) {
        zitat.push(match[2])
      }
      return zitat
    }
  }

  /**
   * Siehe Dokumentation des Typs
   */
  get bearbeitungsStand (): BearbeitungsStand {
    if (this.metadaten_?.BearbeitungsStand != null) {
      return this.metadaten_.BearbeitungsStand
    }
    return 'unbekannt'
  }

  get bearbeitungsStandGrad (): number {
    return bearbeitungsStand.indexOf(this.bearbeitungsStand)
  }

  /**
   * Siehe Dokumentation des Typs
   */
  get korrektheit (): Korrektheit {
    if (this.metadaten_?.Korrektheit != null) {
      return this.metadaten_.Korrektheit
    }
    return 'unbekannt'
  }

  get korrektheitGrad (): number {
    return korrektheit.indexOf(this.korrektheit)
  }

  /**
   * Zeigt an, ob die Aufgabe korrekt ist. Das ist der Fall wenn in den
   * Aufgabenmetadaten `korrekt` oder `korrekt und überprüft` steht.
   */
  get istKorrekt (): boolean {
    return (
      this.korrektheit === 'korrekt' ||
      this.korrektheit === 'korrekt und überprüft'
    )
  }

  get überprüft (): string | undefined {
    if (this.metadaten_?.Ueberprueft != null) {
      return this.metadaten_.Ueberprueft
    }
  }

  /**
   * Ein kurzer String, mit dem die Aufgabe eindeutig referenziert werden kann,
   * z. B. über das `\ref{}` TeX-Makro. Für die Referenz von normalen Aufgaben
   * verwenden wir den relativen Pfad und entfernen einige nicht relevante
   * Zeichenketten.
   */
  get referenz (): string {
    return this.relativerPfad
      .replace('Module/', '')
      .replace('Aufgabe_', '')
      .replace('.tex', '')
      .replace(/\d\d_/g, '')
      .replace(/\//g, '.')
  }

  /**
   * Siehe Dokumentation des Typs
   */
  get identischeAufgabe (): string | undefined {
    if (this.metadaten_?.IdentischeAufgabe != null) {
      return this.metadaten_.IdentischeAufgabe
    }
  }

  get titelFormatiert (): string {
    let titel: string
    if (this.titel != null) {
      titel = `„${this.titel}“`
    } else {
      titel = 'Aufgabe'
    }

    return titel
  }

  /**
   * `this.titel „this.thematik“`
   *
   * z. B. `Übung zum Master-Theorem` oder `Aufgabe 1 „Kleintierverein“`
   */
  get titelThematikFormatiert (): string {
    let ausgabe: string = this.titel
    if (this.thematik !== 'keine Thematik') {
      ausgabe += ` „${this.thematik}“`
    }
    return ausgabe
  }

  get stichwörterFormatiert (): string {
    if (this.stichwörter != null && this.stichwörter.length > 0) {
      return ` (${this.stichwörter.join(', ')})`
    }
    return ''
  }

  /**
   * Formatierter Link zur Tex-Datei.
   */
  get linkTex (): string {
    return generiereLink('.tex', this.pfad, { linkePdf: false })
  }

  /**
   * Formatierter Link zur PDF-Datei auf Github mit den Stichwörtern.
   */
  get link (): string {
    return (
      generiereLink(this.titelThematikFormatiert, this.pfad) +
      this.stichwörterFormatiert +
      ' (' +
      this.linkTex +
      ') '
    )
  }

  get einbindenTexMakro (): string {
    let relativerPfad = macheRelativenPfad(this.pfad)
    relativerPfad = relativerPfad.replace('.tex', '')
    return `\\bAufgabe{${relativerPfad}}`
  }

  get relativerPfad (): string {
    return macheRelativenPfad(this.pfad)
  }
}

/**
 * Eine Examensaufgabe
 */
export class ExamensAufgabe extends Aufgabe {
  public thema?: number
  public teilaufgabe?: number
  public aufgabe: number

  examen: Examen

  static pfadRegExp: RegExp = /(?<nummer>\d{5})\/(?<jahr>\d{4})\/(?<monat>\d{2})\/(Thema-(?<thema>\d)\/)?(Teilaufgabe-(?<teilaufgabe>\d)\/)?Aufgabe-(?<aufgabe>\d+)\.tex$/

  static schwacherPfadRegExp: RegExp = /(Thema-(?<thema>\d)\/)?(Teilaufgabe-(?<teilaufgabe>\d)\/)?Aufgabe-(?<aufgabe>\d+)\.tex$/

  constructor (pfad: string, examen: Examen) {
    super(pfad)
    this.examen = examen
    this.istExamen = true
    examen.aufgaben[pfad] = this
    const treffer = pfad.match(ExamensAufgabe.pfadRegExp)
    if (treffer == null || treffer.groups == null) {
      zeigeFehler(`Konnte den Pfad der Examensaufgabe nicht lesen: ${pfad}`)
    }
    const gruppen = treffer.groups
    this.aufgabe = parseInt(gruppen.aufgabe)
    if (gruppen.thema != null) {
      this.thema = parseInt(gruppen.thema)
    }
    if (gruppen.teilaufgabe != null) {
      this.teilaufgabe = parseInt(gruppen.teilaufgabe)
    }
  }

  /**
   * @param referenz z. B. `66116:2021:03`
   * @param arg1 Thema-Nummer, Teilaufgaben-Nummer oder Aufgaben-Nummer
   * @param arg2 Teilaufgabe-Nummer oder Aufgabe-Nummer
   * @param arg3 Aufgabe-Nummer
   */
  public static erzeugeExamensAufgabe (
    referenz: string,
    arg1: string | number,
    arg2?: string | number,
    arg3?: string | number
  ): ExamensAufgabe {
    function gibNummer (arg: string | number | undefined): number | undefined {
      if (typeof arg === 'number') {
        return arg
      } else if (typeof arg === 'string') {
        return parseInt(arg)
      }
    }

    if (typeof arg1 === 'string') {
      arg1 = parseInt(arg1)
    }

    const pfad = ExamensAufgabe.erzeugePfad(
      arg1,
      gibNummer(arg2),
      gibNummer(arg3)
    )
    const examen = Examen.erzeugeExamenVonReferenz(referenz)
    return new ExamensAufgabe(path.join(examen.verzeichnis, pfad), examen)
  }

  static istExamensAufgabe (pfad: string): boolean {
    if (pfad.match(ExamensAufgabe.pfadRegExp) != null) {
      return true
    }
    return false
  }

  erzeugeMetadaten (): AufgabenMetadaten {
    const meta = super.erzeugeMetadaten()

    meta.EinzelpruefungsNr = this.examen.nummer
    meta.Jahr = this.examen.jahr
    meta.Monat = this.examen.monatMitNullen

    if (this.thema != null) {
      meta.ThemaNr = this.thema
    }
    if (this.teilaufgabe != null) {
      meta.TeilaufgabeNr = this.teilaufgabe
    }

    meta.AufgabeNr = this.aufgabe
    return meta
  }

  /**
   * z. B. `66116:2021:09`
   */
  get examensReferenz (): string {
    return this.examen.referenz
  }

  get aufgabeFormatiert (): string {
    return `Aufgabe ${this.aufgabe}`
  }

  /**
   * z. B. `T1 TA2 A1`
   */
  get aufgabenReferenz (): string {
    const output = []
    if (this.thema != null) {
      output.push(`T${this.thema}`)
    }
    if (this.teilaufgabe != null) {
      output.push(`TA${this.teilaufgabe}`)
    }
    output.push(`A${this.aufgabe}`)
    return output.join(' ')
  }

  /**
   * Wie `this.aufgabenReferenz` bloß ohne Leerzeichen, z. B.
   */
  get aufgabenReferenzKurz (): string {
    return this.aufgabenReferenz.replace(/ +/g, '')
  }

  /**
   * Ein kurzer String mit der die Aufgabe eindeutig referenziert werden kann,
   * z. B. über das `\ref{}` TeX-Makro.
   *
   * `66116-2020-H.T1-TA1-A1`
   */
  get referenz (): string {
    return (
      this.examen.nummer.toString() +
      '-' +
      this.examen.jahr.toString() +
      '-' +
      this.examen.jahreszeitBuchstabe +
      '.' +
      this.aufgabenReferenz.replace(/ +/g, '-')
    )
  }

  /**
   * `„Greedy-Färben von Intervallen“ Examen 66115 Herbst 2017 T1 A8`
   */
  get titelKurz (): string {
    // `„Greedy-Färben von Intervallen“ Examen 66115 Herbst 2017 T1 A8`
    // const ausgabe = `${this.examen.titelKurz} ${this.aufgabenReferenz}`
    const ausgabe = `${this.examensReferenz} ${this.aufgabenReferenzKurz}`
    if (this.thematik !== 'keine Thematik') {
      return `„${this.thematik}“ ${ausgabe}`
    }
    return ausgabe
  }

  gibTitelNurAufgabe (alsMarkdownLink: boolean = false): string {
    const ausgabe = `Aufgabe ${this.aufgabe}${this.stichwörterFormatiert}`
    if (alsMarkdownLink) {
      return (
        generiereLink(ausgabe, this.pfad) +
        ' (' +
        generiereLink('.tex', this.pfad.replace(/\.pdf$/, '.tex'), {
          linkePdf: false
        }) +
        ')'
      )
    }
    return ausgabe
  }

  get dateiName (): string {
    const aufgabenReferenz = this.aufgabenReferenz.replace(/ /g, '-')
    return `${this.examen.dateiName}_${aufgabenReferenz}`
  }

  get link (): string {
    return (
      generiereLink(this.titelKurz, this.pfad) +
      this.stichwörterFormatiert +
      ' (' +
      this.linkTex +
      ') '
    )
  }

  static erzeugePfad (arg1: number, arg2?: number, arg3?: number): string {
    if (arg1 != null && arg2 != null && arg3 != null) {
      return path.join(
        `Thema-${arg1}`,
        `Teilaufgabe-${arg2}`,
        `Aufgabe-${arg3}.tex`
      )
    } else if (arg1 != null && arg2 != null && arg3 == null) {
      return path.join(`Thema-${arg1}`, `Aufgabe-${arg2}.tex`)
    } else {
      return `Aufgabe-${arg1}.tex`
    }
  }

  /**
   * Erzeugt ein TeX-Makro mit dem die Aufgabe in ein anderes Dokument
   * eingebunden werden kann. Es handelt sich hierbei um die neue Version des
   * Einbinden-Makros.
   *
   * @returns z. B.
   * `\bExamensAufgabe{66116/2017/03/Thema-1/Teilaufgabe-1/Aufgabe-2}`
   */
  get einbindenTexMakro (): string {
    let relativerPfad = macheRelativenPfad(this.pfad)
    relativerPfad = relativerPfad.replace('Staatsexamen/', '')
    relativerPfad = relativerPfad.replace('.tex', '')
    return `\\bExamensAufgabe{${relativerPfad}}`
  }

  /**
   * Erzeugt ein TeX-Makro mit dem die Aufgabe in ein anderes Dokument
   * eingebunden werden kann. Es handelt sich hierbei um die alte Version des
   * Einbinden-Makros.
   *
   * @returns z. B. `\ExamensAufgabeTTA 66116 / 2021 / 03 : Thema 1 Teilaufgabe
   * 1 Aufgabe 1`
   */
  get einbindenTexMakroAlt (): string {
    let aufgabe = ''
    let suffix = ''
    const examen = `${this.examen.nummer} / ${this.examen.jahr} / ${this.examen.monat} :`
    if (
      this.thema != null &&
      this.teilaufgabe != null &&
      this.aufgabe != null
    ) {
      aufgabe = `Thema ${this.thema} Teilaufgabe ${this.teilaufgabe} Aufgabe ${this.aufgabe}`
      suffix = 'TTA'
    } else if (
      this.thema != null &&
      this.aufgabe != null &&
      this.teilaufgabe == null
    ) {
      aufgabe = `Thema ${this.thema} Aufgabe ${this.aufgabe}`
      suffix = 'TA'
    } else {
      aufgabe = `Aufgabe ${this.aufgabe}`
      suffix = 'A'
    }
    return `\n\\ExamensAufgabe${suffix} ${examen} ${aufgabe}`
  }
}

export class AufgabenSammlung {
  aufgaben: { [pfad: string]: Aufgabe }

  examenSammlung: ExamenSammlung

  constructor (examenSammlung: ExamenSammlung) {
    this.examenSammlung = examenSammlung
    this.aufgaben = {}
    const dateien = glob.sync('**/*.tex', { cwd: repositoryPfad })
    this.aufgaben = {}
    for (const pfad of dateien) {
      const aufgabe = this.erzeugeAufgabe(pfad)
      if (aufgabe != null) {
        this.aufgaben[macheRelativenPfad(pfad)] = aufgabe
      }
    }
  }

  istAufgabenPfad (pfad: string): boolean {
    return ExamensAufgabe.istExamensAufgabe(pfad) || Aufgabe.istAufgabe(pfad)
  }

  erzeugeAufgabe (pfad: string): Aufgabe | undefined {
    if (ExamensAufgabe.istExamensAufgabe(pfad)) {
      return new ExamensAufgabe(pfad, this.examenSammlung.gibDurchPfad(pfad))
    } else if (Aufgabe.istAufgabe(pfad)) {
      return new Aufgabe(pfad)
    }
  }

  gib (pfad: string): Aufgabe {
    return this.aufgaben[macheRelativenPfad(pfad)]
  }
}

let aufgabenSammlung: AufgabenSammlung

export function gibAufgabenSammlung (): AufgabenSammlung {
  if (aufgabenSammlung == null) {
    aufgabenSammlung = new AufgabenSammlung(gibExamenSammlung())
  }
  return aufgabenSammlung
}
