import path from 'path'
import fs from 'fs'

import nunjucks from 'nunjucks'

import { Aufgabe } from '../aufgabe'
import { gibAufgaben } from '../stichwort-verzeichnis'
import { repositoryPfad, leseRepoDatei } from '../helfer'

const verwendeteAufgaben = new Set<string>()

function generiereAufgabenListe (
  aufgabenListe: Set<Aufgabe>,
  stichwort: string,
  ueberschrift: number = 0
): string {
  const zeilen = []

  if (ueberschrift > 0) {
    let makro: string
    switch (ueberschrift) {
      case 2:
        makro = 'section'

        break

      case 3:
        makro = 'section'

        break
      default:
        makro = 'section'
        break
    }
    zeilen.push(`\\${makro}{${stichwort}}`)
  }

  const aufgaben = Array.from(aufgabenListe)
  aufgaben.sort(Aufgabe.vergleichePfade)
  for (const aufgabe of aufgaben) {
    if (!verwendeteAufgaben.has(aufgabe.relativerPfad)) {
      zeilen.push(aufgabe.einbindenTexMakro)
      verwendeteAufgaben.add(aufgabe.relativerPfad)
    }
  }
  return zeilen.join('\n')
}

function ersetzeStichwörterInReadme (
  stichwort: string,
  überschrift: number = 0
): string {
  return generiereAufgabenListe(gibAufgaben(stichwort), stichwort, überschrift)
}

export default function (): void {
  let inhalt = leseRepoDatei('Alle-Aufgaben.tex_template')
  inhalt = nunjucks.renderString(inhalt, {
    gibAufgabenListe: ersetzeStichwörterInReadme
  })

  console.log(inhalt)
  fs.writeFileSync(path.join(repositoryPfad, 'Alle-Aufgaben.tex'), inhalt)
}
