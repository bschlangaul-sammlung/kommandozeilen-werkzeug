#! /usr/bin/env node

/**
 * Mit Hilfe des Pakets `commander` ein Kommandozeilen-Interface bereitstellen.
 */

import { Command } from 'commander'

import { repositoryPfad } from './helfer'
import aktionen from './aktionen'

const programm = new Command()
programm.description(`Repository-Pfad: ${repositoryPfad}`)
programm.name('lehramt-informatik.js')
programm.version('0.1.0')

programm.on('command:*', function () {
  console.error(
    'Ungültiger Befehl: %s\nBenutze das Argument --help, um eine Liste der verfügbaren Befehle anzuzeigen.',
    programm.args.join(' ')
  )
  process.exit(1)
})

programm
  .command('erzeuge-aufgabe [titel]')
  .description('Erzeuge eine Aufgabe im aktuellen Arbeitsverzeichnis.')
  .alias('a')
  .action(aktionen.erzeugeAufgabenVorlage)

programm
  .command('erzeuge-examens-aufgabe <referenz> <thema> [teilaufgabe] [aufgabe]')
  .description('Erzeuge eine Examensaufgabe im Verzeichnis „Staatsexamen“.')
  .alias('e')
  .action(aktionen.erzeugeExamensAufgabeVorlage)

programm
  .command('oeffne <referenz...>')
  .description(
    'Öffne eine Staatsexamen oder andere Materialien durch die Referenz, z. B. 66116:2020:09.'
  )
  .alias('o')
  .action(aktionen.öffne)

programm
  .command('oeffne-stichwort <stichwort>')
  .description('Öffne Aufgaben anhand des Stichworts')
  .alias('s')
  .action(aktionen.öffneDurchStichwort)

programm
  .command('generiere-readme')
  .description('Erzeuge die README-Datei.')
  .alias('r')
  .action(aktionen.erzeugeReadme)

programm
  .command('kompiliere-aufgaben')
  .description('Kompiliere alle TeX-Dateien der Aufgaben.')
  .alias('k')
  .action(aktionen.kompiliereTex)

programm
  .command('sql <tex-datei>')
  .description(
    'Führe SQL-Code in einer TeX-Datei aus. Der Code muss in \\begin{minted}{sql}…\\end{minted} eingerahmt sein.'
  )
  .alias('s')
  .option(
    '-a, --anfrage <nummer>',
    'Führe nur die Anfrage mit der gegebenen Nummer aus.'
  )
  .option(
    '-n, --nicht-loeschen',
    'Die Datenbank und die temporären SQL-Dateien am Ende der Ausführung nicht löschen.'
  )
  .action(aktionen.führeSqlAus)

programm
  .command('code [glob]')
  .alias('c')
  .description(
    'Öffne die mit glob spezifizierten Dateien in Visual Studio Code'
  )
  .option('-n, --kein-index', 'Öffne nur die Dateien, die keinen Index haben.')
  .option(
    '-t, --kein-titel',
    'Öffne nur die Dateien, die keinen Titel haben. \\liAufgabenTitel{}.'
  )
  .action(aktionen.öffneDurchGlobInVSCode)

programm
  .command('seiten-loeschen <pdf-datei>')
  .alias('l')
  .description(
    'Gerade Seiten in einer PDF-Datei löschen. Die erste, dritte Seite etc. bleibt bestehen.'
  )
  .action(aktionen.löscheGeradeSeitenInPdf)

programm
  .command('txt-exportieren <pdf-datei>')
  .alias('t')
  .description('TXT aus einer PDF-Datei exportieren.')
  .action(aktionen.exportiereTxtAusPdf)

programm
  .command('ocr <pdf-datei>')
  .description('Texterkennung in einer PDF-Datei durchführen.')
  .action(aktionen.erkenneTextInPdf)

programm
  .command('rotiere-pdf <pdf-datei>')
  .alias('r')
  .description('PDF-Datei rotieren.')
  .action(aktionen.rotierePdf)

const sammlung = new Command('sammlungen').description(
  'Erzeuge verschiedene Sammlungen (z. B. Alle Aufgaben eines Examens)'
).alias('sa')

sammlung
  .command('examen-scans')
  .description('Füge mehrer Examen-Scans in einer PDF-Datei zusammen sind.')
  .action(aktionen.erzeugeExamenScansSammlung)

sammlung
  .command('aufgaben-pro-examen')
  .description(
    'Erzeuge pro Examen eine TeX-Datei. ' +
      'Das Examen muss mindestens eine gelöste Aufgabe haben'
  )
  .action(aktionen.erzeugeExamensLösungen)

programm.addCommand(sammlung)

programm
  .command('enumerate-item <tex-datei>')
  .alias('ei')
  .description('a) b) ... i) iii) durch \\item ersetzen.')
  .action(aktionen.erzeugeListenElemente)

programm
  .command('flaci-to-tikz <jsonDatei>')
  .alias('flaci')
  .description('Konvertieren flaci.com Automaten to TikZ-Automaten')
  .action(aktionen.konvertiereFlaciZuTikz)

programm
  .command('dtx')
  .description('*.sty zu einem dtx zusammenfügen')
  .action(aktionen.erzeugeTexDokumentation)

programm
  .command('aufgaben-titel <texDatei>')
  .alias('at')
  .description('Erzeuge den Titel in einer TeX-Datei')
  .action(aktionen.erzeugeAufgabenMetadaten)

programm
  .command('validiere')
  .alias('v')
  .description(
    'Überprüfe / validiere ob es die Stichwörter in \\index{} gibt. ' +
      'Ob es die Werte für die Metadaten-Schlüssel BearbeitungsStand und ' +
      'Korrektheit in den Metadaten gibt'
  )
  .action(aktionen.validiere)

export default programm
