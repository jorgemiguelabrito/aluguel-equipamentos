const { Pool } = require('pg');

// Crie um objeto Pool para gerenciar as conexões com o banco
const pool = new Pool({
    //
    // SUA URL COMPLETA FOI COLADA AQUI
    // 
    connectionString: 'postgresql://aluguel_de_equipamentos_de_ti_user:LjGQVY0WmyohT8JMBGY4x57PIv2qjTy2@dpg-d3ro5b95pdvs73fsa9cg-a.oregon-postgres.render.com/aluguel_de_equipamentos_de_ti',
    //
    
    // Configuração necessária para conexões SSL com o Render
    ssl: {
        rejectUnauthorized: false
    }
});

// Exporta o pool para que o arquivo index.js possa usá-lo
module.exports = { pool };

