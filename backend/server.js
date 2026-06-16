const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect(err => {
    if (err) { console.error('Error al conectar con MySQL:', err); return; }
    console.log('¡Conectado exitosamente a la base de datos MySQL!');
});

app.post('/api/login', (req, res) => {
    const { email, contrasena } = req.body;
    db.query('SELECT id, nombre, rol, puesto FROM usuarios WHERE email = ? AND contrasena = ?',
        [email, contrasena], (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        if (results.length > 0) {
            res.json({ success: true, usuario: results[0] });
        } else {
            res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
        }
    });
});

app.get('/api/tickets', (req, res) => {
    const query = `
        SELECT t.*, u.nombre as asignado_nombre, p.nombre as proyecto_nombre 
        FROM tickets t 
        LEFT JOIN usuarios u ON t.asignado_a = u.id
        LEFT JOIN proyectos p ON t.proyecto_id = p.id
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// ✅ UN SOLO POST de tickets, con proyecto_id
app.post('/api/tickets', (req, res) => {
    const { codigo, titulo, descripcion, prioridad, asignado_a, creado_por, fecha_limite, proyecto_id, categoria } = req.body;
    console.log('Ticket recibido:', req.body);
    const query = `
        INSERT INTO tickets (codigo, titulo, descripcion, prioridad, estado, asignado_a, creado_por, fecha_limite, proyecto_id, categoria)
        VALUES (?, ?, ?, ?, 'backlog', ?, ?, ?, ?, ?)
    `;
    db.query(query, [codigo, titulo, descripcion, prioridad, asignado_a, creado_por, fecha_limite, proyecto_id ?? null, categoria ?? 'General'], (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, id: result.insertId, message: 'Ticket creado exitosamente' });
    });
});

app.put('/api/tickets/:id/estado', (req, res) => {
    const { id } = req.params;
    const { nuevo_estado } = req.body;
    db.query('UPDATE tickets SET estado = ? WHERE id = ?', [nuevo_estado, id], (err) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true });
    });
});

app.put('/api/tickets/:id/prioridad', (req, res) => {
    const { id } = req.params;
    const { nueva_prioridad } = req.body;
    db.query('UPDATE tickets SET prioridad = ? WHERE id = ?', [nueva_prioridad, id], (err) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true });
    });
});

app.put('/api/tickets/:id/asignado', (req, res) => {
    const { id } = req.params;
    const { nuevo_asignado_id } = req.body;
    db.query('UPDATE tickets SET asignado_a = ? WHERE id = ?', [nuevo_asignado_id, id], (err) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true });
    });
});

app.get('/api/usuarios', (req, res) => {
    db.query('SELECT id, nombre, rol, puesto FROM usuarios', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// ✅ Proyectos
app.get('/api/proyectos', (req, res) => {
    db.query('SELECT id, nombre FROM proyectos', (err, rows) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json(rows);
    });
});

app.post('/api/proyectos', (req, res) => {
    const { nombre, lider_id } = req.body;
    console.log('Proyecto recibido:', req.body);
    db.query(
        'INSERT INTO proyectos (nombre, lider_id, fecha_inicio, progreso, color) VALUES (?, ?, CURDATE(), 0, "#3b82f6")',
        [nombre, lider_id || 1],
        (err, result) => {
            if (err) return res.status(500).json({ success: false, error: err.message });
            res.json({ success: true, id: result.insertId, nombre });
        }
    );
});

app.get('/api/proyectos/detalle', (req, res) => {
  db.query('SELECT id, nombre, progreso, color FROM proyectos ORDER BY fecha_inicio DESC', (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json(rows);
  });
});

app.get('/api/usuarios', (req, res) => {
  db.query('SELECT id, nombre, rol, puesto FROM usuarios', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});