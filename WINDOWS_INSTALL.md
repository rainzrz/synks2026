# 🪟 Guia de Instalação - Windows

## Pré-requisitos

Antes de começar, você precisa ter instalado:

### 1. Python 3.8+
- Download: https://www.python.org/downloads/
- ⚠️ **IMPORTANTE**: Durante a instalação, marque a opção **"Add Python to PATH"**

### 2. Node.js (LTS)
- Download: https://nodejs.org/
- Recomendado: Versão LTS (Long Term Support)

### 3. Git (já instalado, você está usando Git Bash)
- ✅ Você já tem Git instalado

## 📦 Instalação

### Passo 1: Preparar arquivos

Crie a estrutura de pastas e copie os arquivos:

```bash
customer-portal/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── test_parser.py
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── electron/
│   ├── main.js
│   ├── preload.js
│   └── package.json
├── setup.bat
├── start-backend.bat
├── start-frontend.bat
└── start-dev.bat
```

### Passo 2: Executar Setup

**Opção 1: Usar o script .bat (RECOMENDADO)**

Simplesmente clique duas vezes no arquivo:
```
setup.bat
```

Ou via terminal:
```bash
./setup.bat
```

**Opção 2: Instalação manual**

Se o setup.bat não funcionar, faça manualmente:

```bash
# 1. Backend
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
cd ..

# 2. Frontend
cd frontend
npm install
cd ..

# 3. Electron
cd electron
npm install
cd ..
```

## 🚀 Como Executar

### Opção 1: Iniciar Backend + Frontend juntos (RECOMENDADO)

Clique duas vezes em:
```
start-dev.bat
```

Ou via terminal:
```bash
./start-dev.bat
```

Isso abrirá:
- Uma janela para o Backend (porta 8000)
- Uma janela para o Frontend (porta 3000)

### Opção 2: Iniciar separadamente

**Backend:**
```bash
./start-backend.bat
```

**Frontend (em outro terminal):**
```bash
./start-frontend.bat
```

### Opção 3: Via linha de comando

**Backend:**
```bash
cd backend
venv\Scripts\activate
python main.py
```

**Frontend (em outro terminal):**
```bash
cd frontend
npm run dev
```

## 🌐 Acessar a Aplicação

Depois de iniciar:

1. Aguarde o backend iniciar (aparecerá "Application startup complete")
2. Aguarde o frontend iniciar (aparecerá "Local: http://localhost:3000/")
3. Abra seu navegador em: **http://localhost:3000**

## 🔍 Verificando se está funcionando

### Backend
- URL: http://localhost:8000
- Health check: http://localhost:8000/api/health
- Deve retornar: `{"status":"healthy","timestamp":"..."}`

### Frontend
- URL: http://localhost:3000
- Deve aparecer a tela de login

## ❌ Solucionando Problemas

### Erro: "Python is not installed or not in PATH"

**Solução:**
1. Instale Python de https://www.python.org/downloads/
2. Durante a instalação, marque **"Add Python to PATH"**
3. Reinicie o terminal
4. Teste: `python --version`

### Erro: "ModuleNotFoundError: No module named 'fastapi'"

**Solução:**
```bash
cd backend
venv\Scripts\activate
pip install -r requirements.txt
```

### Erro: "Node.js is not installed or not in PATH"

**Solução:**
1. Instale Node.js de https://nodejs.org/
2. Reinicie o terminal
3. Teste: `node --version`

### Erro: Porta 8000 ou 3000 já está em uso

**Solução:**
```bash
# Windows - Encontrar e matar processo na porta 8000
netstat -ano | findstr :8000
taskkill /PID [PID_NUMBER] /F

# Para porta 3000
netstat -ano | findstr :3000
taskkill /PID [PID_NUMBER] /F
```

### Frontend não conecta ao Backend

**Verificações:**
1. Backend está rodando? (verifique http://localhost:8000/api/health)
2. CORS está configurado? (já está no código)
3. Firewall bloqueando? (desabilite temporariamente para teste)

## 🧪 Testar o Parser

Para testar o parsing de Markdown sem precisar do servidor:

```bash
cd backend
venv\Scripts\activate
python test_parser.py
```

## 🛑 Parar os Servidores

- **Backend**: Pressione `Ctrl + C` na janela do backend
- **Frontend**: Pressione `Ctrl + C` na janela do frontend
- Ou simplesmente feche as janelas

## 📝 Próximos Passos

1. ✅ Instalar dependências (feito)
2. ✅ Iniciar servidores (feito)
3. 🔍 Acessar http://localhost:3000
4. 🔐 Fazer login com credenciais do Mint
5. 📊 Ver dashboard com links

## 🐛 Ainda com problemas?

1. Verifique os logs do backend e frontend
2. Certifique-se que todas as dependências foram instaladas
3. Tente o setup manual
4. Verifique se as portas 8000 e 3000 estão livres

## 📞 Comandos Úteis

```bash
# Ver versão do Python
python --version

# Ver versão do Node.js
node --version

# Ver versão do npm
npm --version

# Listar processos nas portas
netstat -ano | findstr :8000
netstat -ano | findstr :3000

# Limpar cache do npm
npm cache clean --force
```

---

**Dica:** Se você preferir usar Git Bash, os scripts .bat também funcionam! Basta executar:
```bash
./setup.bat
./start-dev.bat
```