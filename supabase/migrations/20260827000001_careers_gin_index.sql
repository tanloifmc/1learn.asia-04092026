-- Add GIN index for JSONB skills to optimize searching careers by skill
CREATE INDEX idx_careers_skills_gin ON careers USING GIN (skills);
