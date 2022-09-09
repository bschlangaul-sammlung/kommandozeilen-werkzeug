import childProcess from 'child_process'
import glob from 'glob'
import path from 'path'
import chalk from 'chalk'

import { öffneVSCode } from '../helfer'

const fehler: string[] = []

interface Optionen {
  oeffneEditor?: boolean
  trockenerLauf?: boolean
  ausschliessen?: string
}

export default function (opts: Optionen): void {
  const cwd: string = process.cwd()

  console.log(`Kompiliere alle TeX-Dateien im Verzeichnis: ${cwd}`)

  const dateien = glob.sync('**/*.tex', { cwd })
  for (let pfad of dateien) {
    pfad = path.join(cwd, pfad)

    if (opts.ausschliessen != null && pfad.includes(opts.ausschliessen)) {
      console.log('ausgeschossen: ' + pfad)
    } else {
      let ergebnis: childProcess.SpawnSyncReturns<string>
      if (opts.trockenerLauf != null && opts.trockenerLauf) {
        ergebnis = childProcess.spawnSync('cat', [pfad], {
          encoding: 'utf-8'
        })
      } else {
        ergebnis = childProcess.spawnSync(
          'latexmk',
          ['-shell-escape', '-cd', '--lualatex', pfad],
          {
            encoding: 'utf-8'
          }
        )
      }

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
