// Este código cria um micro-servidor web personalizado
const http = require('http');

const server = http.createServer((req, res) => {
    // Define o cabeçalho da resposta
    res.writeHead(200, {'Content-Type': 'text/plain; charset=utf-8'});
    
    // Monta a mensagem de resposta com várias linhas
    const responseMessage = [
        'Projeto: Sistema de Aluguel de Equipamentos de TI',
        'Status: Aplicação no ar!',
        '', // Linha em branco para separar
        'Aluno: Jorge Miguel Alves de Brito',
        'Professor: Hiran Savir Junior'
    ].join('\n'); // O '\n' cria uma nova linha

    // Envia a mensagem finalizada
    res.end(responseMessage);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});