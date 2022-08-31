import childProcess from 'child_process'
import glob from 'glob'
import path from 'path'
import chalk from 'chalk'

import { ExamensAufgabe } from '../aufgabe'
import { repositoryPfad, öffneVSCode } from '../helfer'

const fehler: string[] = []

interface Optionen {
  oeffneEditor?: boolean
  unterVerzeichnis?: string
  examen?: boolean
  module?: boolean
}

export default function (opts: Optionen): void {
  let cwd: string
  if (opts.unterVerzeichnis != null) {
    cwd = path.join(repositoryPfad, opts.unterVerzeichnis)
  } else if (opts.examen != null && opts.examen) {
    cwd = path.join(repositoryPfad, 'Staatsexamen')
  } else if (opts.module != null && opts.module) {
    cwd = path.join(repositoryPfad, 'Module')
  } else {
    cwd = repositoryPfad
  }
  console.log(`Kompiliere alle TeX-Dateien im Verzeichnis: ${cwd}`)

  const dateien = glob.sync('**/*.tex', { cwd })
  for (let pfad of dateien) {
    pfad = path.join(cwd, pfad)
    if (pfad.match(ExamensAufgabe.schwacherPfadRegExp) != null) {
      const ergebnis = childProcess.spawnSync(
        'latexmk',
        ['-shell-escape', '-cd', '--lualatex', pfad],
        {
          encoding: 'utf-8'
        }
      )

      if (ergebnis.status === 0) {
        console.log(chalk.green(pfad))
      } else {
        fehler.push(pfad)
        console.log(chalk.yellow(ergebnis.stdout))
        console.log(chalk.red(ergebnis.stderr))
        if (opts.oeffneEditor != null && opts.oeffneEditor) {
          öffneVSCode(pfad)
        }
        console.log(chalk.red(pfad))
      }
    }
  }

  for (const pfad of fehler) {
    console.log(chalk.red(pfad))
  }
}
