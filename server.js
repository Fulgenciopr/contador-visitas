const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

// Conexión a PostgreSQL con variable de entorno DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }  // necesario para Railway
});

// Inicializar la tabla y fila de visitas si no existen
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS visits (
      id SERIAL PRIMARY KEY,
      count INTEGER NOT NULL
    );
  `);

  const res = await pool.query('SELECT * FROM visits WHERE id = 1');
  if (res.rows.length === 0) {
    await pool.query('INSERT INTO visits (count) VALUES (0)');
  }
}

initDB().catch(console.error);

// Responder a peticiones HEAD sin incrementar contador (para UptimeRobot)
app.head('/visitas', (req, res) => {
  res.status(200).end();
});

// Incrementar contador y devolver visitas actualizadas
app.get('/visitas', async (req, res) => {
  try {
    const result = await pool.query('SELECT count FROM visits WHERE id = 1');
    let count = result.rows[0].count;

    count++;
    await pool.query('UPDATE visits SET count = $1 WHERE id = 1', [count]);

    res.json({ visitas: count });
  } catch (error) {
    console.error('Error en /visitas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Ruta raíz para comprobar que el servidor funciona
app.get('/', (req, res) => {
  res.send('Servidor del contador funcionando');
});

app.listen(port, () => {
  console.log(`Servidor escuchando en puerto ${port}`);
});