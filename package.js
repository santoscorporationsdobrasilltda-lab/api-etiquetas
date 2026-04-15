const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();

// MIDDLEWARES
app.use(cors());
app.use(express.json());

// BANCO
const db = new sqlite3.Database('./banco.db');

// =============================
// 📦 TABELA ETIQUETAS
// =============================
db.run(`
CREATE TABLE IF NOT EXISTS etiquetas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pedido TEXT,
    nome TEXT,
    cidade TEXT,
    rastreio TEXT UNIQUE,
    status TEXT,
    data TEXT
)
`);

// =============================
// 👥 TABELA USUÁRIOS
// =============================
db.run(`
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario TEXT UNIQUE,
    senha TEXT,
    tipo TEXT
)
`);

// =============================
// 👑 CRIAR ADMIN PADRÃO
// =============================
db.get("SELECT * FROM usuarios WHERE usuario = ?", ["admin"], (err, row) => {
    if (!row) {
        db.run(`
            INSERT INTO usuarios (usuario, senha, tipo)
            VALUES (?, ?, ?)
        `, ["admin", "1234", "admin"]);
        console.log("👑 Usuário admin criado: admin / 1234");
    }
});

// =============================
// 🔐 LOGIN
// =============================
app.post('/login', (req, res) => {
    const { usuario, senha } = req.body;

    db.get(`
        SELECT * FROM usuarios
        WHERE usuario=? AND senha=?
    `, [usuario, senha], (err, row) => {

        if (row) {
            res.json({
                success: true,
                usuario: row.usuario,
                tipo: row.tipo
            });
        } else {
            res.json({ success: false });
        }

    });
});

// =============================
// ➕ CRIAR USUÁRIO
// =============================
app.post('/usuarios', (req, res) => {
    const { usuario, senha, tipo } = req.body;

    db.run(`
        INSERT INTO usuarios (usuario, senha, tipo)
        VALUES (?, ?, ?)
    `, [usuario, senha, tipo], function(err) {

        if (err) {
            return res.json({ success: false, error: "Usuário já existe" });
        }

        res.json({ success: true });
    });
});

// =============================
// 📦 CRIAR ETIQUETA
// =============================
app.post('/etiquetas', (req, res) => {
    const { pedido, nome, cidade, rastreio } = req.body;

    db.run(`
        INSERT INTO etiquetas (pedido, nome, cidade, rastreio, status, data)
        VALUES (?, ?, ?, ?, ?, ?)
    `, [
        pedido,
        nome,
        cidade,
        rastreio,
        "Postado",
        new Date().toISOString()
    ], function(err) {

        if (err) {
            return res.json({ success: false, error: "Erro ao salvar etiqueta" });
        }

        res.json({ success: true });
    });
});

// =============================
// 📋 LISTAR ETIQUETAS
// =============================
app.get('/etiquetas', (req, res) => {
    db.all("SELECT * FROM etiquetas ORDER BY id DESC", [], (err, rows) => {
        res.json(rows);
    });
});

// =============================
// 🔎 CONSULTAR RASTREIO
// =============================
app.get('/rastreio/:codigo', (req, res) => {

    db.get(`
        SELECT * FROM etiquetas WHERE rastreio=?
    `, [req.params.codigo], (err, row) => {

        if (row) {
            res.json(row);
        } else {
            res.json({ error: "Não encontrado" });
        }

    });
});

// =============================
// 🔄 ATUALIZAR STATUS
// =============================
app.put('/status/:rastreio', (req, res) => {
    const { status } = req.body;

    db.run(`
        UPDATE etiquetas SET status=? WHERE rastreio=?
    `, [status, req.params.rastreio], function(err) {

        res.json({ success: true });
    });
});

// =============================
// 📊 DASHBOARD
// =============================
app.get('/dashboard', (req, res) => {

    db.all("SELECT status FROM etiquetas", [], (err, rows) => {

        const total = rows.length;
        const entregues = rows.filter(r => r.status === "Entregue").length;
        const transito = rows.filter(r => r.status === "Em trânsito").length;

        res.json({
            total,
            entregues,
            transito
        });

    });
});

// =============================
// 🚀 INICIAR SERVIDOR
// =============================
app.listen(3000, () => {
    console.log("🚀 API rodando em http://localhost:3000");
});