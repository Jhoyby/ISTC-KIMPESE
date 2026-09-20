// Abstraction base externe — JSON local par défaut, externe si env configuré
const fs=require('fs');
const path=require('path');

function readJson(file, fallback){
  try{ if(fs.existsSync(file)) return JSON.parse(fs.readFileSync(file,'utf8')); }catch(e){ console.error('readJson',file,e.message); }
  return fallback;
}
function writeJson(file,data){ fs.writeFileSync(file, JSON.stringify(data,null,2),'utf8'); }

// Détection externe
const DB_PROVIDER=(process.env.DB_PROVIDER||'').toLowerCase(); // mongodb | postgres | firebase | supabase
const EXTERNAL_ENABLED=!!(process.env.DATABASE_URL || process.env.MONGODB_URI || DB_PROVIDER);

let mongoClient=null, pgPool=null, firebaseApp=null;

async function getExternal(){
  if(!EXTERNAL_ENABLED) return null;
  try{
    if(process.env.MONGODB_URI){
      if(!mongoClient){ const {MongoClient}=require('mongodb'); mongoClient=new MongoClient(process.env.MONGODB_URI); await mongoClient.connect(); }
      return {type:'mongodb', client:mongoClient, db:mongoClient.db(process.env.MONGODB_DB||'istc')};
    }
    if(process.env.DATABASE_URL && (DB_PROVIDER==='postgres'||process.env.DATABASE_URL.startsWith('postgres'))){
      if(!pgPool){ const {Pool}=require('pg'); pgPool=new Pool({connectionString:process.env.DATABASE_URL, ssl:process.env.PG_SSL?{rejectUnauthorized:false}:false}); }
      return {type:'postgres', pool:pgPool};
    }
    if(DB_PROVIDER==='firebase' || process.env.FIREBASE_SERVICE_ACCOUNT){
      if(!firebaseApp){ const admin=require('firebase-admin'); const sa=JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT); firebaseApp=admin.initializeApp({credential:admin.credential.cert(sa)}); }
      return {type:'firebase', app:firebaseApp};
    }
    if(DB_PROVIDER==='supabase'){
      const {createClient}=require('@supabase/supabase-js');
      return {type:'supabase', client:createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)};
    }
  }catch(e){ console.warn('External DB init fail, fallback JSON:',e.message); }
  return null;
}

// API unifiée (async)
async function dbGet(collection, id){
  const ext=await getExternal();
  if(!ext) return null; // fallback JSON géré par appelant
  if(ext.type==='mongodb'){ const doc=await ext.db.collection(collection).findOne({id}); return doc; }
  if(ext.type==='postgres'){ const r=await ext.pool.query(`SELECT data FROM ${collection} WHERE id=$1`,[String(id)]); return r.rows[0]?.data||null; }
  if(ext.type==='firebase'){ const snap=await ext.app.firestore().collection(collection).doc(String(id)).get(); return snap.exists? snap.data():null; }
  if(ext.type==='supabase'){ const {data}=await ext.client.from(collection).select('data').eq('id',String(id)).single(); return data?.data||null; }
  return null;
}
async function dbList(collection){
  const ext=await getExternal();
  if(!ext) return null;
  if(ext.type==='mongodb'){ return await ext.db.collection(collection).find({}).toArray(); }
  if(ext.type==='postgres'){ const r=await ext.pool.query(`SELECT data FROM ${collection} ORDER BY id DESC`); return r.rows.map(x=>x.data); }
  if(ext.type==='firebase'){ const s=await ext.app.firestore().collection(collection).get(); return s.docs.map(d=>d.data()); }
  if(ext.type==='supabase'){ const {data}=await ext.client.from(collection).select('data'); return (data||[]).map(x=>x.data); }
  return null;
}
async function dbUpsert(collection, id, data){
  const ext=await getExternal();
  if(!ext) return false;
  if(ext.type==='mongodb'){ await ext.db.collection(collection).updateOne({id:String(id)},{ $set:data},{upsert:true}); return true; }
  if(ext.type==='postgres'){ await ext.pool.query(`INSERT INTO ${collection}(id,data) VALUES($1,$2) ON CONFLICT(id) DO UPDATE SET data=$2`,[String(id), JSON.stringify(data)]); return true; }
  if(ext.type==='firebase'){ await ext.app.firestore().collection(collection).doc(String(id)).set(data,{merge:true}); return true; }
  if(ext.type==='supabase'){ await ext.client.from(collection).upsert({id:String(id), data}); return true; }
  return false;
}

module.exports={ readJson, writeJson, getExternal, dbGet, dbList, dbUpsert, EXTERNAL_ENABLED, DB_PROVIDER };
