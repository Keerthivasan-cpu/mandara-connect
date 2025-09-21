import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Stethoscope, Globe, BookOpen } from 'lucide-react';
import { mockNAMASTECodes, mockICD11Codes, NAMASTECode, ICD11Code } from '@/data/mockData';

interface TerminologySearchProps {
  onNAMASTESelect: (code: NAMASTECode) => void;
  onICD11Select: (code: ICD11Code) => void;
}

export const TerminologySearch: React.FC<TerminologySearchProps> = ({
  onNAMASTESelect,
  onICD11Select
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'NAMASTE' | 'ICD11'>('NAMASTE');

  const filteredNAMASTECodes = useMemo(() => {
    return mockNAMASTECodes.filter(code =>
      code.display.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const filteredICD11Codes = useMemo(() => {
    return mockICD11Codes.filter(code =>
      code.display.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const getSystemIcon = (system: string) => {
    switch (system) {
      case 'AYURVEDA': return <BookOpen className="h-4 w-4" />;
      case 'SIDDHA': return <Stethoscope className="h-4 w-4" />;
      case 'UNANI': return <Globe className="h-4 w-4" />;
      default: return <Search className="h-4 w-4" />;
    }
  };

  const getSystemColor = (system: string) => {
    switch (system) {
      case 'AYURVEDA': return 'bg-ayurveda text-white';
      case 'SIDDHA': return 'bg-medical text-white'; 
      case 'UNANI': return 'bg-icd text-white';
      case 'TM2': return 'bg-icd text-white';
      case 'BIOMEDICINE': return 'bg-medical text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5 text-medical" />
          Terminology Search & Lookup
        </CardTitle>
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'NAMASTE' ? 'default' : 'outline'}
            onClick={() => setActiveTab('NAMASTE')}
            className="bg-ayurveda hover:bg-ayurveda/90"
          >
            NAMASTE Codes
          </Button>
          <Button
            variant={activeTab === 'ICD11' ? 'default' : 'outline'}
            onClick={() => setActiveTab('ICD11')}
            className="bg-icd hover:bg-icd/90"
          >
            ICD-11 (TM2 & Biomedicine)
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${activeTab} terminology...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {activeTab === 'NAMASTE' && filteredNAMASTECodes.map((code) => (
            <Card key={code.id} className="p-3 hover:shadow-md transition-shadow cursor-pointer" 
                  onClick={() => onNAMASTESelect(code)}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getSystemIcon(code.system)}
                    <Badge className={getSystemColor(code.system)}>
                      {code.system}
                    </Badge>
                    <span className="font-mono text-sm text-medical">{code.code}</span>
                  </div>
                  <h4 className="font-medium mb-1">{code.display}</h4>
                  <p className="text-sm text-muted-foreground">{code.description}</p>
                  <div className="flex gap-1 mt-2">
                    {code.icd11Mappings.map((mapping) => (
                      <Badge key={mapping} variant="outline" className="text-xs">
                        ICD-11: {mapping}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {activeTab === 'ICD11' && filteredICD11Codes.map((code) => (
            <Card key={code.id} className="p-3 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => onICD11Select(code)}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getSystemColor(code.module)}>
                      {code.module}
                    </Badge>
                    <span className="font-mono text-sm text-medical">{code.code}</span>
                  </div>
                  <h4 className="font-medium mb-1">{code.display}</h4>
                  <p className="text-sm text-muted-foreground">{code.description}</p>
                  {code.namasteMapping && (
                    <div className="flex gap-1 mt-2">
                      {code.namasteMapping.map((mapping) => (
                        <Badge key={mapping} variant="outline" className="text-xs">
                          NAMASTE: {mapping}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};