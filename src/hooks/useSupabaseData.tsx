import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface NAMASTECode {
  id: string;
  code: string;
  display: string;
  system: "AYURVEDA" | "SIDDHA" | "UNANI";
  description: string;
  icd11_mappings: string[];
}

export interface ICD11Code {
  id: string;
  code: string;
  display: string;
  module: "TM2" | "BIOMEDICINE";
  description: string;
  namaste_mappings?: string[];
}

export interface ProblemEntry {
  id: string;
  patient_id: string;
  namaste_code_id: string;
  icd11_code_ids: string[];
  clinical_status: "active" | "inactive" | "resolved";
  severity: "mild" | "moderate" | "severe";
  onset_date: string;
  recorded_date: string;
  clinical_notes: string;
  namaste_codes?: NAMASTECode;
}

export const useSupabaseData = () => {
  const { user, profile } = useAuth();
  const [namasteCodes, setNamasteCodes] = useState<NAMASTECode[]>([]);
  const [icd11Codes, setIcd11Codes] = useState<ICD11Code[]>([]);
  const [problemEntries, setProblemEntries] = useState<ProblemEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNamasteCodes = async () => {
    try {
      const { data, error } = await supabase
        .from("namaste_codes")
        .select("*")
        .order("display");
      
      if (error) throw error;
      setNamasteCodes((data as NAMASTECode[]) || []);
    } catch (error) {
      console.error("Error fetching NAMASTE codes:", error);
    }
  };

  const fetchICD11Codes = async () => {
    try {
      const { data, error } = await supabase
        .from("icd11_codes")
        .select("*")
        .order("display");
      
      if (error) throw error;
      setIcd11Codes((data as ICD11Code[]) || []);
    } catch (error) {
      console.error("Error fetching ICD-11 codes:", error);
    }
  };

  const fetchProblemEntries = async () => {
    if (!profile?.clinic_id) return;
    
    try {
      const { data, error } = await supabase
        .from("problem_entries")
        .select(`
          *,
          namaste_codes (*)
        `)
        .eq("clinic_id", profile.clinic_id)
        .order("recorded_date", { ascending: false });
      
      if (error) throw error;
      setProblemEntries((data as ProblemEntry[]) || []);
    } catch (error) {
      console.error("Error fetching problem entries:", error);
    }
  };

  const addProblemEntry = async (problemData: {
    patient_id: string;
    namaste_code_id: string;
    icd11_code_ids: string[];
    clinical_status: "active" | "inactive" | "resolved";
    severity: "mild" | "moderate" | "severe";
    onset_date: string;
    clinical_notes: string;
  }) => {
    if (!profile?.id || !profile?.clinic_id) throw new Error("User profile not found");

    try {
      const { data, error } = await supabase
        .from("problem_entries")
        .insert({
          ...problemData,
          created_by: profile.id,
          clinic_id: profile.clinic_id,
        })
        .select(`
          *,
          namaste_codes (*)
        `)
        .single();

      if (error) throw error;
      
      // Refresh problem entries
      await fetchProblemEntries();
      
      return data;
    } catch (error) {
      console.error("Error adding problem entry:", error);
      throw error;
    }
  };

  const createDataExchangeRequest = async (requestData: {
    target_clinic_id: string;
    patient_id: string;
    request_type: "problem_list" | "full_record" | "specific_codes";
    request_data?: any;
  }) => {
    if (!profile?.id || !profile?.clinic_id) throw new Error("User profile not found");

    try {
      const { data, error } = await supabase
        .from("data_exchange_requests")
        .insert({
          requesting_clinic_id: profile.clinic_id,
          requested_by: profile.id,
          ...requestData,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error creating data exchange request:", error);
      throw error;
    }
  };

  useEffect(() => {
    if (user) {
      setLoading(true);
      Promise.all([
        fetchNamasteCodes(),
        fetchICD11Codes(),
        fetchProblemEntries(),
      ]).finally(() => setLoading(false));
    }
  }, [user, profile?.clinic_id]);

  return {
    namasteCodes,
    icd11Codes,
    problemEntries,
    loading,
    addProblemEntry,
    createDataExchangeRequest,
    refreshData: () => {
      fetchNamasteCodes();
      fetchICD11Codes();
      fetchProblemEntries();
    },
  };
};