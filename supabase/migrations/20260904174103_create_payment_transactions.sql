CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'rejected');
CREATE TYPE payment_method AS ENUM ('bank_transfer');

CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    status payment_status NOT NULL DEFAULT 'pending',
    method payment_method NOT NULL DEFAULT 'bank_transfer',
    plan_id UUID NOT NULL REFERENCES membership_plans(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Triggers for updated_at
CREATE TRIGGER update_payment_transactions_modtime
BEFORE UPDATE ON payment_transactions
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Enable RLS
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can insert their own payment transactions"
ON payment_transactions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own payment transactions"
ON payment_transactions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all payment transactions"
ON payment_transactions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Admins can update all payment transactions"
ON payment_transactions FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'super_admin')
  )
);
