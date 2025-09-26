import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Leaf, FlowerIcon, Building } from 'lucide-react';
import { NAMASTECode, ICD11Code } from '@/hooks/useSupabaseData';
import { useSupabaseData } from '@/hooks/useSupabaseData';

interface TerminologySearchProps {
  onNAMASTESelect: (code: NAMASTECode) => void;
  onICD11Select: (code: ICD11Code) => void;
}

export const TerminologySearch: React.FC<TerminologySearchProps> = ({
  onNAMASTESelect,
  onICD11Select
}) => {
  const { namasteCodes, icd11Codes } = useSupabaseData();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('namaste');

  const filteredNAMASTE = useMemo(() => {
    if (!searchTerm) return namasteCodes;
    return namasteCodes.filter(code =>
      code.display.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [namasteCodes, searchTerm]);

  const filteredICD11 = useMemo(() => {
    if (!searchTerm) return icd11Codes;
    return icd11Codes.filter(code =>
      code.display.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [icd11Codes, searchTerm]);

  const getSystemIcon = (system: string) => {
    switch (system) {
      case 'AYURVEDA': return <Leaf className="h-4 w-4" />;
      case 'SIDDHA': return <FlowerIcon className="h-4 w-4" />;
      case 'UNANI': return <Building className="h-4 w-4" />;
      default: return <div className="h-4 w-4" />;
    }
  };

  const getSystemColor = (system: string) => {
    switch (system) {
      case 'AYURVEDA': return 'bg-green-500 text-white';
      case 'SIDDHA': return 'bg-purple-500 text-white';
      case 'UNANI': return 'bg-blue-500 text-white';
      case 'TM2': return 'bg-orange-500 text-white';
      case 'BIOMEDICINE': return 'bg-gray-500 text-white';
      default: return 'bg-gray-400 text-white';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Terminology Search & Code Mapping
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="namaste">NAMASTE Codes</TabsTrigger>
            <TabsTrigger value="icd11">ICD-11 TM2</TabsTrigger>
          </TabsList>

          <div className="mt-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by code, display name, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <TabsContent value="namaste" className="mt-0">
            <ScrollArea className="h-96 w-full border rounded-md p-4">
              <div className="space-y-3">
                {filteredNAMASTE.map((code) => (
                  <div
                    key={code.id}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => onNAMASTESelect(code)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge className={getSystemColor(code.system)}>
                          {getSystemIcon(code.system)}
                          {code.system}
                        </Badge>
                        <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                          {code.code}
                        </code>
                      </div>
                    </div>
                    <h4 className="font-medium text-gray-900 mb-1">{code.display}</h4>
                    {code.description && (
                      <p className="text-sm text-gray-600 mb-2">{code.description}</p>
                    )}
                    {code.icd11_mappings && code.icd11_mappings.length > 0 && (
                      <div>
                        <span className="text-xs text-gray-500">Mapped to ICD-11: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {code.icd11_mappings.map((mapping, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {mapping}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="icd11" className="mt-0">
            <ScrollArea className="h-96 w-full border rounded-md p-4">
              <div className="space-y-3">
                {filteredICD11.map((code) => (
                  <div
                    key={code.id}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => onICD11Select(code)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge className={getSystemColor(code.module)}>
                          {code.module}
                        </Badge>
                        <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                          {code.code}
                        </code>
                      </div>
                    </div>
                    <h4 className="font-medium text-gray-900 mb-1">{code.display}</h4>
                    {code.description && (
                      <p className="text-sm text-gray-600 mb-2">{code.description}</p>
                    )}
                    {code.namaste_mappings && code.namaste_mappings.length > 0 && (
                      <div>
                        <span className="text-xs text-gray-500">Mapped from NAMASTE: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {code.namaste_mappings.map((mapping, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {mapping}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};