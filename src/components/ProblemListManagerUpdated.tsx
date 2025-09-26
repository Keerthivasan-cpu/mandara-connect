import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  Plus, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Calendar,
  User,
  Stethoscope
} from 'lucide-react';
import { NAMASTECode, ICD11Code, ProblemEntry } from '@/hooks/useSupabaseData';
import { useSupabaseData } from '@/hooks/useSupabaseData';

interface ProblemListManagerProps {
  selectedNAMASTE?: NAMASTECode;
  selectedICD11: ICD11Code[];
  onAddProblem: (problem: any) => Promise<void>;
}

export const ProblemListManager: React.FC<ProblemListManagerProps> = ({
  selectedNAMASTE,
  selectedICD11,
  onAddProblem
}) => {
  const { problemEntries } = useSupabaseData();
  const [severity, setSeverity] = useState<string>('');
  const [clinicalStatus, setClinicalStatus] = useState<string>('');
  const [onsetDate, setOnsetDate] = useState<string>('');
  const [clinicalNotes, setClinicalNotes] = useState<string>('');
  const [patientId, setPatientId] = useState<string>('');

  const handleAddProblem = async () => {
    if (!selectedNAMASTE || selectedICD11.length === 0 || !severity || !clinicalStatus) {
      return;
    }

    const problemData = {
      patientId: patientId || 'PATIENT-001',
      severity: severity as 'mild' | 'moderate' | 'severe',
      clinicalStatus: clinicalStatus as 'active' | 'inactive' | 'resolved',
      onsetDate,
      clinicalNotes,
    };

    await onAddProblem(problemData);

    // Reset form
    setSeverity('');
    setClinicalStatus('');
    setOnsetDate('');
    setClinicalNotes('');
    setPatientId('');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'resolved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'inactive': return <XCircle className="h-4 w-4 text-gray-500" />;
      default: return null;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'mild': return 'bg-green-100 text-green-800 border-green-200';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'severe': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Problem Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New FHIR Problem Entry
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Selected Codes Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <Label className="text-sm font-medium text-gray-700">Selected NAMASTE Code</Label>
              {selectedNAMASTE ? (
                <div className="mt-2 p-3 bg-white border rounded-md">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-green-500 text-white">
                      {selectedNAMASTE.system}
                    </Badge>
                    <code className="text-sm">{selectedNAMASTE.code}</code>
                  </div>
                  <p className="text-sm font-medium">{selectedNAMASTE.display}</p>
                </div>
              ) : (
                <p className="mt-2 text-sm text-gray-500 italic">No NAMASTE code selected</p>
              )}
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Selected ICD-11 Codes ({selectedICD11.length})
              </Label>
              {selectedICD11.length > 0 ? (
                <ScrollArea className="mt-2 h-24 w-full border rounded-md p-2 bg-white">
                  <div className="space-y-2">
                    {selectedICD11.map((code) => (
                      <div key={code.id} className="flex items-center gap-2">
                        <Badge className={code.module === 'TM2' ? 'bg-orange-500 text-white' : 'bg-gray-500 text-white'}>
                          {code.module}
                        </Badge>
                        <code className="text-xs">{code.code}</code>
                        <span className="text-xs">{code.display}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="mt-2 text-sm text-gray-500 italic">No ICD-11 codes selected</p>
              )}
            </div>
          </div>

          {/* Problem Details Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="patient-id">Patient ID</Label>
              <Input
                id="patient-id"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                placeholder="Enter patient ID"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="severity">Severity</Label>
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger>
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mild">Mild</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="severe">Severe</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="clinical-status">Clinical Status</Label>
              <Select value={clinicalStatus} onValueChange={setClinicalStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="onset-date">Onset Date</Label>
              <Input
                id="onset-date"
                type="date"
                value={onsetDate}
                onChange={(e) => setOnsetDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="clinical-notes">Clinical Notes</Label>
            <Textarea
              id="clinical-notes"
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              placeholder="Enter any additional clinical notes..."
              rows={3}
            />
          </div>

          <Button 
            onClick={handleAddProblem}
            disabled={!selectedNAMASTE || selectedICD11.length === 0 || !severity || !clinicalStatus}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add to FHIR Problem List
          </Button>
        </CardContent>
      </Card>

      {/* Current Problem List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Current FHIR Problem List ({problemEntries.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {problemEntries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Stethoscope className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No problems recorded yet</p>
              <p className="text-sm">Add your first dual-coded problem entry above</p>
            </div>
          ) : (
            <ScrollArea className="h-80 w-full">
              <div className="space-y-4">
                {problemEntries.map((problem) => (
                  <Card key={problem.id} className="border-l-4 border-l-medical">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(problem.clinical_status)}
                          <Badge className={getSeverityColor(problem.severity)}>
                            {problem.severity}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            Patient: {problem.patient_id}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="h-3 w-3" />
                          {problem.recorded_date}
                        </div>
                      </div>

                      {/* NAMASTE Code */}
                      {problem.namaste_codes && (
                        <div className="mb-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className="bg-green-500 text-white text-xs">
                              {problem.namaste_codes.system}
                            </Badge>
                            <code className="text-xs bg-gray-100 px-1 rounded">
                              {problem.namaste_codes.code}
                            </code>
                          </div>
                          <p className="text-sm font-medium">{problem.namaste_codes.display}</p>
                        </div>
                      )}

                      {/* ICD-11 Codes */}
                      <div className="mb-3">
                        <p className="text-xs text-gray-600 mb-1">ICD-11 Mappings:</p>
                        <div className="flex flex-wrap gap-1">
                          {problem.icd11_code_ids.map((codeId, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {codeId}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Clinical Notes */}
                      {problem.clinical_notes && (
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Clinical Notes:</p>
                          <p className="text-sm text-gray-700">{problem.clinical_notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};