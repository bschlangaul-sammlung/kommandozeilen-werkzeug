import chalk from 'chalk'
import childProcess from 'child_process'
import fs from 'fs'
import path from 'path'

export function leseDatei (pfad: string): string {
  return fs.readFileSync(pfad, { encoding: 'utf-8' })
}

export function löscheDatei (pfad: string): void {
  if (!fs.existsSync(pfad)) {
    return
  }
  fs.unlinkSync(pfad)
}

/**
 * @param pfad - Der Dateipfad, an dem die Text-Datei erzeugt werden soll.
 * @param inhalt - Der Text-Inhalt, der in die Datei geschrieben werden soll.
 */
export function schreibeDatei (pfad: string, inhalt: string): void {
  fs.mkdirSync(path.dirname(pfad), { recursive: true })
  fs.writeFileSync(pfad, inhalt, { encoding: 'utf-8' })
}

export function zeigeFehler (meldung: string): never {
  console.error(chalk.red(meldung))
  process.exit(1)
}

interface Repository {
  /**
   * z. B. Der Name des Repository
   * `https://github.com/bschlangaul-sammlung/examens-aufgaben-tex` ist
   * `examens-aufgaben-tex`
   */
  name: string

  /**
   * Absoluter Dateipfad zur lokalen Kopie des Repository.
   */
  lokalerPfad: string
}

interface Konfiguration {
  /**
   * z. B. `examensAufgabenTex`
   */
  hauptRepo: string

  repos: { [repoId: string]: Repository }

  einzelPruefungen: Record<string, string>

  github: {
    /**
     * z. B. `https://github.com/bschlangaul-sammlung`
     */
    domain: string

    /**
     * z. B. `https://github.com/bschlangaul-sammlung/<name>`
     */
    url: string

    /**
     * z. B. `https://raw.githubusercontent.com/bschlangaul-sammlung/<name>/main`
     */
    rawUrl: string

    /**
     * z. B. `main`
     */
    main: string
  }
}

function leseKonfigurationsDateiJson (): Konfiguration {
  return JSON.parse(leseDatei(path.join(path.sep, 'etc', 'bschlangaul.json')))
}

export const konfiguration = leseKonfigurationsDateiJson()

export const hauptRepoPfad =
  konfiguration.repos[konfiguration.hauptRepo].lokalerPfad

const githubRawUrl = konfiguration.github.rawUrl.replace(
  '<name>',
  'examens-aufgaben-tex'
)

function gibRepoBasisPfad (repoId?: string): string {
  if (repoId != null) {
    return konfiguration.repos[repoId].lokalerPfad
  } else {
    return hauptRepoPfad
  }
}

/**
 * Erzeuge einen zum Git-Repository relativen Pfad.
 *
 * @param pfad - Ein möglicherweise absoluter Pfad.
 * @param repoId - Die Repository-ID muss dem Schlüssel entsprechen unter dem
 *   ein Repository (`repos[repoId]`) in der Konfigurationsdatei
 *   `/etc/bschlangaul.json` angegeben ist, z. B. `examensAufgabenTex` oder
 *   `examenScans`.
 *
 * @returns z. B. `Examen/66116.../`
 */
