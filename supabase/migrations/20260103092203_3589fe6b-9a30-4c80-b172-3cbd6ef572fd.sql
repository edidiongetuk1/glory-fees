-- Create payment_audit table to track all payment changes
CREATE TABLE public.payment_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('created', 'edited', 'voided')),
  previous_amount numeric,
  new_amount numeric,
  previous_method text,
  new_method text,
  reason text NOT NULL,
  performed_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_audit ENABLE ROW LEVEL SECURITY;

-- Only super admins can view audit logs
CREATE POLICY "Super admins can view audit logs"
ON public.payment_audit
FOR SELECT
USING (has_role(auth.uid(), 'super_admin'));

-- Authenticated users can create audit logs (when making payments)
CREATE POLICY "Authenticated users can create audit logs"
ON public.payment_audit
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Add is_voided column to payments table
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS is_voided boolean NOT NULL DEFAULT false;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS voided_at timestamp with time zone;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS voided_by uuid;