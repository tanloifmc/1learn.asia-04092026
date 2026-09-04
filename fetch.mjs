import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const url = process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/?apikey=' + process.env.SUPABASE_SERVICE_ROLE_KEY;
console.log('Fetching', url.substring(0, 50));
fetch(url).then(r => r.text()).then(text => {
  fs.writeFileSync('openapi.json', text);
  console.log('Saved openapi.json, length: ' + text.length);
}).catch(e => console.error(e));
