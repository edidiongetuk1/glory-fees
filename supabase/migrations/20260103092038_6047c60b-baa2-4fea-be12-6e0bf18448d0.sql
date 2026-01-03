-- Drop existing UPDATE/DELETE policies and create role-based ones

-- STUDENTS TABLE
DROP POLICY IF EXISTS "Users can update their own students" ON public.students;
DROP POLICY IF EXISTS "Users can delete their own students" ON public.students;

CREATE POLICY "Super admins can update all students" 
ON public.students 
FOR UPDATE 
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can delete all students" 
ON public.students 
FOR DELETE 
USING (has_role(auth.uid(), 'super_admin'));

-- PAYMENTS TABLE
DROP POLICY IF EXISTS "Users can update their own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can delete their own payments" ON public.payments;

CREATE POLICY "Super admins can update all payments" 
ON public.payments 
FOR UPDATE 
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can delete all payments" 
ON public.payments 
FOR DELETE 
USING (has_role(auth.uid(), 'super_admin'));

-- TERMS TABLE
DROP POLICY IF EXISTS "Users can update their own terms" ON public.terms;
DROP POLICY IF EXISTS "Users can delete their own terms" ON public.terms;

CREATE POLICY "Super admins can update all terms" 
ON public.terms 
FOR UPDATE 
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can delete all terms" 
ON public.terms 
FOR DELETE 
USING (has_role(auth.uid(), 'super_admin'));

-- ACADEMIC SESSIONS TABLE
DROP POLICY IF EXISTS "Users can update their own sessions" ON public.academic_sessions;
DROP POLICY IF EXISTS "Users can delete their own sessions" ON public.academic_sessions;

CREATE POLICY "Super admins can update all sessions" 
ON public.academic_sessions 
FOR UPDATE 
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can delete all sessions" 
ON public.academic_sessions 
FOR DELETE 
USING (has_role(auth.uid(), 'super_admin'));