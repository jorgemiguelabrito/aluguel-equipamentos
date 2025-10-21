// --- Importação dos Módulos Essenciais ---
const express = require('express');
const path = require('path'); // Módulo para lidar com caminhos de arquivos
const { pool } = require('./db.js'); // Nossa conexão com o banco de dados

const app = express();

// --- Configuração do Middleware ---
// Habilita o Express para interpretar o corpo de requisições JSON
app.use(express.json());

// --- CORREÇÃO: Servindo os arquivos estáticos (front-end) ---
// Diz ao Express para procurar arquivos estáticos DENTRO da pasta 'Public'
app.use(express.static(path.join(__dirname, 'Public')));

// --- Rota principal (Root) ---
// Envia o 'index.html' (página de login)
// quando alguém acessar a URL principal.
app.get('/', (req, res) => {
    // Busca o 'index.html' DENTRO da pasta 'Public'
    res.sendFile(path.join(__dirname, 'Public', 'index.html'));
});

// ===================================================================
// =================== ROTAS DA API (O "CÉREBRO") ====================
// ===================================================================

// --- Rota de Login (Item 7 e 8 da avaliação) ---
app.post('/api/login', async (req, res) => {
    const { login, senha } = req.body;
    try {
        // ATENÇÃO: A consulta abaixo é insegura para produção!
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

// --- CRUD Equipamentos (Item 4 da avaliação) ---
app.get('/api/equipamentos', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM material.tbEquipamento ORDER BY descricao ASC');
        res.json(rows);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/equipamentos', async (req, res) => {
    const { descricao, valor_diaria } = req.body;
    try {
        const { rows } = await pool.query(
            'INSERT INTO material.tbEquipamento (descricao, valor_diaria) VALUES ($1, $2) RETURNING *',
            [descricao, valor_diaria]
        );
        res.status(201).json(rows[0]);
	} catch (error) { res.status(500).json({ error: error.message }); }
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
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/equipamentos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM material.tbEquipamento WHERE equipamento_id = $1', [id]);
        res.status(204).send();
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- CRUD Pessoas (Item 6 da avaliação) ---
app.get('/api/pessoas', async (req, res) => {
    try {
        // *** CORREÇÃO AQUI: Removido o 's' que estava sobrando ***
        const query = `
            SELECT p.pessoa_id, p.nome, p.cpf, p.nascimento, p.telefone, t.descricao AS tipo_pessoa
            FROM cadastro.tbPessoas p
            JOIN dominio.tbPessoaTipo t ON p.pessoa_tipo_id = t.pessoa_tipo_id
            ORDER BY p.nome ASC
        `;
        const { rows } = await pool.query(query);
        res.json(rows);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// Rota para buscar apenas os tipos de pessoa (para preencher o dropdown)
app.get('/api/pessoatipos', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM dominio.tbPessoaTipo ORDER BY descricao ASC');
        res.json(rows);
  	} catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/pessoas', async (req, res) => {
    const { nome, cpf, nascimento, telefone, pessoa_tipo_id } = req.body;
    try {
        const { rows } = await pool.query(
            'INSERT INTO cadastro.tbPessoas (nome, cpf, nascimento, telefone, pessoa_tipo_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [nome, cpf, nascimento, telefone, pessoa_tipo_id]
        );
        res.status(201).json(rows[0]);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/pessoas/:id', async (req, res) => {
    const { id } = req.params;
    const { nome, cpf, nascimento, telefone, pessoa_tipo_id } = req.body;
    try {
      mande o código para min com as altereção devidas   const { rows } = await pool.query(
            'UPDATE cadastro.tbPessoas SET nome = $1, cpf = $2, nascimento = $3, telefone = $4, pessoa_tipo_id = $5 WHERE pessoa_id = $6 RETURNING *',
            [nome, cpf, nascimento, telefone, pessoa_tipo_id, id]
        );
        res.json(rows[0]);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/pessoas/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM cadastro.tbPessoas WHERE pessoa_id = $1', [id]);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
  	}
});


// --- Inicialização do Servidor ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando com sucesso na porta ${PORT}`);
});