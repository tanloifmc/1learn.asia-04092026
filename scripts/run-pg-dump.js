const { execSync } = require('child_process');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: '.env.local' });
const dbUrl = process.env.DIRECT_URL;
if(!dbUrl) {
    console.error("DIRECT_URL not found");
    process.exit(1);
}

const backupDir = path.resolve(process.cwd(), '../1learn_backup');
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
}

const backupFile = path.resolve(backupDir, `prod_backup_${Date.now()}.dump`);

try {
    console.log(`Starting backup to ${backupFile}...`);
    // Pass the connection string to pg_dump
    // We use the custom format (-Fc)
    execSync(`.\\pgsql\\pgsql\\bin\\pg_dump.exe -Fc "${dbUrl}" -f "${backupFile}"`, { stdio: 'inherit' });
    console.log("Backup complete.");
    
    // Check file stats
    const stats = fs.statSync(backupFile);
    console.log(`File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    
    // Verify backup
    console.log("Verifying backup...");
    execSync(`.\\pgsql\\pgsql\\bin\\pg_restore.exe --list "${backupFile}" > "${backupFile}.list"`, { stdio: 'inherit' });
    console.log("Backup verified. See .list file for contents.");
    
} catch(e) {
    console.error("Dump failed", e.message);
    process.exit(1);
}
