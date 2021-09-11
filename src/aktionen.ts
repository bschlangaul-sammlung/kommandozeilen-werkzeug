/**
 * Sammle alle Aktionen im Unterverzeichnis ./aktionen in ein Objekt und
 * exportiere dieses.
 */

import erzeugeReadme from './aktionen/readme'
import erzeugeTexDokumentation from './aktionen/tex-dokumentation'
import kompiliereTex from './aktionen/tex-kompilation'
import konvertiereFlaciZuTikz from './aktionen/flaci'
import validiere from './aktionen/validiere'
import führeSqlAus from './aktionen/sql'
import erzeugeAufgabenMetadaten from './aktionen/aufgaben-metadaten'
import {
  öffne,
  öffneDurchStichwort,
  öffneDurchGlobInVSCode
} from './aktionen/oeffne'
import {
  erzeugeAufgabenVorlage,
  erzeugeExamensAufgabeVorlage
} from './aktionen/aufgaben-vorlage'
import {
  erzeugeExamenScansSammlung,
  erzeugeExamensLösungen,
  erzeugeHauptDokument
} from './aktionen/aufgaben-sammlung'
import {
  rotierePdf,
  erkenneTextInPdf,
  löscheGeradeSeitenInPdf,
  exportiereTxtAusPdf
} from './aktionen/externe-befehle'
import { erzeugeListenElemente } from './aktionen/tex-formatierung'

export default {
  erkenneTextInPdf,
  erzeugeAufgabenMetadaten,
  erzeugeAufgabenVorlage,
  erzeugeExamensAufgabeVorlage,
  erzeugeExamenScansSammlung,
  erzeugeExamensLösungen,
  erzeugeHauptDokument,
  erzeugeListenElemente,
  erzeugeReadme,
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
}
