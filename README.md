# Customer Portal MVP

Sistema de portal do cliente para acesso centralizado a links de produtos do Mint Wiki.

## 📁 Estrutura do Projeto

```
customer-portal/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── portal.db (gerado automaticamente)
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── electron/
    ├── main.js
    ├── preload.js
    └── package.json
```

## 🚀 Instalação

### 1. Backend (FastAPI)

```bash
# Criar pasta do projeto
mkdir customer-portal
cd customer-portal

# Criar e ativar ambiente virtual Python
python3 -m venv venv
source venv/bin/activate  # No Windows: venv\Scripts\activate

# Criar pasta backend
mkdir backend
cd backend

# Criar arquivos (main.py e requirements.txt)
# Cole o conteúdo dos artifacts correspondentes

# Instalar dependências
pip install -r requirements.txt

# Iniciar servidor
python main.py
```

O backend estará rodando em: `http://localhost:8000`

### 2. Frontend (React + Vite)

```bash
# Voltar para raiz do projeto
cd ..

# Criar pasta frontend
mkdir frontend
cd frontend

# Criar estrutura de pastas
mkdir src

# Criar arquivos (package.json, vite.config.js, index.html)
# Criar src/App.jsx, src/App.css, src/main.jsx
# Cole o conteúdo dos artifacts correspondentes

# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

O frontend estará rodando em: `http://localhost:3000`

### 3. Electron (Desktop App) - Opcional

```bash
# Criar pasta electron na raiz
cd ..
mkdir electron
cd electron

# Criar arquivos (main.js, preload.js, package.json)
# Cole o conteúdo dos artifacts correspondentes

# Instalar dependências
npm install

# IMPORTANTE: Antes de rodar, certifique-se que:
# - O backend está rodando
# - O frontend foi buildado (npm run build na pasta frontend)

# Rodar em modo desenvolvimento
npm run electron:dev
```

## 🎯 Como Usar

### Modo Desenvolvimento (Web)

1. **Inicie o backend:**
   ```bash
   cd backend
   python main.py
   ```

2. **Em outro terminal, inicie o frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Acesse:** `http://localhost:3000`

4. **Faça login** com suas credenciais do Mint

### Modo Desktop (Electron)

1. **Build do frontend:**
   ```bash
   cd frontend
   npm run build
   ```

2. **Inicie o Electron:**
   ```bash
   cd electron
   npm run electron:dev
   ```

## 🔧 Configuração

### Backend Configuration

No arquivo `backend/main.py`, você pode ajustar:

- **Porta do servidor:** Linha final do arquivo (default: 8000)
- **Timeout de sessão:** Variável `timedelta(hours=8)` na função `create_session`
- **Cache duration:** Variável `max_age_minutes=15` na função `get_dashboard`
- **URL padrão do Mint:** Modificar em `LoginRequest.mint_url`

### Frontend Configuration

No arquivo `frontend/src/App.jsx`:

- **API Base URL:** Constante `API_BASE_URL` (default: http://localhost:8000)
- **URL padrão do Mint:** State `mintUrl` inicial

## 📝 Fluxo de Autenticação

1. Usuário entra com credenciais (mesmo do Mint)
2. Backend tenta autenticar no Mint via HTTP
3. Se sucesso, cria sessão local no SQLite
4. Retorna token JWT para o frontend
5. Frontend armazena token no localStorage
6. Todas as requisições subsequentes usam o token

## 🗄️ Banco de Dados Local

O sistema usa **SQLite** com duas tabelas:

### `sessions`
- `token`: Token de autenticação único
- `username`: Nome do usuário
- `mint_session`: Cookie/token da sessão do Mint
- `created_at`: Data de criação
- `expires_at`: Data de expiração (8 horas)

### `cache`
- `url`: URL da página wiki
- `content`: Conteúdo HTML da página
- `cached_at`: Timestamp do cache (válido por 15 minutos)

## 🔍 Funcionalidades Implementadas

✅ Login com credenciais do Mint (sem acesso direto ao DB)  
✅ Scraping da página wiki do Mint  
✅ Parsing de links em formato Markdown  
✅ Dashboard organizado por produtos/ambientes  
✅ Cache de conteúdo (15 minutos)  
✅ Sessões com expiração automática  
✅ Interface responsiva  
✅ Botão de refresh manual  
✅ Estrutura Electron para desktop app  

## 🐛 Troubleshooting

### Backend não inicia
- Verifique se todas as dependências estão instaladas
- Confirme que a porta 8000 está livre
- Verifique logs no terminal

### Frontend não conecta ao backend
- Confirme que o backend está rodando
- Verifique CORS no backend (já configurado)
- Verifique a URL em `API_BASE_URL`

### Autenticação falha
- Verifique suas credenciais do Mint
- Confirme que o URL do Mint está correto
- O Mint pode ter proteções anti-scraping (CAPTCHA, rate limiting)
- **IMPORTANTE:** O código atual usa uma autenticação simplificada. Você precisará ajustar a função `authenticate_with_mint()` no backend para corresponder ao fluxo real de login do Mint

### Links não aparecem
- Verifique se a página wiki tem o formato esperado
- Ajuste os seletores CSS em `parse_markdown_links()` se necessário
- Use o botão "Refresh" para atualizar o cache

## 🔄 Próximos Passos

- [ ] Ajustar autenticação real do Mint (analisar DevTools)
- [ ] Melhorar parsing de markdown (regex mais robusta)
- [ ] Adicionar testes unitários
- [ ] Implementar Docker Compose
- [ ] Adicionar logs mais detalhados
- [ ] Criar build de produção do Electron
- [ ] Adicionar notificações de sistema
- [ ] Implementar auto-update

## 📦 Build para Produção

### Frontend
```bash
cd frontend
npm run build
# Arquivos em: frontend/dist/
```

### Electron
```bash
cd electron
npm run electron:build
# Executável em: dist-electron/
```

## 🛡️ Segurança

- ✅ Senhas nunca são armazenadas
- ✅ Tokens com expiração
- ✅ HTTPS recomendado em produção
- ✅ CORS configurado
- ⚠️ Em produção, use variáveis de ambiente para configurações sensíveis

## 📞 Suporte

Para problemas ou dúvidas:
1. Verifique os logs do backend e frontend
2. Confirme que todas as dependências estão instaladas
3. Teste primeiro em modo web antes do Electron

---

**Desenvolvido com:** Python, FastAPI, React, Vite, Electron