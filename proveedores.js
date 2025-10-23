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

    // GET - Obtener proveedores
    if (req.method === 'GET') {
      const { id } = req.query;

      if (id) {
        const proveedor = await sql`
          SELECT * FROM proveedores WHERE id = ${id}
        `;
        return res.status(200).json(proveedor[0] || null);
      }

      const proveedores = await sql`
        SELECT * FROM proveedores WHERE activo = true ORDER BY nombre
      `;
      return res.status(200).json(proveedores);
    }

    // POST - Crear proveedor
    if (req.method === 'POST') {
      const { ruc, nombre, contacto, telefono, email, direccion, ciudad } = req.body;

      const resultado = await sql`
        INSERT INTO proveedores (ruc, nombre, contacto, telefono, email, direccion, ciudad)
        VALUES (${ruc}, ${nombre}, ${contacto}, ${telefono}, ${email}, ${direccion}, ${ciudad})
        RETURNING *
      `;

      return res.status(201).json({
        success: true,
        proveedor: resultado[0]
      });
    }

    // PUT - Actualizar proveedor
    if (req.method === 'PUT') {
      const { id, ruc, nombre, contacto, telefono, email, direccion, ciudad } = req.body;

      const resultado = await sql`
        UPDATE proveedores 
        SET ruc = ${ruc}, nombre = ${nombre}, contacto = ${contacto},
            telefono = ${telefono}, email = ${email}, direccion = ${direccion},
            ciudad = ${ciudad}
        WHERE id = ${id}
        RETURNING *
      `;

      return res.status(200).json({
        success: true,
        proveedor: resultado[0]
      });
    }

    // DELETE - Desactivar proveedor
    if (req.method === 'DELETE') {
      const { id } = req.query;

      await sql`UPDATE proveedores SET activo = false WHERE id = ${id}`;

      return res.status(200).json({
        success: true,
        message: 'Proveedor desactivado'
      });
    }

    return res.status(405).json({ error: 'Método no permitido' });

  } catch (error) {
    console.error('Error en proveedores:', error);
    return res.status(500).json({ error: 'Error en el servidor' });
  }
}
