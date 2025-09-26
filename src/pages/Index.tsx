import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Database, 
  FileText, 
  Shield, 
  Globe,
  Stethoscope,
  BookOpen,
  Activity,
  Settings,
  LogOut,
  User,
  Building
} from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { useSupabaseData, NAMASTECode, ICD11Code, ProblemEntry } from '@/hooks/useSupabaseData';
import { TerminologySearch } from '@/components/TerminologySearchUpdated';
import { ProblemListManager } from '@/components/ProblemListManagerUpdated';
import { FHIRResourceViewer } from '@/components/FHIRResourceViewerUpdated';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const { profile, signOut } = useAuth();
  const { namasteCodes, icd11Codes, problemEntries, loading, addProblemEntry } = useSupabaseData();
  const [selectedNAMASTE, setSelectedNAMASTE] = useState<NAMASTECode | undefined>();
  const [selectedICD11, setSelectedICD11] = useState<ICD11Code[]>([]);
  const [activeTab, setActiveTab] = useState('search');
  const { toast } = useToast();

  const handleNAMASTESelect = (code: NAMASTECode) => {
    setSelectedNAMASTE(code);
    toast({
      title: "NAMASTE Code Selected",
      description: `Selected: ${code.display} (${code.code})`,
    });
  };

  const handleICD11Select = (code: ICD11Code) => {
    if (!selectedICD11.find(c => c.id === code.id)) {
      setSelectedICD11([...selectedICD11, code]);
      toast({
        title: "ICD-11 Code Added",
        description: `Added: ${code.display} (${code.code})`,
      });
    }
  };

  const handleAddProblem = async (problemData: any) => {
    try {
      await addProblemEntry({
        patient_id: problemData.patientId || 'PATIENT-001',
        namaste_code_id: selectedNAMASTE?.id || '',
        icd11_code_ids: selectedICD11.map(code => code.id),
        clinical_status: problemData.clinicalStatus,
        severity: problemData.severity,
        onset_date: problemData.onsetDate,
        clinical_notes: problemData.clinicalNotes || '',
      });
      
      setSelectedNAMASTE(undefined);
      setSelectedICD11([]);
      
      toast({
        title: "Problem Added",
        description: "FHIR problem entry has been created successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const clearSelections = () => {
    setSelectedNAMASTE(undefined);
    setSelectedICD11([]);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-white shadow-sm">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-medical">
                  FHIR NAMASTE-ICD11 Integration Platform
                </h1>
                <p className="text-muted-foreground mt-2">
                  Harmonizing Traditional Medicine Terminologies with Global Healthcare Standards
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 mr-4">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4" />
                    <span className="font-medium">{profile?.full_name}</span>
                  </div>
                  {profile?.clinic_name && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building className="h-4 w-4" />
                      <span>{profile.clinic_name}</span>
                    </div>
                  )}
                  <Button variant="outline" size="sm" onClick={() => signOut()}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
                <Badge className="bg-success-medical text-white">
                  <Shield className="h-3 w-3 mr-1" />
                  FHIR R4 Compliant
                </Badge>
                <Badge className="bg-ayurveda text-white">
                  <BookOpen className="h-3 w-3 mr-1" />
                  NAMASTE Ready
                </Badge>
                <Badge className="bg-icd text-white">
                  <Globe className="h-3 w-3 mr-1" />
                  ICD-11 TM2
                </Badge>
              </div>
            </div>
          </div>
        </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-ayurveda/10 to-ayurveda/5">
            <CardContent className="p-6">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-ayurveda" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">NAMASTE Codes</p>
                  <p className="text-2xl font-bold text-ayurveda">{namasteCodes.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-icd/10 to-icd/5">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Globe className="h-8 w-8 text-icd" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">ICD-11 Codes</p>
                  <p className="text-2xl font-bold text-icd">{icd11Codes.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-medical/10 to-medical/5">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Stethoscope className="h-8 w-8 text-medical" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Active Problems</p>
                  <p className="text-2xl font-bold text-medical">{problemEntries.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-success-medical/10 to-success-medical/5">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-success-medical" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Mappings</p>
                  <p className="text-2xl font-bold text-success-medical">196</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Selection Summary */}
        {(selectedNAMASTE || selectedICD11.length > 0) && (
          <Card className="mb-6 border-medical/20 bg-medical/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-medical">Current Selection</CardTitle>
                <Button onClick={clearSelections} variant="outline" size="sm">
                  Clear All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">NAMASTE Code</h4>
                  {selectedNAMASTE ? (
                    <div className="flex items-center gap-2">
                      <Badge className="bg-ayurveda text-white">
                        {selectedNAMASTE.system}
                      </Badge>
                      <span className="font-mono text-sm">{selectedNAMASTE.code}</span>
                      <span>{selectedNAMASTE.display}</span>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">None selected</p>
                  )}
                </div>
                <div>
                  <h4 className="font-medium mb-2">ICD-11 Codes ({selectedICD11.length})</h4>
                  {selectedICD11.length > 0 ? (
                    <div className="space-y-1">
                      {selectedICD11.map((code) => (
                        <div key={code.id} className="flex items-center gap-2">
                          <Badge className={code.module === 'TM2' ? 'bg-icd text-white' : 'bg-medical text-white'}>
                            {code.module}
                          </Badge>
                          <span className="font-mono text-sm">{code.code}</span>
                          <span className="text-sm">{code.display}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">None selected</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search & Map
            </TabsTrigger>
            <TabsTrigger value="problems" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Problem List
            </TabsTrigger>
            <TabsTrigger value="fhir" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              FHIR Resources
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuration
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-6">
            <TerminologySearch 
              onNAMASTESelect={handleNAMASTESelect}
              onICD11Select={handleICD11Select}
            />
          </TabsContent>

          <TabsContent value="problems" className="space-y-6">
            <ProblemListManager
              selectedNAMASTE={selectedNAMASTE}
              selectedICD11={selectedICD11}
              onAddProblem={handleAddProblem}
            />
          </TabsContent>

          <TabsContent value="fhir" className="space-y-6">
            <FHIRResourceViewer
              selectedNAMASTE={selectedNAMASTE}
              selectedICD11={selectedICD11}
              problems={problemEntries}
            />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="p-4">
                    <h4 className="font-medium mb-2">API Endpoints</h4>
                    <div className="space-y-2 text-sm">
                      <div><strong>WHO ICD-11 API:</strong> https://id.who.int/icd/release/11/2023-01</div>
                      <div><strong>NAMASTE Service:</strong> http://terminology.mohfw.gov.in/fhir</div>
                      <div><strong>ABHA OAuth:</strong> https://abha.gov.in/api/v1/auth</div>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <h4 className="font-medium mb-2">Compliance Status</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-success-medical rounded-full"></div>
                        <span className="text-sm">FHIR R4 Compliance</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-success-medical rounded-full"></div>
                        <span className="text-sm">ISO 22600 Access Control</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-success-medical rounded-full"></div>
                        <span className="text-sm">EHR Standards 2016</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-warning-medical rounded-full"></div>
                        <span className="text-sm">ABHA Integration (Pending)</span>
                      </div>
                    </div>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      </div>
    </ProtectedRoute>
  );
};

export default Index;
