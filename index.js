// --- Importação dos Módulos Essenciais ---
const express = require('express');
const path = require('path'); // Módulo para lidar com caminhos de arquivos
// const bcrypt = require('bcryptjs'); // REMOVIDO
const { pool } = require('./db.js'); // Nossa conexão com o banco de dados

const app = express();

// --- Configuração do Middleware ---
app.use(express.json());
app.use(express.static(path.join(__dirname, 'Public')));

// --- Rota principal (Root) ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'Public', 'index.html'));
});

// ===================================================================
// =================== ROTAS DA API (O "CÉREBRO") ====================
// ===================================================================

// --- Rota de Login (SIMPLES, SEM BCRYPT) ---
app.post('/api/login', async (req, res) => {
    const { login, senha } = req.body;
    try {
        const { rows } = await pool.query(
            'SELECT usuario_id, nome, login, senha FROM seguranca.tbUsuarios WHERE login = $1',
            [login]
        );
        
        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Login ou senha inválidos' });
        }
        
        const usuario = rows[0];
        
        // MUDANÇA AQUI: Comparação direta de texto puro
        const senhaValida = (senha === usuario.senha); 
        
        if (senhaValida) {
            res.json({ success: true, usuario: { usuario_id: usuario.usuario_id, nome: usuario.nome } });
        } else {
            res.status(401).json({ success: false, message: 'Login ou senha inválidos' });
        }
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ error: error.message });
    }
});

// --- CRUD Usuários ---
app.get('/api/usuarios', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT usuario_id, nome, login FROM seguranca.tbUsuarios ORDER BY nome ASC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// [C]reate - Incluir usuário (SIMPLES, SEM BCRYPT)
app.post('/api/usuarios', async (req, res) => {
    const { nome, login, senha } = req.body;
    try {
        // MUDANÇA AQUI: Inserindo a senha em texto puro
        const { rows } = await pool.query(
            'INSERT INTO seguranca.tbUsuarios (nome, login, senha) VALUES ($1, $2, $3) RETURNING usuario_id, nome, login',
            [nome, login, senha] // Senha vai direto
        );
        res.status(201).json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

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

app.delete('/api/usuarios/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM seguranca.tbUsuarios WHERE usuario_id = $1', [id]);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- CRUD Equipamentos ---
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

// --- CRUD Pessoas ---
app.get('/api/pessoas', async (req, res) => {
    try {
        // CORREÇÃO: Mudei "t.descricao AS tipo_pessoa" para "t.descricao AS tipo_descricao"
        // para bater com o que seu frontend espera em 'pessoas.html'
        const query = `
            SELECT p.pessoa_id, p.nome, p.cpf, p.nascimento, p.telefone, 
                   t.descricao AS tipo_descricao, t.pessoa_tipo_id 
            FROM cadastro.tbPessoas p
            JOIN dominio.tbPessoaTipo t ON p.pessoa_tipo_id = t.pessoa_tipo_id
            ORDER BY p.nome ASC
        `;
        const { rows } = await pool.query(query);
        res.json(rows);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

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
        const { rows } = await pool.query(
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

// --- ROTA PARA CRIAR UM NOVO ALUGUEL ---
app.post('/api/alugueis', async (req, res) => {
    const { pessoa_id, usuario_id, data_prevista_devolucao, valor_total, itens } = req.body;

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const aluguelQuery = `
            INSERT INTO aluguel.tbAluguel (pessoa_id, usuario_id, data_prevista_devolucao, valor_total, status)
            VALUES ($1, $2, $3, $4, 'Ativo')
            RETURNING aluguel_id;
        `;
        const aluguelResult = await client.query(aluguelQuery, [pessoa_id, usuario_id, data_prevista_devolucao, valor_total]);
        const novoAluguelId = aluguelResult.rows[0].aluguel_id;

        const itensQuery = `
            INSERT INTO aluguel.tbAluguelItens (aluguel_id, equipamento_id, valor_diaria_no_aluguel)
            VALUES ($1, $2, $3);
        `;
        for (const item of itens) {
            await client.query(itensQuery, [novoAluguelId, item.equipamento_id, item.valor_diaria_no_aluguel]);
        }

        await client.query('COMMIT');
        res.status(201).json({ success: true, message: 'Aluguel salvo com sucesso!', aluguel_id: novoAluguelId });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erro ao salvar aluguel:', error);
        res.status(500).json({ error: 'Erro ao salvar o aluguel no banco de dados.' });
    } finally {
        client.release();
    }
});


// --- Inicialização do Servidor ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando com sucesso na porta ${PORT}`);
});