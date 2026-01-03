-- Add received_by column to payments table
ALTER TABLE public.payments 
ADD COLUMN received_by text;