import glob from 'glob';
import { BibLatexParser } from 'biblatex-csl-converter';
import { leseRepoDatei, hauptRepoPfad } from './helfer';
export function leseBibDatei(dateiPfad) {
    const parser = new BibLatexParser(leseRepoDatei(dateiPfad), {
        processUnexpected: true,
        processUnknown: true
    });
    return parser.parse();
}
class BibtexSammlung {
    constructor() {
        this.index = {};
        const bibDateien = glob.sync('**/*.bib', { cwd: hauptRepoPfad });
        for (const bibDateiPfad of bibDateien) {
            this.leseBibTexJsonEin(leseBibDatei(bibDateiPfad));
        }
    }
    leseBibTexJsonEin(bibtexJson) {
        var _a;
        const entries = bibtexJson.entries;
        for (const key in entries) {
            const entry = entries[key];
            if (((_a = entry === null || entry === void 0 ? void 0 : entry.unexpected_fields) === null || _a === void 0 ? void 0 : _a.file) != null) {
                this.index[entry.entry_key] = BibtexSammlung.findeMehrerePdfDateien(entry.unexpected_fields.file);
            }
        }
    }
    /**
     * @param eingabe z. B. AB1_Grundlagen.pdf AB1_Grundlagen_Lsg.pdf
     */
    static findeMehrerePdfDateien(eingabe) {
        let ergebnis = eingabe.split('.pdf');
        ergebnis = ergebnis
            .map(function (dateiBasisName) {
            return dateiBasisName.trim().replace(/^, +/, '');
        })
            .filter(function (dateiBasisName) {
            // eslint-disable-next-line
            return !!dateiBasisName;
        });
        return ergebnis;
    }
    gibDateiNameDurchReferenz(referenz) {
        if (this.index[referenz] != null) {
            return this.index[referenz];
        }
    }
}
let bibtexSammlung;
export function gibBibtexSammlung() {
    if (bibtexSammlung == null) {
        bibtexSammlung = new BibtexSammlung();
    }
    return bibtexSammlung;
}
//# sourceMappingURL=bibtex.js.map