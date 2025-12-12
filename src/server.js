// src/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './config/db.js';

import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import { proteger, esAdmin } from './middleware/authMiddleware.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Rutas principales de tu API
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// ---------- RUTA PARA CREAR TABLAS EN RAILWAY (SETUP) ----------
app.post('/api/setup-db', async (req, res) => {
  try {
    // USERS
    await pool.query(`CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      rol ENUM('admin','cliente') DEFAULT 'cliente',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // PRODUCTS
    await pool.query(`CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      descripcion TEXT,
      precio DECIMAL(10,2) NOT NULL,
      stock INT NOT NULL,
      imagen_url VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // ORDERS
    await pool.query(`CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      total DECIMAL(10,2) NOT NULL,
      estado ENUM('pendiente','pagado','enviado','cancelado') DEFAULT 'pendiente',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // ORDER_ITEMS
    await pool.query(`CREATE TABLE IF NOT EXISTS order_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      product_id INT NOT NULL,
      cantidad INT NOT NULL,
      precio_unitario DECIMAL(10,2) NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )`);

    res.json({ msg: 'Tablas creadas / verificadas correctamente en Railway ✅' });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      msg: 'Error creando tablas en Railway',
      error: error.message,
    });
  }
});
// ---------- FIN RUTA SETUP ----------

// Ruta prueba servidor
app.get('/', (req, res) => {
  res.send('API Ferretería funcionando ✅');
});

// Ruta prueba DB
app.get('/api/ping-db', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS resultado');
    res.json({ ok: true, resultado: rows[0].resultado });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, msg: 'Error conectando a la BD' });
  }
});

// Ruta protegida de prueba admin
app.get('/api/admin/test', proteger, esAdmin, (req, res) => {
  res.json({ msg: `Hola admin ${req.user.id}, tienes acceso 😎` });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en puerto ${PORT}`);
});