export function macheRelativenPfad (pfad: string, repoId?: string): string {
  return pfad.replace(gibRepoBasisPfad(repoId), '').replace(/^\//, '')
}

/**
 * Wandelt einen relativen Pfad in einen absoluten Pfad um, der in einem der
 * Bschlangaul-Repositories liegt.
 *
 * Die Pfad kann in Segmenten angegeben werden. Handelt es sich um keinen
 * absoluten Pfad, wird angenommen, dass er relativ zum Haupt-Repository oder
 * zum einem mit der `repoId` angegeben Repository liegt.
 *
 * @param pfadSegmente - Ein Pfad oder Pfad-Segmente angegeben in einem Feld.
 * @param repoId - Die Repository-ID muss dem Schlüssel entsprechen unter dem
 *   ein Repository (`repos[repoId]`) in der Konfigurationsdatei
 *   `/etc/bschlangaul.json` angegeben ist, z. B. `examensAufgabenTex` oder
 *   `examenScans`.
 */
export function gibRepoPfad (
  pfadSegmente: string | string[],
  repoId?: string
): string {
  if (typeof pfadSegmente === 'string') {
    pfadSegmente = [pfadSegmente]
  }

  const repoPfad = gibRepoBasisPfad(repoId)

  let elternPfad = repoPfad
  // Überprüfe, ob es sich bereits um einen absoluten Pfad handelt
  if (pfadSegmente[0].charAt(0) === path.sep) {
    elternPfad = ''
  }
  if (pfadSegmente[0].includes(repoPfad)) {
    return path.join(...pfadSegmente)
  }
  return path.join(elternPfad, ...pfadSegmente)
}

/**
 * Lese eine Text-Datei. Der Pfad kann in Segmenten angegeben werden. Handelt es
 * sich um keinen absoluten Pfad, wird angenommen, dass er relativ zum
 * Haupt-Repository oder zum einem mit der `repoId` angegeben Repository liegt.
 *
 * @param pfadSegmente - Ein Pfad oder Pfad-Segmente angegeben in einem Feld.
 * @param repoId - Die Repository-ID muss dem Schlüssel entsprechen unter dem
 *   ein Repository (`repos[repoId]`) in der Konfigurationsdatei
 *   `/etc/bschlangaul.json` angegeben ist,  z. B. `examensAufgabenTex` oder
 *   `examenScans`.
 *
 * @returns Der Inhalt der Text-Datei als String.
 */
export function leseRepoDatei (
  pfadSegmente: string | string[],
  repoId?: string
): string {
  return leseDatei(gibRepoPfad(pfadSegmente, repoId))
}

export interface LinkEinstellung {
  /**
   * Wenn wahr, wird die PDF-Datei verlink und nicht die TeX-Datei.
   */
  linkePdf?: boolean
}

export function erzeugeLink (text: string, url: string): string {
  return `[${text}](${url})`
}

/**
 * @param repoId - z. B. `examensAufgabenTex`
 * @param replativerPfad - z. B. `README.md`
 * @param raw - Ob die URL zu einer `raw`en Version führen soll, d. h. nur der
 *   Inhalt, ohne zusätzlich Github-HTML-Markup.
 *
 * @returns
 *
 * - raw = false:
 *   `https://github.com/bschlangaul-sammlung/examens-aufgaben-tex/blob/main/README.md`
 * - raw = true:
 *   `https://raw.githubusercontent.com/bschlangaul-sammlung/examens-aufgaben-tex/main/README.md`
 */
export function erzeugeGithubUrl (
  repoId: string,
  replativerPfad: string,
  raw: boolean = false
): string {
  const baseUrl = raw ? konfiguration.github.rawUrl : konfiguration.github.url
  return (
    baseUrl.replace('<name>', konfiguration.repos[repoId].name) +
    '/' +
    replativerPfad
  )
}

/**
 * Generiere einen Markdown- oder HTML-Link.
 *
 * @param text Der Text, der als Link gesetzt werden soll.
 * @param pfad Der Datei-Pfad, zu dem gelinkt werden soll.
 *
 * @returns Ein Link zu einer Datei auf Github, entweder im Markdown- oder im
 * HTML-Format.
 */
export function erzeugeGithubRawLink (
  text: string,
  pfad: string,
  einstellung?: LinkEinstellung
): string {
  let linkePdf = true
  if (typeof einstellung?.linkePdf === 'boolean') {
    linkePdf = einstellung.linkePdf
  }
  pfad = pfad.replace(hauptRepoPfad, '')
  pfad = pfad.replace(/^\//, '')
  if (linkePdf) {
    pfad = pfad.replace(/\.[\w]+$/, '.pdf')
  }

  return `[${text}](${githubRawUrl}/${pfad})`
}

export function führeAus (programm: string, cwd: string): void {
  const process = childProcess.spawnSync(programm, {
    cwd: cwd,
    encoding: 'utf-8',
    shell: true
  })
  if (process.status !== 0) throw Error(process.stderr + process.stdout)
  console.log(process.stdout)
}

export function öffneProgramm (programm: string, pfad: string): void {
  const subprocess = childProcess.spawn(programm, [pfad], {
    detached: true,
    stdio: 'ignore'
  })
  subprocess.unref()
}

export function öffneVSCode (pfad: string): void {
  öffneProgramm('/usr/bin/code', gibRepoPfad(pfad))
}

/**
 * Kleine Helfer-Klasse um Strings zu sammeln in einem Array zu speichern
 * und dann per Join über Zeileumbrüche zusammenzufügen.
 */
export class AusgabeSammler {
  private readonly speicher: string[]
  private readonly redselig: boolean
  constructor (redselig = false) {
    this.speicher = []
    this.redselig = redselig
  }

  /**
   * Sammle Textausgaben. Sie werden nur gesammelt, wenn sie nicht null und kein
   * leerer String ist.
   *
   * @param ausgabe - Die Textausgabe, die gespeichert werden soll.
   */
  public sammle (ausgabe: string | undefined): void {
    if (this.redselig) {
      console.log(ausgabe)
    }
    if (ausgabe != null && ausgabe !== '') {
      this.speicher.push(ausgabe)
    }
  }

  /**
   * Leeren den Ausgabenspeicher. Dabei wir keine neues Feld erzeugt, sondern
   * alle Einträge aus dem Array gelöscht.
   */
  public leere (): void {
    this.speicher.splice(0, this.speicher.length)
  }

  /**
   * Gib die gesammelten Textschnipsel zusammengefügt als ein String zurück.
   *
   * @returns Die einzelnen Einträge des Felds mit `\n` zusammengefügt.
   */
  public gibText (): string {
    return this.speicher.join('\n')
  }
}
