-- Drop existing SELECT policies
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.academic_sessions;
DROP POLICY IF EXISTS "Users can view their own students" ON public.students;
DROP POLICY IF EXISTS "Users can view their own terms" ON public.terms;
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;

-- Create new SELECT policies that allow all authenticated users to view all data
CREATE POLICY "Authenticated users can view all sessions" 
ON public.academic_sessions 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view all students" 
ON public.students 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view all terms" 
ON public.terms 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view all payments" 
ON public.payments 
FOR SELECT 
USING (auth.uid() IS NOT NULL);