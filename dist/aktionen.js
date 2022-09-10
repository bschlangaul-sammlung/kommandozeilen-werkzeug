/**
 * Sammle alle Aktionen im Unterverzeichnis ./aktionen in ein Objekt und
 * exportiere dieses.
 */
import { erzeugeReadmeExamenScans, erzeugeReadmeHaupt } from './aktionen/readme';
import erzeugeTexDokumentation from './aktionen/tex-dokumentation';
import kompiliereTex from './aktionen/tex-kompilation';
import konvertiereFlaciZuTikz from './aktionen/flaci';
import validiere from './aktionen/validiere';
import führeSqlAus from './aktionen/sql';
import erzeugeAufgabenMetadaten from './aktionen/aufgaben-metadaten';
import { öffne, öffneDurchStichwort, öffneDurchGlobInVSCode } from './aktionen/oeffne';
import { erzeugeAufgabenVorlage, erzeugeExamensAufgabeVorlage } from './aktionen/aufgaben-vorlage';
import { erzeugeExamenScansSammlung, erzeugeExamensLösungen, erzeugeAufgabenSammlung } from './aktionen/aufgaben-sammlung';
import { rotierePdf, erkenneTextInPdf, löscheGeradeSeitenInPdf, exportiereTxtAusPdf } from './aktionen/externe-befehle';
import { erzeugeListenElemente } from './aktionen/tex-formatierung';
import erzeugeAlleAufgaben from './aktionen/alle-aufgaben';
export default {
    erkenneTextInPdf,
    erzeugeAlleAufgaben,
    erzeugeAufgabenMetadaten,
    erzeugeAufgabenSammlung,
    erzeugeAufgabenVorlage,
    erzeugeExamensAufgabeVorlage,
    erzeugeExamenScansSammlung,
    erzeugeExamensLösungen,
    erzeugeListenElemente,
    erzeugeReadmeExamenScans,
    erzeugeReadmeHaupt,
    erzeugeTexDokumentation,
    exportiereTxtAusPdf,
    führeSqlAus,
    kompiliereTex,
    konvertiereFlaciZuTikz,
    löscheGeradeSeitenInPdf,
    öffne,
    öffneDurchGlobInVSCode,
    öffneDurchStichwort,
    rotierePdf,
    validiere
};
//# sourceMappingURL=aktionen.js.map