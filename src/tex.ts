/**
 * TeX-Datei
 */

import { leseRepoDatei, schreibeDatei } from './helfer'
import { log } from './log'

function baueMakroRegExp (macroName: string): RegExp {
  // Probleme mit `\bAufgabenTitel`: `\b` ist angeblich ein Sonderzeichen
  return new RegExp(`\\\\${macroName}{([^}]*)}`, 'g')
}

function säubereStichwort (stichwort: string): string {
  return stichwort.replace(/\s+/g, ' ')
}

export function gibInhaltEinesTexMakros (
  makroName: string,
  markup: string
): string | undefined {
  const regExp = baueMakroRegExp(makroName)
  const übereinstimmung = regExp.exec(markup)
  if (übereinstimmung != null) {
    return übereinstimmung[1]
  }
}

/**
 * Sammle alle Stichwörter eines TeX-Inhaltes (string). Doppelte Stichwörter
 * werden nur als eins aufgelistet.
 *
 * @param inhalt - Der Textinhalt einer TeX-Datei.
 */
export function sammleStichwörter (inhalt: string): string[] {
  const re = baueMakroRegExp('index')
  let übereinstimmung
  const stichwörter = new Set<string>()
  do {
    übereinstimmung = re.exec(inhalt)
    if (übereinstimmung != null) {
      const stichwort = säubereStichwort(übereinstimmung[1])
      stichwörter.add(stichwort)
    }
  } while (übereinstimmung != null)
  return Array.from(stichwörter)
}

/**
 * Sammle alle Stichwörter einer TeX-Datei.
 */
export function sammleStichwörterEinerDatei (pfad: string): string[] {
  return sammleStichwörter(leseRepoDatei(pfad))
}

/**
 * @param dateiPfad - Ein Dateipfad.
 * @param klassenName - Ein Klassenname (ohne Präfix `bschlangaul-`)
 * @param kopf - Das TeX-Markup, das vor `\begin{document}` erscheint.
 * @param textkörper - Der Text der innerhalb der document-Umgebung erscheint.
 */
export function schreibeTexDatei (
  dateiPfad: string,
  klassenName: string,
  kopf: string,
  textkörper: string
): void {
  textkörper = textkörper.trim()
  const inhalt =
    `\\documentclass{bschlangaul-${klassenName}}\n${kopf}\n` +
    `\\begin{document}\n${textkörper}\n\\end{document}\n`
  log('debug', inhalt)
  schreibeDatei(dateiPfad, inhalt)
}

function umgebeMitKlammern (text: string): string {
  text = text.trim()
  if (text.charAt(0) !== '{' && text.charAt(text.length - 1) !== '}') {
    text = `{${text}}`
  }
  return text
}

/**
 * @returns
 *
 * ```latex
 * \makroName{
 *   Titel = Aufgabe 2,
 *   Thematik = Petri-Netz,
 *   RelativerPfad = Examen/46116/2016/03/Thema-2/Teilaufgabe-1/Aufgabe-2.tex,
 *   ZitatSchluessel = sosy:pu:4,
 *   EinzelpruefungsNr = 46116,
 *   Jahr = 2016,
 *   Monat = 03,
 *   ThemaNr = 2,
 *   TeilaufgabeNr = 1,
 *   AufgabeNr = 2,
 * }
 * ```
 */
export function machePlist (
  makroName: string,
  daten: { [schlüssel: string]: any },
  schlüsselMitKlammern?: string[]
): string {
  if (schlüsselMitKlammern != null) {
    for (const schlüssel of schlüsselMitKlammern) {
      if (daten[schlüssel] != null) {
        daten[schlüssel] = umgebeMitKlammern(daten[schlüssel])
      }
    }
  }
  const schlüsselWertPaare: string[] = []
  Object.keys(daten).forEach(schlüssel => {
    let wert = daten[schlüssel]
    if (wert == null) {
      wert = ''
    }
    schlüsselWertPaare.push(`  ${schlüssel} = ${String(wert)},`)
  })
  const schlüsselWerte: string = schlüsselWertPaare.join('\n')
  return `\\${makroName}{\n${schlüsselWerte}\n}`
}
