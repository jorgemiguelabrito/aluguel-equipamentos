const { Pool } = require('pg');

// Crie um objeto Pool para gerenciar as conexões com o banco
const pool = new Pool({
    //
    // Sua URL de conexão INTERNA do Render
    // 
    connectionString: 'postgresql://aluguel_de_equipamentos_de_ti_user:LjGQVY0WmyohT8JMBGY4x57PIv2qjTy2@dpg-d3ro5b95pdvs73fsa9cg-a/aluguel_de_equipamentos_de_ti',
    
    // O bloco SSL foi REMOVIDO, pois não é necessário
    // para conexões internas no Render.
});

// Exporta o pool para que o arquivo index.js possa usá-lo
module.exports = { pool };