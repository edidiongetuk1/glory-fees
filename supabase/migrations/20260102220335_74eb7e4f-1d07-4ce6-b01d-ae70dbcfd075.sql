-- 1. Update app_role enum to include 'bursary' role
-- First, we need to drop and recreate the enum with proper values
-- Since we already have super_admin and staff, we need to add bursary

-- Create a new enum type with the correct values
DO $$ 
BEGIN
  -- Check if 'bursary' exists in the enum
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'bursary' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')
  ) THEN
    ALTER TYPE app_role ADD VALUE 'bursary';
  END IF;
END $$;

-- 2. Remove parent_phone column from students table (user requested to remove it)
-- First check if column exists, then drop it
ALTER TABLE public.students DROP COLUMN IF EXISTS parent_phone;

-- 3. Add session_id to students table to link students to sessions
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS session_id uuid REFERENCES public.academic_sessions(id);

-- 4. Add previous_class column to track class history for promotion
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS previous_class text;

-- 5. Create fee_changes table for tracking fee change approvals
CREATE TABLE IF NOT EXISTS public.fee_changes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  term_id uuid NOT NULL REFERENCES public.terms(id) ON DELETE CASCADE,
  class text NOT NULL,
  new_intake_fee numeric NOT NULL,
  returning_fee numeric NOT NULL,
  requested_by uuid NOT NULL,
  approved_by uuid,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on fee_changes
ALTER TABLE public.fee_changes ENABLE ROW LEVEL SECURITY;

-- RLS policies for fee_changes
CREATE POLICY "Authenticated users can view all fee changes" 
ON public.fee_changes 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Bursary and admins can create fee change requests" 
ON public.fee_changes 
FOR INSERT 
WITH CHECK (auth.uid() = requested_by);

CREATE POLICY "Super admins can approve fee changes" 
ON public.fee_changes 
FOR UPDATE 
USING (has_role(auth.uid(), 'super_admin'));

-- 6. Create student_archives table to keep deleted student records
CREATE TABLE IF NOT EXISTS public.student_archives (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_id uuid NOT NULL,
  reg_number text NOT NULL,
  first_name text NOT NULL,
  middle_name text,
  surname text NOT NULL,
  section text NOT NULL,
  class text NOT NULL,
  year_of_entry text NOT NULL,
  is_new_intake boolean NOT NULL,
  session_id uuid,
  archived_at timestamp with time zone NOT NULL DEFAULT now(),
  archived_by uuid NOT NULL,
  archive_reason text
);

-- Enable RLS on student_archives
ALTER TABLE public.student_archives ENABLE ROW LEVEL SECURITY;

-- RLS policies for student_archives - only super_admin can view/manage
CREATE POLICY "Only super admins can view archived students" 
ON public.student_archives 
FOR SELECT 
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Only super admins can create archives" 
ON public.student_archives 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- 7. Update trigger for handle_new_user_role to default to 'staff'
-- (already exists, but ensure it's correct)
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'staff');
  RETURN NEW;
END;
$$;

-- Create trigger if not exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();