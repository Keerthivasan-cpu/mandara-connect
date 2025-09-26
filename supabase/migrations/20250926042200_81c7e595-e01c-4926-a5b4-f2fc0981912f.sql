-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  clinic_name TEXT,
  clinic_id TEXT UNIQUE,
  role TEXT DEFAULT 'clinician' CHECK (role IN ('admin', 'clinician', 'researcher')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create NAMASTE codes table
CREATE TABLE public.namaste_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  display TEXT NOT NULL,
  system TEXT NOT NULL CHECK (system IN ('AYURVEDA', 'SIDDHA', 'UNANI')),
  description TEXT,
  icd11_mappings TEXT[],
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ICD-11 codes table  
CREATE TABLE public.icd11_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  display TEXT NOT NULL,
  module TEXT NOT NULL CHECK (module IN ('TM2', 'BIOMEDICINE')),
  description TEXT,
  namaste_mappings TEXT[],
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create problem entries table
CREATE TABLE public.problem_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id TEXT NOT NULL,
  namaste_code_id UUID REFERENCES public.namaste_codes(id),
  icd11_code_ids UUID[],
  clinical_status TEXT NOT NULL CHECK (clinical_status IN ('active', 'inactive', 'resolved')),
  severity TEXT NOT NULL CHECK (severity IN ('mild', 'moderate', 'severe')),
  onset_date DATE,
  recorded_date DATE NOT NULL DEFAULT CURRENT_DATE,
  clinical_notes TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  clinic_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create data exchange requests table for inter-clinic communication
CREATE TABLE public.data_exchange_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requesting_clinic_id TEXT NOT NULL,
  target_clinic_id TEXT NOT NULL,
  patient_id TEXT NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('problem_list', 'full_record', 'specific_codes')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'completed')),
  requested_by UUID NOT NULL REFERENCES public.profiles(id),
  approved_by UUID REFERENCES public.profiles(id),
  request_data JSONB,
  response_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.namaste_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.icd11_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problem_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_exchange_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for codes (readable by all authenticated users)
CREATE POLICY "Authenticated users can view NAMASTE codes" ON public.namaste_codes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Clinicians can create NAMASTE codes" ON public.namaste_codes
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can view ICD-11 codes" ON public.icd11_codes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Clinicians can create ICD-11 codes" ON public.icd11_codes
  FOR INSERT TO authenticated WITH CHECK (true);

-- RLS Policies for problem entries (clinic-based access)
CREATE POLICY "Users can view problems from their clinic" ON public.problem_entries
  FOR SELECT TO authenticated USING (
    clinic_id IN (
      SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create problems for their clinic" ON public.problem_entries
  FOR INSERT TO authenticated WITH CHECK (
    created_by IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    ) AND
    clinic_id IN (
      SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for data exchange requests
CREATE POLICY "Clinics can view requests involving them" ON public.data_exchange_requests
  FOR SELECT TO authenticated USING (
    requesting_clinic_id IN (
      SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()
    ) OR
    target_clinic_id IN (
      SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Clinics can create exchange requests" ON public.data_exchange_requests
  FOR INSERT TO authenticated WITH CHECK (
    requested_by IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for auto-creating profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add update triggers to all tables
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_namaste_codes_updated_at
  BEFORE UPDATE ON public.namaste_codes  
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_icd11_codes_updated_at
  BEFORE UPDATE ON public.icd11_codes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_problem_entries_updated_at
  BEFORE UPDATE ON public.problem_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_data_exchange_requests_updated_at
  BEFORE UPDATE ON public.data_exchange_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial NAMASTE codes
INSERT INTO public.namaste_codes (code, display, system, description, icd11_mappings) VALUES
('AYU.RESP.001', 'Kasa (Cough)', 'AYURVEDA', 'Ayurvedic condition characterized by persistent cough due to vitiated Prana Vata and Kapha', '{"TM40.00", "CA80.2"}'),
('AYU.DIGE.003', 'Amlapitta (Hyperacidity)', 'AYURVEDA', 'Digestive disorder due to aggravated Pitta dosha causing acid dyspepsia', '{"TM41.10", "DA60.0"}'),
('SID.NEUR.005', 'Vatha Noigal (Neurological disorders)', 'SIDDHA', 'Siddha neurological conditions due to deranged Vatha humor', '{"TM42.20", "8A00"}'),
('UNA.CARD.002', 'Waja-ur-Qalb (Heart palpitation)', 'UNANI', 'Unani cardiac condition with irregular heartbeats due to temperamental imbalance', '{"TM43.15", "MC81.0"}'),
('AYU.DERM.008', 'Kushtha (Skin disorders)', 'AYURVEDA', 'Chronic skin conditions due to vitiated Pitta and Rakta dhatu', '{"TM40.25", "EA90"}');

-- Insert initial ICD-11 codes
INSERT INTO public.icd11_codes (code, display, module, description, namaste_mappings) VALUES
('TM40.00', 'Respiratory disorders - Traditional Medicine', 'TM2', 'Traditional medicine classification for respiratory system disorders', '{"AYU.RESP.001"}'),
('CA80.2', 'Chronic cough', 'BIOMEDICINE', 'Biomedical classification for persistent cough lasting more than 8 weeks', NULL),
('TM41.10', 'Digestive system disorders - Traditional Medicine', 'TM2', 'Traditional medicine classification for digestive disorders', '{"AYU.DIGE.003"}'),
('DA60.0', 'Gastro-oesophageal reflux disease', 'BIOMEDICINE', 'Biomedical classification for acid reflux conditions', NULL),
('TM42.20', 'Nervous system disorders - Traditional Medicine', 'TM2', 'Traditional medicine classification for neurological conditions', '{"SID.NEUR.005"}');