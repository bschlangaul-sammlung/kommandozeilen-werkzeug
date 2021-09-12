import fs from 'fs'
import os from 'os'
import path from 'path'
import glob from 'glob'

import { gibExamenSammlung } from '../examen'
import { öffneProgramm, öffneVSCode } from '../helfer'

import {
  gibStichwortVerzeichnis,
  gibStichwortBaum
} from '../stichwort-verzeichnis'

import { gibBibtexSammlung } from '../bibtex'
import { Aufgabe } from '../aufgabe'

const basisPfadExterneDateien = path.join(
  os.homedir(),
  'git-repositories/content/informatik-studium'
)

export function öffneDurchBibtex (referenz: string): void {
  const externeDateien = glob.sync('**/*.pdf', { cwd: basisPfadExterneDateien })
  const sammlung = gibBibtexSammlung()

  const dateiNamen = sammlung.gibDateiNameDurchReferenz(referenz)

  if (dateiNamen == null) {
    console.log('Keine Datei gefunden')
  } else {
    for (const dateiName of dateiNamen) {
      externeDateien.filter(function (externerDateiPfad: string) {
        if (externerDateiPfad.includes(`${dateiName}.pdf`)) {
          console.log(`Öffne Datei: ${externerDateiPfad}`)
          öffneProgramm(
            'xdg-open',
            path.join(basisPfadExterneDateien, externerDateiPfad)
          )
        }
      })
    }
  }
}

export function öffneDurchStichwort (stichwort: string): void {
  const aufgaben = gibStichwortVerzeichnis().gibAufgabenMitStichwort(stichwort)

  if (aufgaben.size === 0) {
    console.log(
      `Das Stichwort ${stichwort} gibt es nicht. War ${gibStichwortBaum().findeÄhnliches(
        stichwort
      )} gemeint?`
    )
  } else {
    for (const aufgabe of aufgaben) {
      console.log(aufgabe.einbindenTexMakro)
      öffneProgramm('code', aufgabe.pfad)
    }
  }
}

function öffneExamen (referenz: string): void {
  const examen = gibExamenSammlung().gibDurchReferenz(referenz)
  if (fs.existsSync(examen.pfad)) {
    öffneProgramm('/usr/bin/xdg-open', examen.pfad)
  } else {
    console.log(`Den Pfad ${examen.pfad} gib es nicht.`)
  }
}

export function öffne (referenz: string | string[]): void {
  if (Array.isArray(referenz)) {
    referenz = referenz.join(':')
  }

  if (referenz.match(/\d{5}:\d{4}:\d{2}/) != null) {
    öffneExamen(referenz)
  } else {
    öffneDurchBibtex(referenz)
  }
}

export function öffneDurchGlobInVSCode (
  globMuster: string,
  cmdObj: { [schlüssel: string]: any }
): void {
  function öffneMitAusgabe (pfad: string): void {
    console.log(pfad)
    öffneVSCode(pfad)
  }

  if (typeof globMuster !== 'string') {
    globMuster = '**/*.tex'
  }
  const dateien = glob.sync(globMuster)
  for (let dateiPfad of dateien) {
    dateiPfad = path.resolve(dateiPfad)
    if (cmdObj.keinIndex != null || cmdObj.keinTitel != null) {
      const aufgabe = new Aufgabe(dateiPfad)
      if (
        (cmdObj.keinIndex != null && aufgabe.stichwörter.length === 0) ||
        (cmdObj.keinTitel != null && aufgabe.titel == null)
      ) {
        öffneMitAusgabe(dateiPfad)
      }
    } else {
      öffneMitAusgabe(dateiPfad)
    }
  }
}
