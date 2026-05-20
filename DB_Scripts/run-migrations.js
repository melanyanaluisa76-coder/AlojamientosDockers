// run-migrations.js — Ejecuta los 4 scripts SQL en las bases de datos Supabase
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const databases = [
  {
    name: 'DB_Usuarios',
    script: '01_DB_Usuarios.sql',
    config: { host: 'aws-1-us-east-1.pooler.supabase.com', port: 6543, database: 'postgres', user: 'postgres.zakncmymrxcwjktrgrag', password: 'Matiloco123.' },
  },
  {
    name: 'DB_Alojamientos',
    script: '02_DB_Alojamientos.sql',
    config: { host: 'aws-1-us-east-1.pooler.supabase.com', port: 6543, database: 'postgres', user: 'postgres.ssfaceqzpclfhupxvadb', password: 'Matiloco123.' },
  },
  {
    name: 'DB_Reservas',
    script: '03_DB_Reservas.sql',
    config: { host: 'aws-1-us-west-2.pooler.supabase.com', port: 6543, database: 'postgres', user: 'postgres.nppoirpqshitbpftwzkb', password: 'Matiloco123.' },
  },
  {
    name: 'DB_Facturacion',
    script: '04_DB_Facturacion.sql',
    config: { host: 'aws-1-us-west-2.pooler.supabase.com', port: 6543, database: 'postgres', user: 'postgres.qennvjligjiqeozvrrzm', password: 'Matiloco123.' },
  },
];

async function runScript(db) {
  const client = new Client({
    ...db.config,
    ssl: { rejectUnauthorized: false },
  });

  const sql = fs.readFileSync(path.join(__dirname, db.script), 'utf8');

  try {
    console.log(`\n🔌 Conectando a ${db.name}...`);
    await client.connect();
    console.log(`✅ Conexión exitosa.`);

    console.log(`📄 Ejecutando ${db.script}...`);
    await client.query(sql);
    console.log(`✅ ${db.name} — script ejecutado correctamente.`);
  } catch (err) {
    console.error(`❌ Error en ${db.name}: ${err.message}`);
    throw err;
  } finally {
    await client.end();
  }
}

(async () => {
  console.log('═══════════════════════════════════════════════════');
  console.log('  AlojamientoMR — Migración de bases de datos');
  console.log('═══════════════════════════════════════════════════');

  let failed = 0;
  for (const db of databases) {
    try {
      await runScript(db);
    } catch {
      failed++;
    }
  }

  console.log('\n═══════════════════════════════════════════════════');
  if (failed === 0) {
    console.log('  ✅ Todas las migraciones completadas exitosamente.');
  } else {
    console.log(`  ⚠️  ${failed} migración(es) fallaron. Revisa los errores arriba.`);
  }
  console.log('═══════════════════════════════════════════════════');
})();
