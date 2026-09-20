#!/usr/bin/env node
// Migre JSON local -> base externe configurée via .env
require('dotenv').config();
const fs=require('fs'), path=require('path');
const { getExternal } = require('../server/db');
(async()=>{
  const ext=await getExternal();
  if(!ext){ console.log('Aucune base externe configurée (MONGODB_URI/DATABASE_URL/FIREBASE). Renseigne .env puis relance.'); process.exit(0); }
  console.log('Provider:', ext.type);
  const files={ settings:'settings.json', articles:'articles.json', registrations:'registrations.json', team:'team.json' };
  for(const [col,file] of Object.entries(files)){
    const p=path.join(__dirname,'../data',file);
    if(!fs.existsSync(p)) continue;
    const data=JSON.parse(fs.readFileSync(p,'utf8'));
    const items=Array.isArray(data)? data : [data];
    for(const item of items){
      const id=item.id || col;
      // upsert via db.js helper
      const { dbUpsert } = require('../server/db');
      await dbUpsert(col, id, item);
    }
    console.log(`✓ ${col}: ${items.length} doc(s) migrés`);
  }
  console.log('Migration terminée. EXTERNAL_ENABLED=true — le serveur utilisera la base externe.');
  process.exit(0);
})();
