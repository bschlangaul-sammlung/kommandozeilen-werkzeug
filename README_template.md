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
{{ cli('bschlangaul-werkzeug.js --help') }}
```

```
{{ cli('bschlangaul-werkzeug.js sql --help') }}
```

```
{{ cli('bschlangaul-werkzeug.js kompiliere-tex --help') }}
```

```
{{ cli('bschlangaul-werkzeug.js code --help') }}
```
