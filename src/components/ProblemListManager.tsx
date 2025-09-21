import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle, Clock, Plus, FileText } from 'lucide-react';
import { NAMASTECode, ICD11Code, FHIRProblemEntry, mockProblemEntries } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';

interface ProblemListManagerProps {
  selectedNAMASTE?: NAMASTECode;
  selectedICD11: ICD11Code[];
  onAddProblem: (problem: Partial<FHIRProblemEntry>) => void;
}

export const ProblemListManager: React.FC<ProblemListManagerProps> = ({
  selectedNAMASTE,
  selectedICD11,
  onAddProblem
}) => {
  const [problems, setProblems] = useState<FHIRProblemEntry[]>(mockProblemEntries);
  const [severity, setSeverity] = useState<'mild' | 'moderate' | 'severe'>('mild');
  const [clinicalStatus, setClinicalStatus] = useState<'active' | 'inactive' | 'resolved'>('active');
  const [onsetDate, setOnsetDate] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const { toast } = useToast();

  const handleAddProblem = () => {
    if (!selectedNAMASTE || selectedICD11.length === 0) {
      toast({
        title: "Incomplete Selection",
        description: "Please select both NAMASTE and ICD-11 codes before adding to problem list.",
        variant: "destructive"
      });
      return;
    }

    const newProblem: Partial<FHIRProblemEntry> = {
      id: `prob-${Date.now()}`,
      namasteCode: selectedNAMASTE,
      icd11Codes: selectedICD11,
      clinicalStatus,
      severity,
      onsetDate: onsetDate || new Date().toISOString().split('T')[0],
      recordedDate: new Date().toISOString().split('T')[0]
    };

    onAddProblem(newProblem);
    toast({
      title: "Problem Added",
      description: "Successfully added dual-coded problem to FHIR Problem List.",
    });

    // Reset form
    setSeverity('mild');
    setClinicalStatus('active');
    setOnsetDate('');
    setClinicalNotes('');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <AlertCircle className="h-4 w-4 text-error-medical" />;
      case 'resolved': return <CheckCircle className="h-4 w-4 text-success-medical" />;
      case 'inactive': return <Clock className="h-4 w-4 text-warning-medical" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'mild': return 'bg-success-medical';
      case 'moderate': return 'bg-warning-medical';
      case 'severe': return 'bg-error-medical';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Add New Problem Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-medical" />
            Add Dual-Coded Problem Entry
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selected Codes Display */}
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium">Selected NAMASTE Code</Label>
              {selectedNAMASTE ? (
                <Card className="p-3 bg-ayurveda-secondary">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-ayurveda text-white">
                      {selectedNAMASTE.system}
                    </Badge>
                    <span className="font-mono text-sm">{selectedNAMASTE.code}</span>
                    <span className="font-medium">{selectedNAMASTE.display}</span>
                  </div>
                </Card>
              ) : (
                <p className="text-sm text-muted-foreground">No NAMASTE code selected</p>
              )}
            </div>

            <div>
              <Label className="text-sm font-medium">Selected ICD-11 Codes</Label>
              {selectedICD11.length > 0 ? (
                <div className="space-y-2">
                  {selectedICD11.map((code) => (
                    <Card key={code.id} className="p-3 bg-icd-secondary">
                      <div className="flex items-center gap-2">
                        <Badge className={code.module === 'TM2' ? 'bg-icd text-white' : 'bg-medical text-white'}>
                          {code.module}
                        </Badge>
                        <span className="font-mono text-sm">{code.code}</span>
                        <span className="font-medium">{code.display}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No ICD-11 codes selected</p>
              )}
            </div>
          </div>

          {/* Problem Details Form */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="severity">Severity</Label>
              <Select value={severity} onValueChange={(value: any) => setSeverity(value)}>
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

            <div>
              <Label htmlFor="status">Clinical Status</Label>
              <Select value={clinicalStatus} onValueChange={(value: any) => setClinicalStatus(value)}>
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

            <div>
              <Label htmlFor="onset">Onset Date</Label>
              <Input
                id="onset"
                type="date"
                value={onsetDate}
                onChange={(e) => setOnsetDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Clinical Notes</Label>
            <Textarea
              id="notes"
              placeholder="Enter clinical observations and notes..."
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
            />
          </div>

          <Button onClick={handleAddProblem} className="w-full bg-medical hover:bg-medical/90">
            <Plus className="h-4 w-4 mr-2" />
            Add to FHIR Problem List
          </Button>
        </CardContent>
      </Card>

      {/* Current Problem List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-medical" />
            Current FHIR Problem List
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {problems.map((problem) => (
              <Card key={problem.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(problem.clinicalStatus)}
                      <Badge className={getSeverityColor(problem.severity)}>
                        {problem.severity.toUpperCase()}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Recorded: {problem.recordedDate}
                      </span>
                    </div>

                    {/* NAMASTE Code */}
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-ayurveda text-white">
                          {problem.namasteCode.system}
                        </Badge>
                        <span className="font-mono text-sm">{problem.namasteCode.code}</span>
                      </div>
                      <h4 className="font-medium">{problem.namasteCode.display}</h4>
                    </div>

                    {/* ICD-11 Codes */}
                    <div className="space-y-2">
                      {problem.icd11Codes.map((code) => (
                        <div key={code.id} className="flex items-center gap-2">
                          <Badge className={code.module === 'TM2' ? 'bg-icd text-white' : 'bg-medical text-white'}>
                            {code.module}
                          </Badge>
                          <span className="font-mono text-sm">{code.code}</span>
                          <span className="text-sm">{code.display}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};