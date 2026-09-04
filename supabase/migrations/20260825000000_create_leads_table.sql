-- Create leads table for Landing Page (Pre-launch)
CREATE TABLE public.leads (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    email text NOT NULL,
    full_name text,
    source text,
    status text DEFAULT 'new'::text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT leads_pkey PRIMARY KEY (id),
    CONSTRAINT leads_email_key UNIQUE (email)
);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert (Submit form)
CREATE POLICY "Enable insert for anonymous users" 
ON public.leads 
FOR INSERT 
TO public
WITH CHECK (true);

-- Allow admins to read all leads
CREATE POLICY "Enable read for admins" 
ON public.leads 
FOR SELECT 
TO authenticated 
USING (
  (SELECT auth.jwt() ->> 'app_role') IN ('admin', 'super_admin')
);

-- Allow admins to update leads
CREATE POLICY "Enable update for admins" 
ON public.leads 
FOR UPDATE 
TO authenticated 
USING (
  (SELECT auth.jwt() ->> 'app_role') IN ('admin', 'super_admin')
);

-- Allow admins to delete leads
CREATE POLICY "Enable delete for admins" 
ON public.leads 
FOR DELETE 
TO authenticated 
USING (
  (SELECT auth.jwt() ->> 'app_role') IN ('admin', 'super_admin')
);

-- Index on email for faster lookup
CREATE INDEX idx_leads_email ON public.leads USING btree (email);
