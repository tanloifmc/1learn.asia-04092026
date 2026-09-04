import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ENV_FILES = ['.env', '.env.local', '.env.production', '.env.preview'];
const SENSITIVE_KEYS = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'RESEND_API_KEY',
  'SENTRY_AUTH_TOKEN',
  'STRIPE_SECRET_KEY',
  'DATABASE_URL',
];

function auditEnvFiles() {
  console.log('--- 1. Auditing Environment Files ---');
  let hasError = false;

  ENV_FILES.forEach(file => {
    const filePath = path.resolve(process.cwd(), file);
    if (!fs.existsSync(filePath)) {
      return;
    }

    console.log(`Checking ${file}...`);
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // Check for NEXT_PUBLIC_ prefix on sensitive keys
      SENSITIVE_KEYS.forEach(sensitiveKey => {
        if (line.includes(`NEXT_PUBLIC_${sensitiveKey}`)) {
          console.error(`❌ LỖI BẢO MẬT: Phát hiện tiền tố NEXT_PUBLIC_ trên key nhạy cảm: NEXT_PUBLIC_${sensitiveKey} tại ${file}:${index + 1}`);
          hasError = true;
        }
      });
    });
  });

  if (!hasError) {
    console.log('✅ PASS: Không có secret nhạy cảm nào bị rò rỉ qua NEXT_PUBLIC_.');
  }
  return hasError;
}

function auditGitHistory() {
  console.log('\n--- 2. Auditing Git History ---');
  let hasError = false;

  SENSITIVE_KEYS.forEach(key => {
    try {
      // Find if the key string exists anywhere in the git history
      // This is a basic grep. For a real audit, tool like gitleaks is better.
      const result = execSync(`git log -p -S "${key}" --all`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] });
      
      if (result.trim().length > 0) {
        // We found commits mentioning the key!
        console.warn(`⚠️ CẢNH BÁO: Tìm thấy reference tới '${key}' trong Git history! Vui lòng kiểm tra kỹ xem đó có phải là secret thật không.`);
        // Note: Not setting hasError=true strictly here because env variable names often appear in config files/scripts.
        // We should ideally check for the ACTUAL values, not the key names, but for this script, warning is good.
      }
    } catch (e) {
      // Git command failed, maybe not a git repo or no history
    }
  });

  // Let's also check for actual .env* files in git history
  try {
    const result = execSync(`git log --all --stat | grep -E ".env(.production|.local)?$"`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] });
    if (result.trim().length > 0) {
       console.error(`❌ LỖI BẢO MẬT: Tìm thấy file .env bị commit vào Git history!`);
       hasError = true;
    }
  } catch(e) {
    // grep returns 1 if no match found
  }

  if (!hasError) {
    console.log('✅ PASS: Không tìm thấy file .env nào trong Git history.');
  }

  return hasError;
}

function runAudit() {
  console.log('=== SECURITY SECRETS AUDIT ===\n');
  const envError = auditEnvFiles();
  const gitError = auditGitHistory();

  console.log('\n=== AUDIT SUMMARY ===');
  if (envError || gitError) {
    console.error('❌ FAIL: Audit không đạt yêu cầu. Vui lòng khắc phục các lỗi trên.');
    process.exit(1);
  } else {
    console.log('✅ PASS: Hệ thống secret an toàn.');
    process.exit(0);
  }
}

runAudit();
