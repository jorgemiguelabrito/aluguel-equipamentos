// --- Configurações Iniciais ---
const express = require('express');
const app = express();
const { pool } = require('./db.js'); // Importa a conexão com o banco

// --- Middlewares (Configurações do Express) ---
app.use(express.json()); // Habilita o Express para entender requisições com corpo em JSON
app.use(express.static('public')); // Habilita o Express para servir arquivos estáticos da pasta 'public'


// ----------- ROTAS DA API (Endpoints) -----------

// --- CRUD Usuários ---

// [R]ead - Listar todos os usuários
app.get('/api/usuarios', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT usuario_id, nome, login FROM seguranca.tbUsuarios ORDER BY nome ASC');
        res.json(rows);
    } catch (error) {
        console.error('Erro ao listar usuários:', error);
        res.status(500).json({ error: 'Erro interno no servidor' });
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
        console.error('Erro ao incluir usuário:', error);
        if (error.code === '23505') {
            return res.status(400).json({ error: 'Este login já está em uso.' });
        }
        res.status(500).json({ error: 'Erro interno no servidor' });
    }
});

// [U]pdate - Editar um usuário existente
app.put('/api/usuarios/:id', async (req, res) => {
    const { id } = req.params;
    const { nome, login } = req.body;
    try {
        const { rows } = await pool.query(
            'UPDATE seguranca.tbUsuarios SET nome = $1, login = $2, atualizado_em = NOW() WHERE usuario_id = $3 RETURNING usuario_id, nome, login',
            [nome, login, id]
        );
        res.json(rows[0]);
    } catch (error) {
        console.error('Erro ao editar usuário:', error);
        if (error.code === '23505') {
            return res.status(400).json({ error: 'Este login já está em uso por outro usuário.' });
        }
        res.status(500).json({ error: 'Erro interno no servidor' });
    }
});

// [D]elete - Excluir um usuário
app.delete('/api/usuarios/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM seguranca.tbUsuarios WHERE usuario_id = $1', [id]);
        res.status(204).send();
    } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        res.status(500).json({ error: 'Erro interno no servidor' });
    }
});

// --- Rota de Login ---

app.post('/api/login', async (req, res) => {
    const { login, senha } = req.body;
    try {
        const { rows } = await pool.query(
            'SELECT usuario_id, nome, login FROM seguranca.tbUsuarios WHERE login = $1 AND senha = $2',
            [login, senha]
        );
        if (rows.length > 0) {
            res.json({ success: true, usuario: rows[0] });
        } else {
            res.status(401).json({ success: false, message: 'Login ou senha inválidos' });
        }
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ error: 'Erro interno no servidor' });
    }
});

// --- CRUD Equipamentos ---

app.get('/api/equipamentos', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM material.tbEquipamento ORDER BY descricao ASC');
        res.json(rows);
    } catch (error) {
        console.error('Erro ao listar equipamentos:', error);
        res.status(500).json({ error: 'Erro interno no servidor' });
    }
});

app.post('/api/equipamentos', async (req, res) => {
    const { descricao, valor_diaria } = req.body;
    try {
        const { rows } = await pool.query(
            'INSERT INTO material.tbEquipamento (descricao, valor_diaria) VALUES ($1, $2) RETURNING *',
            [descricao, valor_diaria]
        );
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error('Erro ao adicionar equipamento:', error);
        res.status(500).json({ error: 'Erro interno no servidor' });
    }
});

app.put('/api/equipamentos/:id', async (req, res) => {
    const { id } = req.params;
    const { descricao, valor_diaria } = req.body;
    try {
        const { rows } = await pool.query(
            'UPDATE material.tbEquipamento SET descricao = $1, valor_diaria = $2 WHERE equipamento_id = $3 RETURNING *',
            [descricao, valor_diaria, id]
        );
        res.json(rows[0]);
    } catch (error) {
        console.error('Erro ao editar equipamento:', error);
        res.status(500).json({ error: 'Erro interno no servidor' });
    }
});

app.delete('/api/equipamentos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM material.tbEquipamento WHERE equipamento_id = $1', [id]);
        res.status(204).send();
    } catch (error) {
        console.error('Erro ao excluir equipamento:', error);
        res.status(500).json({ error: 'Erro interno no servidor' });
    }
});

// --- CRUD Pessoas ---

// Rota auxiliar para pegar os Tipos de Pessoa
app.get('/api/pessoatipos', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM dominio.tbPessoaTipo ORDER BY descricao');
        res.json(rows);
    } catch (error) {
        console.error('Erro ao buscar tipos de pessoa:', error);
        res.status(500).json({ error: 'Erro interno no servidor' });
    }
});

// [R]ead - Listar todas as pessoas
app.get('/api/pessoas', async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT p.pessoa_id, p.nome, p.cpf, p.telefone, p.nascimento, t.descricao AS tipo_descricao
            FROM cadastro.tbPessoas p
            JOIN dominio.tbPessoaTipo t ON p.pessoa_tipo_id = t.pessoa_tipo_id
            ORDER BY p.nome ASC
        `);
        res.json(rows);
    } catch (error) {
        console.error('Erro ao listar pessoas:', error);
        res.status(500).json({ error: 'Erro interno no servidor' });
    }
});

// [C]reate - Adicionar uma nova pessoa
app.post('/api/pessoas', async (req, res) => {
    const { nome, cpf, nascimento, telefone, pessoa_tipo_id } = req.body;
    try {
        const { rows } = await pool.query(
            'INSERT INTO cadastro.tbPessoas (nome, cpf, nascimento, telefone, pessoa_tipo_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [nome, cpf, nascimento, telefone, pessoa_tipo_id]
        );
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error('Erro ao adicionar pessoa:', error);
        if (error.code === '23505') {
            return res.status(400).json({ error: 'Este CPF já está cadastrado.' });
        }
        res.status(500).json({ error: 'Erro interno no servidor' });
    }
});

// [U]pdate - Editar uma pessoa
app.put('/api/pessoas/:id', async (req, res) => {
    const { id } = req.params;
    const { nome, cpf, nascimento, telefone, pessoa_tipo_id } = req.body;
    try {
        const { rows } = await pool.query(
            'UPDATE cadastro.tbPessoas SET nome=$1, cpf=$2, nascimento=$3, telefone=$4, pessoa_tipo_id=$5 WHERE pessoa_id=$6 RETURNING *',
            [nome, cpf, nascimento, telefone, pessoa_tipo_id, id]
        );
        res.json(rows[0]);
    } catch (error) {
        console.error('Erro ao editar pessoa:', error);
        if (error.code === '23505') {
            return res.status(400).json({ error: 'Este CPF já pertence a outra pessoa.' });
        }
        res.status(500).json({ error: 'Erro interno no servidor' });
    }
});

// [D]elete - Excluir uma pessoa
app.delete('/api/pessoas/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM cadastro.tbPessoas WHERE pessoa_id = $1', [id]);
        res.status(204).send();
    } catch (error) {
        console.error('Erro ao excluir pessoa:', error);
        if (error.code === '23503') {
            return res.status(400).json({ error: 'Não é possível excluir esta pessoa, pois ela está associada a um aluguel.' });
        }
        res.status(500).json({ error: 'Erro interno no servidor' });
    }
});

// ---------------------------------------------------------------

// --- Inicialização do Servidor ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

