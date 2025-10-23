import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const sql = neon(process.env.DATABASE_URL);

    // GET - Obtener todos los productos o uno específico
    if (req.method === 'GET') {
      const { id } = req.query;

      if (id) {
        const producto = await sql`
          SELECT * FROM productos WHERE id = ${id}
        `;
        return res.status(200).json(producto[0] || null);
      }

      const productos = await sql`
        SELECT * FROM productos ORDER BY nombre
      `;
      return res.status(200).json(productos);
    }

    // POST - Crear nuevo producto
    if (req.method === 'POST') {
      const { codigo, nombre, tipo, descripcion, stock_actual, stock_minimo, 
              precio_compra, precio_venta, unidad_medida, ubicacion } = req.body;

      const resultado = await sql`
        INSERT INTO productos (codigo, nombre, tipo, descripcion, stock_actual, 
                              stock_minimo, precio_compra, precio_venta, 
                              unidad_medida, ubicacion)
        VALUES (${codigo}, ${nombre}, ${tipo}, ${descripcion}, ${stock_actual}, 
                ${stock_minimo}, ${precio_compra}, ${precio_venta}, 
                ${unidad_medida}, ${ubicacion})
        RETURNING *
      `;

      return res.status(201).json({
        success: true,
        producto: resultado[0]
      });
    }
