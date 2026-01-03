-- Create table for payment approval requests
CREATE TABLE public.payment_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  term_id uuid NOT NULL,
  amount numeric NOT NULL,
  payment_method text NOT NULL,
  transaction_id text NOT NULL,
  requested_by uuid NOT NULL,
  requested_by_email text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewer_id uuid,
  reviewer_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  reviewed_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.payment_approvals ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can view all approvals"
ON public.payment_approvals
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create approval requests"
ON public.payment_approvals
FOR INSERT
WITH CHECK (auth.uid() = requested_by);

CREATE POLICY "Super admins can update approvals"
ON public.payment_approvals
FOR UPDATE
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can delete approvals"
ON public.payment_approvals
FOR DELETE
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Add approval_status to payments table
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- Update payments to include approved_by
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS approved_by uuid;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone;