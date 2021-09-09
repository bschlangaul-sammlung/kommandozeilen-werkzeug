"use strict";
/**
 * Sammle alle Aktionen im Unterverzeichnis ./aktionen in ein Objekt und
 * exportiere dieses.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const readme_1 = __importDefault(require("./aktionen/readme"));
const tex_dokumentation_1 = __importDefault(require("./aktionen/tex-dokumentation"));
const tex_kompilation_1 = __importDefault(require("./aktionen/tex-kompilation"));
const flaci_1 = __importDefault(require("./aktionen/flaci"));
const validiere_1 = __importDefault(require("./aktionen/validiere"));
const sql_1 = __importDefault(require("./aktionen/sql"));
const aufgaben_metadaten_1 = __importDefault(require("./aktionen/aufgaben-metadaten"));
const oeffne_1 = require("./aktionen/oeffne");
const aufgaben_vorlage_1 = require("./aktionen/aufgaben-vorlage");
const aufgaben_sammlung_1 = require("./aktionen/aufgaben-sammlung");
const externe_befehle_1 = require("./aktionen/externe-befehle");
exports.default = {
    erkenneTextInPdf: externe_befehle_1.erkenneTextInPdf,
    erzeugeAufgabenMetadaten: aufgaben_metadaten_1.default,
    erzeugeAufgabenVorlage: aufgaben_vorlage_1.erzeugeAufgabenVorlage,
    erzeugeExamensAufgabeVorlage: aufgaben_vorlage_1.erzeugeExamensAufgabeVorlage,
    erzeugeExamenScansSammlung: aufgaben_sammlung_1.erzeugeExamenScansSammlung,
    erzeugeExamensLösungen: aufgaben_sammlung_1.erzeugeExamensLösungen,
    löscheGeradeSeitenInPdf: externe_befehle_1.löscheGeradeSeitenInPdf,
    erzeugeReadme: readme_1.default,
    erzeugeTexDokumentation: tex_dokumentation_1.default,
    exportiereTxtAusPdf: externe_befehle_1.exportiereTxtAusPdf,
    führeSqlAus: sql_1.default,
    kompiliereTex: tex_kompilation_1.default,
    konvertiereFlaciZuTikz: flaci_1.default,
    öffne: oeffne_1.öffne,
    öffneDurchStichwort: oeffne_1.öffneDurchStichwort,
    rotierePdf: externe_befehle_1.rotierePdf,
    validiere: validiere_1.default
};
