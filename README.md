# werkzeug

Ein Kommandozeilen-Tool (Werkzeug), um verschiedene administrative
Aufgaben, wie z. B. das Erzeugen von Aufgaben-Sammlungen, TeX-Vorlagen
etc. zu erledigen.

## Installation

```sh
git clone git@github.com:bschlangaul-sammlung/werkzeug.git
cd werkzeug
npm install --global
```

Das Werkzeug liest die Konfigurationsdatei `/etc/bschlangaul.config.tex`
ein. Welchen Inhalt diese Datei haben muss ist im
[TeX-Repository](https://github.com/bschlangaul-sammlung/tex#systemvoraussetzungen)
beschrieben.

## Ausgabe der Kommandozeilen-Hilfe

```
Usage: bschlangaul-werkzeug [options] [command]

Ein Kommandozeilen-Tool (Werkzeug), um verschiedene administrative Aufgaben, wie z. B. das Erzeugen von Aufgaben-Sammlungen, TeX-Vorlagen etc. zu erledigen.

Options:
  -V, --version                                                         output the version number
  -v, --verbose                                                         Die mehrmalige Angabe der Option steigert
                                                                        die Redseligkeit. (default: 0)
  -h, --help                                                            display help for command

Commands:
  erzeuge-aufgabe|a [titel]                                             Erzeuge eine Aufgabe im aktuellen
                                                                        Arbeitsverzeichnis.
  erzeuge-examens-aufgabe|e <referenz> <thema> [teilaufgabe] [aufgabe]  Erzeuge eine Examensaufgabe im Verzeichnis
                                                                        „Examen“.
  oeffne|o <referenz...>                                                Öffne eine Examen oder andere
                                                                        Materialien durch die Referenz, z. B.
                                                                        66116:2020:09.
  oeffne-stichwort|s <stichwort>                                        Öffne Aufgaben anhand des Stichworts
  readme|r                                                    Erzeuge die README-Datei.
  kompiliere-aufgaben|k                                                 Kompiliere alle TeX-Dateien der Aufgaben.
  sql|s [options] <tex-datei>                                           Führe SQL-Code in einer TeX-Datei aus. Der
                                                                        Code muss in
                                                                        \begin{minted}{sql}…\end{minted}
                                                                        eingerahmt sein.
  code|c [options] [glob]                                               Öffne die mit glob spezifizierten Dateien
                                                                        in Visual Studio Code
  seiten-loeschen|l <pdf-datei>                                         Gerade Seiten in einer PDF-Datei löschen.
                                                                        Die erste, dritte Seite etc. bleibt
                                                                        bestehen.
  txt-exportieren|t <pdf-datei>                                         TXT aus einer PDF-Datei exportieren.
  ocr <pdf-datei>                                                       Texterkennung in einer PDF-Datei
                                                                        durchführen.
  rotiere-pdf|r <pdf-datei>                                             PDF-Datei rotieren.
  sammlungen|sa                                                         Erzeuge verschiedene Sammlungen (z. B.
                                                                        Alle Aufgaben eines Examens)
  enumerate-item|ei <tex-datei>                                         a) b) ... i) iii) durch \item ersetzen.
  flaci-to-tikz|flaci <jsonDatei>                                       Konvertieren flaci.com Automaten to
                                                                        TikZ-Automaten
  dtx                                                                   *.sty zu einem dtx zusammenfügen
  metadaten|m <texDatei>                                                Erzeuge die Metadaten in einer TeX-Datei.
  validiere|v                                                           Überprüfe / validiere ob es die
                                                                        Stichwörter in \index{} gibt. Ob es die
                                                                        Werte für die Metadaten-Schlüssel
                                                                        BearbeitungsStand und Korrektheit in den
                                                                        Metadaten gibt
  help [command]                                                        display help for command
```
