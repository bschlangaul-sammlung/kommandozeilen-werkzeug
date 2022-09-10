import fs from 'fs'

import nunjucks from 'nunjucks'

import { Aufgabe } from '../aufgabe'
import { gibStichwortVerzeichnis } from '../stichwort-verzeichnis'
import { leseRepoDatei, gibRepoPfad } from '../helfer'
import { generiereExamensÜbersicht } from './aufgaben-sammlung'

function generiereMarkdownAufgabenListe (aufgabenListe: Set<Aufgabe>): string {
  const aufgaben = Array.from(aufgabenListe)
  aufgaben.sort(Aufgabe.vergleichePfade)
  const teil = []
  for (const aufgabe of aufgaben) {
    teil.push('- ' + aufgabe.link)
  }
  return teil.join('\n')
}

function ersetzeStichwörterInReadme (stichwort: string): string {
  return generiereMarkdownAufgabenListe(
    gibStichwortVerzeichnis().gibAufgabenMitStichwortUnterBaum(stichwort)
  )
}

export function erzeugeReadmeExamenScans (): void {
  let inhalt = leseRepoDatei('README_template.md', 'examenScans')
  inhalt = nunjucks.renderString(inhalt, {
    uebersicht: generiereExamensÜbersicht(false)
  })
  fs.writeFileSync(gibRepoPfad('README.md', 'examenScans'), inhalt)
}

export function erzeugeReadmeHaupt (): void {
  let inhalt = leseRepoDatei('README_template.md')
  inhalt = nunjucks.renderString(inhalt, {
    gibAufgabenListe: ersetzeStichwörterInReadme,
    stichwortverzeichnis: leseRepoDatei('Stichwortverzeichnis.yml'),
    staatsexamen: generiereExamensÜbersicht()
  })
  fs.writeFileSync(gibRepoPfad('README.md'), inhalt)
}
