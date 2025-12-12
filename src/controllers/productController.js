// src/controllers/productController.js
import { pool } from '../config/db.js';

// GET /api/products
export const listarProductos = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al listar productos' });
  }
};

// GET /api/products/:id
export const obtenerProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ msg: 'Producto no encontrado' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al obtener producto' });
  }
};

// POST /api/products  (admin)
export const crearProducto = async (req, res) => {
  try {
    const { nombre, descripcion, precio, stock, imagen_url } = req.body;

    if (!nombre || !precio || stock == null) {
      return res.status(400).json({ msg: 'Nombre, precio y stock son obligatorios' });
    }

    const [resultado] = await pool.query(
      'INSERT INTO products (nombre, descripcion, precio, stock, imagen_url) VALUES (?, ?, ?, ?, ?)',
      [nombre, descripcion || '', precio, stock, imagen_url || '']
    );

    res.status(201).json({
      msg: 'Producto creado correctamente',
      id: resultado.insertId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al crear producto' });
  }
};

// PUT /api/products/:id  (admin)
export const actualizarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, precio, stock, imagen_url } = req.body;

    const [resultado] = await pool.query(
      'UPDATE products SET nombre = ?, descripcion = ?, precio = ?, stock = ?, imagen_url = ? WHERE id = ?',
      [nombre, descripcion || '', precio, stock, imagen_url || '', id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ msg: 'Producto no encontrado' });
    }

    res.json({ msg: 'Producto actualizado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al actualizar producto' });
  }
};

// DELETE /api/products/:id  (admin)
export const eliminarProducto = async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Verificar si el producto está en algún pedido
    const [rows] = await pool.query(
      'SELECT COUNT(*) AS total FROM order_items WHERE product_id = ?',
      [id]
    );

    if (rows[0].total > 0) {
      return res.status(400).json({
        msg: 'No se puede eliminar este producto porque ya tiene pedidos registrados',
      });
    }

    // 2. Si no está en pedidos, recién lo borramos
    const [result] = await pool.query('DELETE FROM products WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ msg: 'Producto no encontrado' });
    }

    return res.json({ msg: 'Producto eliminado correctamente' });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ msg: 'Error en el servidor al eliminar producto' });
  }
};

