import { z } from "zod";

export const careerSkillSchema = z.object({
  code: z.string(),
  name: z.string(),
  importance: z.number().min(0).max(1),
  type: z.enum(["hard", "soft"]),
});

export const careerEducationPathSchema = z.object({
  major_code: z.string(),
  priority: z.number().int().min(1),
  notes: z.string().optional(),
});

export const careerPathsSchema = z.object({
  entry: z.string().optional(),
  mid: z.string().optional(),
  senior: z.string().optional(),
  expert: z.string().optional(),
});

export const relatedCareersSchema = z.object({
  related: z.array(z.string()).default([]),
  alternative: z.array(z.string()).default([]),
  progression: z.array(z.string()).default([]),
});

export const salaryDataSchema = z.object({
  currency: z.string().default("VND"),
  min: z.number(),
  max: z.number(),
  period: z.enum(["month", "year", "hour"]),
  location: z.string().default("Vietnam"),
  experience_level: z.enum(["all", "entry", "mid", "senior"]),
  year: z.number().int(),
  source: z.string(),
});

export const demandDataSchema = z.object({
  level: z.enum(["low", "medium", "high"]),
  year: z.number().int(),
  source: z.string(),
});

export const marketDataSchema = z.object({
  salary: salaryDataSchema.optional(),
  demand: demandDataSchema.optional(),
});

export const riasecProfileSchema = z.object({
  R: z.number().min(0).max(1),
  I: z.number().min(0).max(1),
  A: z.number().min(0).max(1),
  S: z.number().min(0).max(1),
  E: z.number().min(0).max(1),
  C: z.number().min(0).max(1),
});

export const careerFormSchema = z.object({
  code: z.string().regex(/^[A-Z0-9_]+$/),
  name: z.string().min(1),
  name_en: z.string().optional(),
  slug: z.string().regex(/^[a-z0-9\-]+$/),
  career_domain_code: z.string().min(1),
  description: z.string().optional(),
  
  daily_tasks: z.array(z.string()).default([]),
  work_environment: z.string().optional(),
  skills: z.array(careerSkillSchema).default([]),
  tools_used: z.array(z.string()).default([]),
  education_paths: z.array(careerEducationPathSchema).default([]),
  career_paths: careerPathsSchema.optional(),
  related_careers: relatedCareersSchema.optional(),
  market_data: marketDataSchema.optional(),
  
  good_fit_indicators: z.array(z.string()).default([]),
  possible_challenges: z.array(z.string()).default([]),
  work_style: z.array(z.string()).default([]),
  company_examples: z.array(z.string()).default([]),
  
  riasec_profile: riasecProfileSchema.optional(),
  ability_weights: z.record(z.string(), z.number()).optional(),
  
  status: z.enum(['draft', 'needs_verification', 'verified', 'published', 'archived']).default('draft'),
  source: z.string().optional(),
  source_url: z.string().optional(),
  source_type: z.enum(["official", "research", "internal"]).optional(),
});

export type CareerFormValues = z.infer<typeof careerFormSchema>;
