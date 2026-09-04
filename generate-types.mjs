import fs from 'fs';

const openapi = JSON.parse(fs.readFileSync('openapi.json', 'utf8'));
const tables = {};

for (const key of Object.keys(openapi.definitions)) {
  const def = openapi.definitions[key];
  if (!key.includes(' ') && !key.includes('(')) {
    const props = def.properties || {};
    const cols = [];
    for (const p in props) {
      let typeStr = 'any';
      if (props[p].type === 'integer' || props[p].type === 'number') {
        typeStr = 'number';
      } else if (props[p].type === 'boolean') {
        typeStr = 'boolean';
      } else if (props[p].type === 'string') {
        typeStr = 'string';
      } else if (props[p].type === 'array') {
        typeStr = 'any[]';
      }
      
      // Basic nullability approximation
      if (!def.required || !def.required.includes(p)) {
        typeStr += ' | null';
      }
      cols.push(`"${p}": ${typeStr}`);
    }
    const rowType = '{ ' + cols.join('; ') + ' }';
    tables[key] = { Row: rowType, Insert: rowType, Update: rowType };
  }
}

let out = `export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
`;
for (const t in tables) {
  out += `      "${t}": {
        Row: ${tables[t].Row}
        Insert: ${tables[t].Insert}
        Update: ${tables[t].Update}
      }
`;
}
out += `    }
    Views: {}
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
}
`;
fs.writeFileSync('src/types/supabase.ts', out);
console.log('Generated src/types/supabase.ts with basic types.');
