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

    // GET - Obtener órdenes con detalles
    if (req.method === 'GET') {
      const { id } = req.query;

      if (id) {
        const orden = await sql`
          SELECT o.*, p.nombre as proveedor_nombre
          FROM ordenes_compra o
          JOIN proveedores p ON o.proveedor_id = p.id
          WHERE o.id = ${id}
        `;

        if (orden.length > 0) {
          const detalles = await sql`
            SELECT d.*, pr.nombre as producto_nombre
            FROM detalle_orden_compra d
            JOIN productos pr ON d.producto_id = pr.id
            WHERE d.orden_id = ${id}
          `;

          return res.status(200).json({
            ...orden[0],
            detalles: detalles
          });
        }

        return res.status(404).json({ error: 'Orden no encontrada' });
      }

      const ordenes = await sql`
        SELECT o.*, p.nombre as proveedor_nombre
        FROM ordenes_compra o
        JOIN proveedores p ON o.proveedor_id = p.id
        ORDER BY o.fecha_orden DESC
      `;

      return res.status(200).json(ordenes);
    }

    // POST - Crear nueva orden
    if (req.method === 'POST') {
      const { numero_orden, proveedor_id, fecha_orden, fecha_entrega_esperada,
              estado, subtotal, impuestos, total, observaciones, 
              usuario_registro, detalles } = req.body;

      // Crear orden
      const orden = await sql`
        INSERT INTO ordenes_compra 
        (numero_orden, proveedor_id, fecha_orden, fecha_entrega_esperada,
         estado, subtotal, impuestos, total, observaciones, usuario_registro)
        VALUES (${numero_orden}, ${proveedor_id}, ${fecha_orden}, 
                ${fecha_entrega_esperada}, ${estado}, ${subtotal}, 
                ${impuestos}, ${total}, ${observaciones}, ${usuario_registro})
        RETURNING *
      `;

      // Insertar detalles
      if (detalles && detalles.length > 0) {
        for (const detalle of detalles) {
          await sql`
            INSERT INTO detalle_orden_compra 
            (orden_id, producto_id, cantidad, precio_unitario, subtotal)
            VALUES (${orden[0].id}, ${detalle.producto_id}, ${detalle.cantidad},
                    ${detalle.precio_unitario}, ${detalle.subtotal})
          `;
        }
      }

      return res.status(201).json({
        success: true,
        orden: orden[0]
      });
    }

    // PUT - Actualizar estado de orden
    if (req.method === 'PUT') {
      const { id, estado, fecha_entrega_real } = req.body;

      const resultado = await sql`
        UPDATE ordenes_compra 
        SET estado = ${estado}, 
            fecha_entrega_real = ${fecha_entrega_real}
        WHERE id = ${id}
        RETURNING *
      `;

      return res.status(200).json({
        success: true,
        orden: resultado[0]
      });
    }

    return res.status(405).json({ error: 'Método no permitido' });

  } catch (error) {
    console.error('Error en órdenes:', error);
    return res.status(500).json({ error: 'Error en el servidor' });
  }
}
