const { Pool } = require('pg');

// A URL interna que você forneceu
const connectionString = 'postgresql://aluguel_de_equipamentos_de_ti_user:LjGQVY0WmyohT8JMBGY4x57PIv2qjTy2@dpg-d3ro5b95pdvs73fsa9cg-a/aluguel_de_equipamentos_de_ti';

let pool;

try {
    pool = new Pool({
        connectionString: connectionString,
        // Sem SSL
    });

    // --- ADICIONADO PARA DEBUG ---
    // Adiciona um "ouvinte" de erros. Se o pool de conexão falhar
    // por qualquer motivo (senha errada, etc.), ele vai logar o erro.
    pool.on('error', (err, client) => {
        console.error('Erro inesperado no cliente do pool', err);
        process.exit(-1); // Trava o app se o pool falhar
    });

    console.log("Pool de conexão com o banco de dados criado com sucesso.");
    // --- FIM DO DEBUG ---

} catch (error) {
    console.error("ERRO GRAVE: Não foi possível criar o Pool de conexão.", error);
    process.exit(-1); // Trava o app se nem conseguir criar o pool
}

module.exports = { pool };