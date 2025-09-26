import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, Download, Database, FileText, Package } from 'lucide-react';
import { NAMASTECode, ICD11Code, ProblemEntry } from '@/hooks/useSupabaseData';
import { useToast } from '@/hooks/use-toast';

interface FHIRResourceViewerProps {
  selectedNAMASTE?: NAMASTECode;
  selectedICD11: ICD11Code[];
  problems: ProblemEntry[];
}

export const FHIRResourceViewer: React.FC<FHIRResourceViewerProps> = ({
  selectedNAMASTE,
  selectedICD11,
  problems
}) => {
  const [activeTab, setActiveTab] = useState('codesystem');
  const { toast } = useToast();

  // Generate FHIR CodeSystem for NAMASTE
  const generateFHIRCodeSystem = () => {
    return {
      resourceType: "CodeSystem",
      id: "namaste-terminology",
      url: "http://terminology.mohfw.gov.in/fhir/CodeSystem/namaste",
      version: "1.0.0",
      name: "NAMASTETerminology",
      title: "NAMASTE - National Medical Terminologies for AYUSH Systems",
      status: "active",
      date: new Date().toISOString(),
      publisher: "Ministry of AYUSH, Government of India",
      description: "Comprehensive terminology system for traditional Indian medicine systems including Ayurveda, Siddha, and Unani",
      content: "complete",
      concept: selectedNAMASTE ? [{
        code: selectedNAMASTE.code,
        display: selectedNAMASTE.display,
        definition: selectedNAMASTE.description || selectedNAMASTE.display,
        designation: [{
          use: {
            system: "http://terminology.hl7.org/CodeSystem/designation-usage",
            code: "display"
          },
          value: selectedNAMASTE.display
        }],
        property: [{
          code: "system",
          valueString: selectedNAMASTE.system
        }]
      }] : []
    };
  };

  // Generate FHIR ConceptMap
  const generateFHIRConceptMap = () => {
    if (!selectedNAMASTE || selectedICD11.length === 0) return null;

    return {
      resourceType: "ConceptMap",
      id: "namaste-to-icd11-map",
      url: "http://terminology.mohfw.gov.in/fhir/ConceptMap/namaste-to-icd11",
      version: "1.0.0",
      name: "NAMASTEToICD11Map",
      title: "NAMASTE to ICD-11 Concept Mapping",
      status: "active",
      date: new Date().toISOString(),
      publisher: "Ministry of AYUSH, Government of India",
      description: "Mapping between NAMASTE traditional medicine codes and ICD-11 classification",
      sourceUri: "http://terminology.mohfw.gov.in/fhir/CodeSystem/namaste",
      targetUri: "http://id.who.int/icd/release/11/2023-01",
      group: [{
        source: "http://terminology.mohfw.gov.in/fhir/CodeSystem/namaste",
        target: "http://id.who.int/icd/release/11/2023-01",
        element: [{
          code: selectedNAMASTE.code,
          display: selectedNAMASTE.display,
          target: selectedICD11.map(icd => ({
            code: icd.code,
            display: icd.display,
            equivalence: "equivalent" as const,
            comment: `Mapped from ${selectedNAMASTE.system} to ${icd.module}`
          }))
        }]
      }]
    };
  };

  // Generate FHIR Bundle
  const generateFHIRBundle = () => {
    const codeSystem = generateFHIRCodeSystem();
    const conceptMap = generateFHIRConceptMap();
    const conditions = problems.map((problem, index) => ({
      resourceType: "Condition",
      id: `condition-${index + 1}`,
      clinicalStatus: {
        coding: [{
          system: "http://terminology.hl7.org/CodeSystem/condition-clinical",
          code: problem.clinical_status,
          display: problem.clinical_status
        }]
      },
      severity: {
        coding: [{
          system: "http://snomed.info/sct",
          code: problem.severity === 'mild' ? '255604002' : 
                problem.severity === 'moderate' ? '6736007' : '24484000',
          display: problem.severity
        }]
      },
      code: {
        coding: [
          ...(problem.namaste_codes ? [{
            system: "http://terminology.mohfw.gov.in/fhir/CodeSystem/namaste",
            code: problem.namaste_codes.code,
            display: problem.namaste_codes.display
          }] : []),
          ...problem.icd11_code_ids.map(codeId => ({
            system: "http://id.who.int/icd/release/11/2023-01",
            code: codeId,
            display: `ICD-11 Code ${codeId}`
          }))
        ]
      },
      subject: {
        reference: `Patient/${problem.patient_id}`
      },
      onsetDate: problem.onset_date,
      recordedDate: problem.recorded_date,
      note: problem.clinical_notes ? [{
        text: problem.clinical_notes
      }] : undefined
    }));

    return {
      resourceType: "Bundle",
      id: "namaste-icd11-bundle",
      type: "collection",
      timestamp: new Date().toISOString(),
      entry: [
        { resource: codeSystem },
        ...(conceptMap ? [{ resource: conceptMap }] : []),
        ...conditions.map(condition => ({ resource: condition }))
      ]
    };
  };

  const copyToClipboard = (data: any) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    toast({
      title: "Copied to clipboard",
      description: "FHIR resource has been copied to your clipboard.",
    });
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
    
    toast({
      title: "Download started",
      description: `${filename} has been downloaded.`,
    });
  };

  const resources = {
    codesystem: generateFHIRCodeSystem(),
    conceptmap: generateFHIRConceptMap(),
    bundle: generateFHIRBundle()
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          FHIR Resource Viewer & Export
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="codesystem" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              CodeSystem
            </TabsTrigger>
            <TabsTrigger value="conceptmap" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              ConceptMap
            </TabsTrigger>
            <TabsTrigger value="bundle" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Bundle
            </TabsTrigger>
          </TabsList>

          <TabsContent value="codesystem" className="mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">FHIR CodeSystem Resource</h3>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(resources.codesystem)}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy JSON
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => downloadJSON(resources.codesystem, 'namaste-codesystem.json')}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
              <ScrollArea className="h-96 w-full border rounded-md p-4 bg-gray-50">
                <pre className="text-xs">
                  {JSON.stringify(resources.codesystem, null, 2)}
                </pre>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="conceptmap" className="mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">FHIR ConceptMap Resource</h3>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(resources.conceptmap)}
                    disabled={!resources.conceptmap}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy JSON
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => downloadJSON(resources.conceptmap, 'namaste-icd11-conceptmap.json')}
                    disabled={!resources.conceptmap}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
              {resources.conceptmap ? (
                <ScrollArea className="h-96 w-full border rounded-md p-4 bg-gray-50">
                  <pre className="text-xs">
                    {JSON.stringify(resources.conceptmap, null, 2)}
                  </pre>
                </ScrollArea>
              ) : (
                <div className="h-96 w-full border rounded-md p-4 flex items-center justify-center text-gray-500">
                  Select both NAMASTE and ICD-11 codes to generate ConceptMap
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="bundle" className="mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">FHIR Bundle Resource</h3>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(resources.bundle)}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy JSON
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => downloadJSON(resources.bundle, 'fhir-bundle.json')}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
              
              {/* Bundle Summary */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <Card className="p-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">1</div>
                    <div className="text-sm text-gray-600">CodeSystem</div>
                  </div>
                </Card>
                <Card className="p-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {resources.conceptmap ? 1 : 0}
                    </div>
                    <div className="text-sm text-gray-600">ConceptMap</div>
                  </div>
                </Card>
                <Card className="p-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{problems.length}</div>
                    <div className="text-sm text-gray-600">Conditions</div>
                  </div>
                </Card>
              </div>

              <ScrollArea className="h-96 w-full border rounded-md p-4 bg-gray-50">
                <pre className="text-xs">
                  {JSON.stringify(resources.bundle, null, 2)}
                </pre>
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};