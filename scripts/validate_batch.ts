import fs from 'fs';
import { z } from 'zod';

const SourceSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  evidence: z.string().min(1)
});

const CareerSchema = z.object({
  career_code: z.string().min(1),
  career_name_vi: z.string().min(1),
  career_name_en: z.string().nullable().optional(),
  description_vi: z.string().min(1),
  tasks_vi: z.array(z.string()).min(1),
  skills_required: z.array(z.string()).min(1),
  riasec_code: z.string().length(3).nullable(),
  source: SourceSchema
});

const CareerBatchSchema = z.object({
  dataset: z.literal('careers'),
  schema_version: z.literal('CAREER-DATA-V1.0'),
  records: z.array(CareerSchema)
});

export function validateBatch(filePath: string, dataset: string) {
  console.log(`Validating ${filePath} for dataset ${dataset}...`);
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (dataset === 'careers') {
      const parsed = CareerBatchSchema.parse(data);
      
      // Additional semantic validation
      const codes = new Set();
      for (const record of parsed.records) {
        if (codes.has(record.career_code)) {
          throw new Error(`Duplicate career_code found: ${record.career_code}`);
        }
        codes.add(record.career_code);
      }
      console.log('Validation passed!');
      return true;
    }
    // Add other schemas as needed...
    
  } catch (err: any) {
    console.error('VALIDATION FAILED (FAIL CLOSED):');
    if (err instanceof z.ZodError) {
      console.error(JSON.stringify(err.errors, null, 2));
    } else {
      console.error(err.message);
    }
    return false;
  }
}

if (require.main === module) {
  const filePath = process.argv[2];
  const dataset = process.argv[3];
  
  if (!filePath || !dataset) {
    console.error('Usage: tsx scripts/validate_batch.ts <filePath> <dataset>');
    process.exit(1);
  }
  
  const isValid = validateBatch(filePath, dataset);
  process.exit(isValid ? 0 : 1);
}
