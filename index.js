// --- Importação dos Módulos Essenciais ---
const express = require('express');
const path = require('path'); // Módulo para lidar com caminhos de arquivos
const { pool } = require('./db.js'); // Nossa conexão com o banco de dados

const app = express();

// --- Configuração do Middleware ---
// Habilita o Express para interpretar o corpo de requisições JSON
app.use(express.json());

// --- CORREÇÃO: Servindo os arquivos estáticos (front-end) ---
// Servindo arquivos da pasta raiz (onde estão seu index.html, etc.)
app.use(express.static(__dirname));

// --- Rota principal (Root) ---
// Envia o 'index.html' (página de login)
// quando alguém acessar a URL principal.
app.get('/', (req, res) => {
    // Busca o 'index.html' na pasta raiz
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ===================================================================
// =================== ROTAS DA API (O "CÉREBRO") ====================
// ===================================================================

// --- Rota de Login (Item 7 e 8 da avaliação) ---
app.post('/api/login', async (req, res) => {
    const { login, senha } = req.body;
    try {
        // ATENÇÃO: A consulta abaixo é insegura para produção!
        // O ideal é usar bcrypt para comparar senhas criptografadas.
        const { rows } = await pool.query(
            'SELECT usuario_id, nome, login FROM seguranca.tbUsuarios WHERE login = $1 AND senha = $2',
            [login, senha]
        );
        
        if (rows.length > 0) {
            // Login bem-sucedido
            res.json({ success: true, usuario: rows[0] });
        } else {
            // Login falhou
            res.status(401).json({ success: false, message: 'Login ou senha inválidos' });
        }
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ error: error.message });
    }
});

// --- CRUD Usuários (Item 2 da avaliação) ---
// [R]ead - Listar todos os usuários
app.get('/api/usuarios', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT usuario_id, nome, login FROM seguranca.tbUsuarios ORDER BY nome ASC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// [C]reate - Incluir um novo usuário
app.post('/api/usuarios', async (req, res) => {
    const { nome, login, senha } = req.body;
    try {
        const { rows } = await pool.query(
            'INSERT INTO seguranca.tbUsuarios (nome, login, senha) VALUES ($1, $2, $3) RETURNING usuario_id, nome, login',
            [nome, login, senha]
        );
        res.status(201).json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// [U]pdate - Editar um usuário
app.put('/api/usuarios/:id', async (req, res) => {
    const { id } = req.params;
    const { nome, login } = req.body;
    try {
        const { rows } = await pool.query(
            'UPDATE seguranca.tbUsuarios SET nome = $1, login = $2 WHERE usuario_id = $3 RETURNING usuario_id, nome, login',
            [nome, login, id]
        );
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// [D]elete - Excluir um usuário
app.delete('/api/usuarios/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM seguranca.tbUsuarios WHERE usuario_id = $1', [id]);
        res.status(204).send(); // 204 = No Content (sucesso sem corpo de resposta)
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- CRUD