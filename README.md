# Oficina — sistema de gestão

Sistema web para uma oficina mecânica, com painel inicial, controle de peças, fornecedores e ordens de serviço. A interface abre no navegador e usa o banco MySQL incluído neste projeto.

## O que o sistema faz

- Mostra um painel com peças cadastradas, unidades em estoque, peças com quantidade baixa e ordens de serviço.
- Cadastra, pesquisa, edita e exclui peças.
- Lista fornecedores e permite cadastrar novos contatos.
- Abre ordens de serviço com cliente, telefone, veículo, placa, problema e valor da mão de obra.
- Filtra ordens por situação e permite atualizar o status.

## Requisitos

- Visual Studio Code.
- Docker Desktop instalado e aberto.
- Windows com WSL 2 habilitado, caso o Docker Desktop solicite.

Downloads oficiais: [Visual Studio Code](https://code.visualstudio.com/) e [Docker Desktop](https://www.docker.com/products/docker-desktop/).

## Iniciar pela primeira vez

1. Extraia a pasta `projeto-oficina` do ZIP.
2. Abra o VS Code e escolha **Arquivo > Abrir Pasta...**. Selecione a pasta extraída `projeto-oficina`.
3. Abra **Terminal > Novo Terminal**. O terminal precisa estar na pasta que contém `compose.yaml`.
4. Copie o arquivo de configurações de exemplo:

   ```powershell
   Copy-Item .env.example .env
   ```

5. No mesmo terminal, construa e inicie o banco e o site:

   ```powershell
   docker compose up --build -d
   ```

6. Confira se os serviços estão prontos:

   ```powershell
   docker compose ps
   ```

   Aguarde até `banco` e `app` aparecerem como `Up`/`running` e o banco ficar saudável.

7. Abra no navegador: **http://localhost:3000**.

Na primeira vez, o Docker baixa as imagens necessárias e pode levar alguns minutos. O sistema cria as tabelas e carrega os dados de demonstração automaticamente. No primeiro acesso, entre com o usuário `admin` e a senha `troque-esta-senha`. Troque a senha no `.env` antes de usar o painel com dados reais.

## Se você já tinha iniciado o banco antes

Na inicialização, o servidor confere e cria as tabelas que estiverem faltando e insere os dados de demonstração apenas quando não existirem. Seus registros atuais são preservados.

## Extensões recomendadas no VS Code

O VS Code pode sugerir as extensões ao abrir a pasta. Para consultar ou instalar manualmente, use `Ctrl+Shift+X` e procure por **SQLTools**, **SQLTools MySQL/MariaDB** e **Docker**. Elas ajudam a explorar o banco e acompanhar os contêineres; a página funciona pelo endereço local indicado acima.

## Usar o sistema

- **Visão geral:** números principais, ordens recentes e peças com estoque baixo.
- **Estoque de peças:** use **Cadastrar peça**; a busca aceita nome ou SKU; os botões de lápis e `×` editam e excluem.
- **Ordens de serviço:** use **Nova ordem de serviço** para registrar o veículo e o problema. O seletor da ordem altera o status.
- **Fornecedores:** **Adicionar fornecedor** cadastra razão social, CNPJ, telefone e e-mail.

Dados de exemplo de peças, categorias, fabricantes e fornecedores vêm do banco original enviado. Os formulários usam os valores que estão configurados em `.env`.


## Publicar online usando GitHub e Railway

O GitHub guarda o código e permite que a hospedagem receba as atualizações. O GitHub Pages publica apenas arquivos estáticos, enquanto este sistema também precisa de servidor Node.js e banco MySQL. Railway oferece publicação a partir de um repositório GitHub e serviço MySQL. Consulte o preço atual antes de publicar: pode haver cobrança depois dos créditos de teste.

1. Crie uma conta no GitHub e instale o **GitHub Desktop**.
2. No GitHub Desktop, escolha **File > Add local repository** e selecione a pasta `projeto-oficina`. Se aparecer o aviso de que a pasta ainda não é um repositório, escolha **Create a repository** nessa pasta.
3. Na aba **Changes**, escreva `Primeira versão do sistema da oficina` no resumo e clique em **Commit to main**.
4. Clique em **Publish repository** e mantenha **Keep this code private** selecionado. O Railway poderá acessar o repositório depois que você autorizar a conexão com GitHub.
5. No Railway, crie um projeto usando **Deploy from GitHub repo** e selecione o repositório `projeto-oficina`. O Railway encontra o `Dockerfile` automaticamente.
6. No canvas do projeto Railway, adicione um serviço **MySQL**.
7. Nas variáveis do serviço do site, crie estas referências para o serviço MySQL (se você chamou o serviço de `MySQL`):

   ```text
   DB_HOST       = ${{MySQL.MYSQLHOST}}
   DB_PORT       = ${{MySQL.MYSQLPORT}}
   MYSQL_USER    = ${{MySQL.MYSQLUSER}}
   MYSQL_PASSWORD= ${{MySQL.MYSQLPASSWORD}}
   MYSQL_DATABASE= ${{MySQL.MYSQLDATABASE}}
   ```

8. No serviço do site, defina `NODE_ENV=production`, `ADMIN_USER`, `ADMIN_PASSWORD` e `SESSION_SECRET`. Escolha usuário e senha que só você conheça. Guarde a senha; ela será necessária para entrar no painel.
9. Aguarde o deploy ficar pronto. Em **Settings > Networking**, escolha **Generate Domain**. O Railway cria o link público.
10. Abra o endereço gerado, entre com o usuário e a senha definidos e teste o cadastro de uma peça, um fornecedor e uma OS.

As tabelas e dados iniciais são preparados pelo próprio servidor quando ele conecta ao MySQL. Configure também `NODE_ENV=production` no serviço do site. As credenciais colocadas no Railway ficam nas variáveis do serviço, nunca no código do GitHub. Gere um segredo de sessão longo no PowerShell com `[guid]::NewGuid().ToString() + [guid]::NewGuid().ToString()` e coloque o resultado em `SESSION_SECRET`. Não conecte o banco MySQL diretamente à internet; o site usa a conexão privada entre os serviços.

Na consulta de outubro de 2026, a página de preços do Railway informa teste com créditos temporários e plano Hobby com mínimo mensal de US$ 5; o custo depende do uso. Confira os valores atuais antes de confirmar qualquer plano ou cobrança. Para uso real da oficina, faça cópias de segurança do banco e altere a senha padrão de demonstração.

## Iniciar e parar depois

```powershell
# Iniciar o site e o banco
docker compose up -d

# Ver os serviços
docker compose ps

# Acompanhar mensagens do sistema
docker compose logs -f app

# Parar os serviços e conservar os dados
docker compose down
```

Depois de parar, volte ao navegador em `http://localhost:3000` após iniciar os serviços novamente.

## Pastas e arquivos

- `public/`: interface visual (HTML, CSS e JavaScript).
- `src/server.js`: servidor que conecta a interface ao MySQL.
- `db/init/01_estrutura.sql`: tabelas de peças, fornecedores e ordens de serviço.
- `db/init/02_dados_exemplo.sql`: dados iniciais do banco enviado.
- `db/consultas/consultas.sql`: quatro consultas originais do projeto.
- `compose.yaml`: configura o site e o MySQL.
- `.env.example`: modelo das senhas usadas apenas localmente.
