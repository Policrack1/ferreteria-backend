// src/controllers/orderController.js
import { pool } from '../config/db.js';

/**
 * Espera body:
 * {
 *   items: [
 *     { productId: 1, cantidad: 2 },
 *     { productId: 3, cantidad: 1 }
 *   ]
 * }
 */
export const crearPedido = async (req, res) => {
  const userId = req.user.id;
  const { items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ msg: 'No se enviaron productos en el pedido' });
  }

  // Validar cantidades
  for (const item of items) {
    if (!item.productId || !item.cantidad || item.cantidad <= 0) {
      return res.status(400).json({ msg: 'Cada item debe tener productId y cantidad > 0' });
    }
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const productIds = items.map((i) => i.productId);

    // Traer info de productos desde BD (precio y stock reales, no del frontend)
    const [productos] = await conn.query(
      `SELECT id, precio, stock FROM products WHERE id IN (${productIds.map(() => '?').join(',')})`,
      productIds
    );

    // Verificar que existan todos
    if (productos.length !== items.length) {
      return res.status(400).json({ msg: 'Algún producto no existe' });
    }

    // Armar mapa rapido id->producto
    const mapaProductos = {};
    for (const p of productos) {
      mapaProductos[p.id] = p;
    }

    // Calcular total y verificar stock
    let total = 0;

    for (const item of items) {
      const prod = mapaProductos[item.productId];
      if (!prod) {
        return res.status(400).json({ msg: `Producto con id ${item.productId} no encontrado` });
      }

      if (item.cantidad > prod.stock) {
        return res.status(400).json({
          msg: `Stock insuficiente para producto ${item.productId}`,
        });
      }

      total += Number(prod.precio) * item.cantidad;
    }

    // Insertar en tabla orders
    const [resOrder] = await conn.query(
      'INSERT INTO orders (user_id, total, estado) VALUES (?, ?, ?)',
      [userId, total, 'pendiente']
    );

    const orderId = resOrder.insertId;

    // Insertar items y actualizar stock
    for (const item of items) {
      const prod = mapaProductos[item.productId];

      await conn.query(
        'INSERT INTO order_items (order_id, product_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
        [orderId, item.productId, item.cantidad, prod.precio]
      );

      await conn.query(
        'UPDATE products SET stock = stock - ? WHERE id = ?',
        [item.cantidad, item.productId]
      );
    }

    await conn.commit();

    return res.status(201).json({
      msg: 'Pedido creado correctamente',
      orderId,
      total,
    });
  } catch (error) {
    console.error(error);
    await conn.rollback();
    return res.status(500).json({ msg: 'Error al crear pedido' });
  } finally {
    conn.release();
  }
};

export const obtenerMisPedidos = async (req, res) => {
  const userId = req.user.id;

  try {
    // Pedidos del usuario
    const [pedidos] = await pool.query(
      'SELECT id, total, estado, created_at FROM orders WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    if (pedidos.length === 0) {
      return res.json([]);
    }

    const orderIds = pedidos.map((p) => p.id);

    const [items] = await pool.query(
      `SELECT oi.order_id, oi.product_id, oi.cantidad, oi.precio_unitario, p.nombre
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id IN (${orderIds.map(() => '?').join(',')})`,
      orderIds
    );

    // Agrupar items por pedido
    const itemsPorPedido = {};
    for (const it of items) {
      if (!itemsPorPedido[it.order_id]) itemsPorPedido[it.order_id] = [];
      itemsPorPedido[it.order_id].push({
        product_id: it.product_id,
        nombre: it.nombre,
        cantidad: it.cantidad,
        precio_unitario: it.precio_unitario,
      });
    }

    const respuesta = pedidos.map((p) => ({
      ...p,
      items: itemsPorPedido[p.id] || [],
    }));

    res.json(respuesta);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al obtener pedidos' });
  }
};
