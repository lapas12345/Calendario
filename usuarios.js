import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const sql = neon(process.env.DATABASE_URL);

    // GET - Obtener usuarios
    if (req.method === 'GET') {
      const usuarios = await sql`
        SELECT id, username, nombre_completo, rol, email, activo, fecha_registro
        FROM usuarios 
        WHERE activo = true
        ORDER BY nombre_completo
      `;
      return res.status(200).json(usuarios);
    }

    // POST - Crear usuario
    if (req.method === 'POST') {
      const { username, password, nombre_completo, rol, email } = req.body;

      const resultado = await sql`
        INSERT INTO usuarios (username, password, nombre_completo, rol, email)
        VALUES (${username}, ${password}, ${nombre_completo}, ${rol}, ${email})
        RETURNING id, username, nombre_completo, rol, email
      `;

      return res.status(201).json({
        success: true,
        usuario: resultado[0]
      });
    }

    return res.status(405).json({ error: 'Método no permitido' });

  } catch (error) {
    console.error('Error en usuarios:', error);
    return res.status(500).json({ error: 'Error en el servidor' });
  }
}
