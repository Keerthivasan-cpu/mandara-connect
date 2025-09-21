import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code, Download, Eye, FileText, Database } from 'lucide-react';
import { NAMASTECode, ICD11Code, FHIRProblemEntry } from '@/data/mockData';

interface FHIRResourceViewerProps {
  selectedNAMASTE?: NAMASTECode;
  selectedICD11: ICD11Code[];
  problems: FHIRProblemEntry[];
}

export const FHIRResourceViewer: React.FC<FHIRResourceViewerProps> = ({
  selectedNAMASTE,
  selectedICD11,
  problems
}) => {
  const [activeView, setActiveView] = useState<'codesystem' | 'conceptmap' | 'problemlist' | 'bundle'>('codesystem');

  const generateFHIRCodeSystem = () => {
    return {
      resourceType: "CodeSystem",
      id: "namaste-terminology",
      url: "http://terminology.mohfw.gov.in/fhir/CodeSystem/namaste",
      identifier: [
        {
          system: "urn:ietf:rfc:3986",
          value: "urn:oid:2.16.356.1.1.1.1.1"
        }
      ],
      version: "1.0.0",
      name: "NAMASTETerminology",
      title: "NAMASTE - National AYUSH Morbidity & Standardized Terminologies Electronic",
      status: "active",
      experimental: false,
      date: "2024-01-01",
      publisher: "Ministry of AYUSH, Government of India",
      description: "Standardized terminologies for Ayurveda, Siddha, and Unani systems of medicine",
      jurisdiction: [
        {
          coding: [
            {
              system: "urn:iso:std:iso:3166",
              code: "IN"
            }
          ]
        }
      ],
      caseSensitive: true,
      content: "complete",
      count: 4500,
      concept: selectedNAMASTE ? [
        {
          code: selectedNAMASTE.code,
          display: selectedNAMASTE.display,
          definition: selectedNAMASTE.description,
          property: [
            {
              code: "system",
              valueString: selectedNAMASTE.system
            }
          ]
        }
      ] : []
    };
  };

  const generateFHIRConceptMap = () => {
    return {
      resourceType: "ConceptMap",
      id: "namaste-to-icd11-tm2",
      url: "http://terminology.mohfw.gov.in/fhir/ConceptMap/namaste-to-icd11-tm2",
      version: "1.0.0",
      name: "NAMASTEToICD11TM2ConceptMap",
      title: "NAMASTE to ICD-11 TM2 Concept Map",
      status: "active",
      experimental: false,
      date: "2024-01-01",
      publisher: "Ministry of AYUSH, Government of India",
      description: "Mapping between NAMASTE codes and ICD-11 Traditional Medicine Module 2 codes",
      sourceUri: "http://terminology.mohfw.gov.in/fhir/CodeSystem/namaste",
      targetUri: "http://id.who.int/icd/release/11/2023-01",
      group: selectedNAMASTE && selectedICD11.length > 0 ? [
        {
          source: "http://terminology.mohfw.gov.in/fhir/CodeSystem/namaste",
          target: "http://id.who.int/icd/release/11/2023-01",
          element: [
            {
              code: selectedNAMASTE.code,
              display: selectedNAMASTE.display,
              target: selectedICD11.map(icd => ({
                code: icd.code,
                display: icd.display,
                equivalence: "equivalent",
                comment: `Mapped ${selectedNAMASTE.system} condition to ICD-11 ${icd.module}`
              }))
            }
          ]
        }
      ] : []
    };
  };

  const generateFHIRBundle = () => {
    return {
      resourceType: "Bundle",
      id: "ayush-emr-terminology-bundle",
      meta: {
        lastUpdated: new Date().toISOString(),
        tag: [
          {
            system: "http://terminology.hl7.org/CodeSystem/v3-ActReason",
            code: "HTEST",
            display: "test health data"
          }
        ]
      },
      identifier: {
        system: "http://mohfw.gov.in/fhir/bundle-identifier",
        value: "ayush-bundle-" + Date.now()
      },
      type: "collection",
      timestamp: new Date().toISOString(),
      entry: [
        {
          resource: generateFHIRCodeSystem()
        },
        {
          resource: generateFHIRConceptMap()
        },
        ...problems.map(problem => ({
          resource: {
            resourceType: "Condition",
            id: problem.id,
            meta: {
              profile: ["http://hl7.org/fhir/StructureDefinition/Condition"]
            },
            clinicalStatus: {
              coding: [
                {
                  system: "http://terminology.hl7.org/CodeSystem/condition-clinical",
                  code: problem.clinicalStatus
                }
              ]
            },
            severity: {
              coding: [
                {
                  system: "http://snomed.info/sct",
                  code: problem.severity === "mild" ? "255604002" : problem.severity === "moderate" ? "6736007" : "24484000",
                  display: problem.severity
                }
              ]
            },
            code: {
              coding: [
                // NAMASTE Code
                {
                  system: "http://terminology.mohfw.gov.in/fhir/CodeSystem/namaste",
                  code: problem.namasteCode.code,
                  display: problem.namasteCode.display
                },
                // ICD-11 Codes  
                ...problem.icd11Codes.map(icd => ({
                  system: "http://id.who.int/icd/release/11/2023-01",
                  code: icd.code,
                  display: icd.display
                }))
              ]
            },
            subject: {
              reference: "Patient/example-patient"
            },
            onsetDate: problem.onsetDate,
            recordedDate: problem.recordedDate
          }
        }))
      ]
    };
  };

  const copyToClipboard = (data: any) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
  };

  const downloadJSON = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resources = {
    codesystem: generateFHIRCodeSystem(),
    conceptmap: generateFHIRConceptMap(),
    problemlist: problems,
    bundle: generateFHIRBundle()
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-medical" />
          FHIR Resource Viewer & Export
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeView} onValueChange={(value: any) => setActiveView(value)} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="codesystem">CodeSystem</TabsTrigger>
            <TabsTrigger value="conceptmap">ConceptMap</TabsTrigger>
            <TabsTrigger value="problemlist">Problem List</TabsTrigger>
            <TabsTrigger value="bundle">FHIR Bundle</TabsTrigger>
          </TabsList>

          {Object.entries(resources).map(([key, data]) => (
            <TabsContent key={key} value={key} className="space-y-4">
              <div className="flex gap-2">
                <Button
                  onClick={() => copyToClipboard(data)}
                  variant="outline"
                  size="sm"
                >
                  <Code className="h-4 w-4 mr-2" />
                  Copy JSON
                </Button>
                <Button
                  onClick={() => downloadJSON(data, `fhir-${key}-${Date.now()}.json`)}
                  variant="outline"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>

              <Card className="bg-gray-50">
                <CardContent className="p-4">
                  <pre className="text-sm overflow-auto max-h-96 bg-white p-4 rounded border">
                    {JSON.stringify(data, null, 2)}
                  </pre>
                </CardContent>
              </Card>

              {key === 'bundle' && data && typeof data === 'object' && 'entry' in data && (
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Bundle Summary
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="p-3">
                      <div className="text-2xl font-bold text-medical">{(data as any).entry?.length || 0}</div>
                      <div className="text-sm text-muted-foreground">Total Resources</div>
                    </Card>
                    <Card className="p-3">
                      <div className="text-2xl font-bold text-ayurveda">{problems.length}</div>
                      <div className="text-sm text-muted-foreground">Problem Entries</div>
                    </Card>
                    <Card className="p-3">
                      <div className="text-2xl font-bold text-icd">2</div>
                      <div className="text-sm text-muted-foreground">Terminology Resources</div>
                    </Card>
                  </div>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};