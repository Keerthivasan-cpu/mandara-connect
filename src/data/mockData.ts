// Mock data for NAMASTE and ICD-11 TM2 codes
export interface NAMASTECode {
  id: string;
  code: string;
  display: string;
  system: "AYURVEDA" | "SIDDHA" | "UNANI";
  description: string;
  icd11Mappings: string[];
}

export interface ICD11Code {
  id: string;
  code: string;
  display: string;
  module: "TM2" | "BIOMEDICINE";
  description: string;
  namasteMapping?: string[];
}

export interface FHIRProblemEntry {
  id: string;
  namasteCode: NAMASTECode;
  icd11Codes: ICD11Code[];
  clinicalStatus: "active" | "inactive" | "resolved";
  severity: "mild" | "moderate" | "severe";
  onsetDate: string;
  recordedDate: string;
}

export const mockNAMASTECodes: NAMASTECode[] = [
  {
    id: "nam-001",
    code: "AYU.RESP.001",
    display: "Kasa (Cough)",
    system: "AYURVEDA",
    description: "Ayurvedic condition characterized by persistent cough due to vitiated Prana Vata and Kapha",
    icd11Mappings: ["TM40.00", "CA80.2"]
  },
  {
    id: "nam-002", 
    code: "AYU.DIGE.003",
    display: "Amlapitta (Hyperacidity)",
    system: "AYURVEDA",
    description: "Digestive disorder due to aggravated Pitta dosha causing acid dyspepsia",
    icd11Mappings: ["TM41.10", "DA60.0"]
  },
  {
    id: "nam-003",
    code: "SID.NEUR.005",
    display: "Vatha Noigal (Neurological disorders)",
    system: "SIDDHA", 
    description: "Siddha neurological conditions due to deranged Vatha humor",
    icd11Mappings: ["TM42.20", "8A00"]
  },
  {
    id: "nam-004",
    code: "UNA.CARD.002",
    display: "Waja-ur-Qalb (Heart palpitation)",
    system: "UNANI",
    description: "Unani cardiac condition with irregular heartbeats due to temperamental imbalance",
    icd11Mappings: ["TM43.15", "MC81.0"]
  },
  {
    id: "nam-005",
    code: "AYU.DERM.008",
    display: "Kushtha (Skin disorders)",
    system: "AYURVEDA",
    description: "Chronic skin conditions due to vitiated Pitta and Rakta dhatu",
    icd11Mappings: ["TM40.25", "EA90"]
  }
];

export const mockICD11Codes: ICD11Code[] = [
  {
    id: "icd-001",
    code: "TM40.00",
    display: "Respiratory disorders - Traditional Medicine",
    module: "TM2",
    description: "Traditional medicine classification for respiratory system disorders",
    namasteMapping: ["AYU.RESP.001"]
  },
  {
    id: "icd-002",
    code: "CA80.2", 
    display: "Chronic cough",
    module: "BIOMEDICINE",
    description: "Biomedical classification for persistent cough lasting more than 8 weeks"
  },
  {
    id: "icd-003",
    code: "TM41.10",
    display: "Digestive system disorders - Traditional Medicine",
    module: "TM2", 
    description: "Traditional medicine classification for digestive disorders",
    namasteMapping: ["AYU.DIGE.003"]
  },
  {
    id: "icd-004",
    code: "DA60.0",
    display: "Gastro-oesophageal reflux disease",
    module: "BIOMEDICINE",
    description: "Biomedical classification for acid reflux conditions"
  },
  {
    id: "icd-005",
    code: "TM42.20", 
    display: "Nervous system disorders - Traditional Medicine",
    module: "TM2",
    description: "Traditional medicine classification for neurological conditions",
    namasteMapping: ["SID.NEUR.005"]
  }
];

export const mockProblemEntries: FHIRProblemEntry[] = [
  {
    id: "prob-001",
    namasteCode: mockNAMASTECodes[0],
    icd11Codes: [mockICD11Codes[0], mockICD11Codes[1]],
    clinicalStatus: "active",
    severity: "moderate", 
    onsetDate: "2024-01-15",
    recordedDate: "2024-01-20"
  },
  {
    id: "prob-002", 
    namasteCode: mockNAMASTECodes[1],
    icd11Codes: [mockICD11Codes[2], mockICD11Codes[3]],
    clinicalStatus: "active",
    severity: "mild",
    onsetDate: "2024-02-10", 
    recordedDate: "2024-02-12"
  }
];