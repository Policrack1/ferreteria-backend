// src/controllers/authController.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';

export const registro = async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ msg: 'Nombre, email y password son obligatorios' });
    }

    // Verificar si ya existe el correo
    const [existe] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existe.length > 0) {
      return res.status(400).json({ msg: 'El correo ya está registrado' });
    }

    // Hashear contraseña
    const hash = await bcrypt.hash(password, 10);

    // Insertar usuario
    const [resultado] = await pool.query(
      'INSERT INTO users (nombre, email, password, rol) VALUES (?, ?, ?, ?)',
      [nombre, email, hash, rol === 'admin' ? 'admin' : 'cliente']
    );

    return res.status(201).json({
      msg: 'Usuario registrado correctamente',
      id: resultado.insertId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ msg: 'Email y password son obligatorios' });
    }

    // Buscar usuario
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      return res.status(400).json({ msg: 'Credenciales inválidas' });
    }

    const user = rows[0];

    // Comparar contraseña
    const coincide = await bcrypt.compare(password, user.password);
    if (!coincide) {
      return res.status(400).json({ msg: 'Credenciales inválidas' });
    }

    // Generar token
    const token = jwt.sign(
      { id: user.id, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      msg: 'Login correcto',
      token,
      usuario: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};
