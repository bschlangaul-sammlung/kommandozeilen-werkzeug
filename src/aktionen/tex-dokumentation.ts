import glob from 'glob'
import path from 'path'

import {
  repositoryPfad,
  leseDatei,
  schreibeDatei,
  führeAus,
  öffneProgramm
} from '../helfer'

import { log } from '../log'

const übergeordneterPfad = path.join(repositoryPfad, '.tex')
const paketePfad = path.join(übergeordneterPfad, 'pakete')
const klassenPfad = path.join(übergeordneterPfad, 'klassen')
const dtxPfad = path.join(übergeordneterPfad, 'dokumentation.dtx')

/**
 * @param segmente Relativ zum übergeordneten .tex-Verzeichnis
 */
function gibAbsolutenPfad (...segmente: string[]): string {
  return path.join(übergeordneterPfad, ...segmente)
}

function leseTexDatei (dateiPfad: string, dtxInhalte: string[]): void {
  log('info', `Lese Datei: ${dateiPfad}`)
  const inhalt = leseDatei(dateiPfad)
  const dateiName = path.basename(dateiPfad)
  const prefix =
    '%    \\end{macrocode}\n' +
    '% \\subsection{' +
    dateiName +
    '}\n' +
    '%    \\begin{macrocode}\n'
  dtxInhalte.push(prefix + inhalt)
}

function kompiliereDtxDatei (): void {
  führeAus('lualatex --shell-escape dokumentation.dtx', übergeordneterPfad)
  führeAus(
    'makeindex -s gglo.ist -o dokumentation.gls dokumentation.glo',
    übergeordneterPfad
  )
  führeAus(
    'makeindex -s gind.ist -o dokumentation.ind dokumentation.idx',
    übergeordneterPfad
  )
  führeAus('lualatex --shell-escape dokumentation.dtx', übergeordneterPfad)
}

export default function (): void {
  let textkörper = leseDatei(
    path.join(übergeordneterPfad, 'dokumentation_vorlage.dtx')
  )
  const dtxInhalte: string[] = []

  // klassen
  const klassenDateiname = glob.sync('**/*.cls', { cwd: klassenPfad })
  for (const klassenPfad of klassenDateiname) {
    leseTexDatei(gibAbsolutenPfad('klassen', klassenPfad), dtxInhalte)
  }
  textkörper = textkörper.replace('{{ klassen }}', dtxInhalte.join('\n'))

  // pakete
  const paketDateiname = glob.sync('**/*.sty', { cwd: paketePfad })
  for (const paketPfad of paketDateiname) {
    leseTexDatei(gibAbsolutenPfad('pakete', paketPfad), dtxInhalte)
  }
  textkörper = textkörper.replace('{{ pakete }}', dtxInhalte.join('\n'))

  schreibeDatei(dtxPfad, textkörper)

  kompiliereDtxDatei()
  öffneProgramm(
    '/usr/bin/xdg-open',
    path.join(übergeordneterPfad, 'dokumentation.pdf')
  )
}
