# Customer Portal MVP

Sistema de portal do cliente para acesso centralizado a links de produtos do Mint Wiki.

## 📋 Pré-requisitos

- **Python 3.8+** (para o backend)
- **Node.js 16+** e **npm** (para o frontend e Electron)

## ⚡ Instalação Rápida

### 1. Instalar Dependências do Backend

```bash
cd backend
pip install -r requirements.txt
```

### 2. Instalar Dependências do Frontend

```bash
cd frontend
npm install
```

### 3. Instalar Dependências do Electron (opcional)

```bash
cd electron
npm install
```

## 🚀 Como Rodar a Aplicação

### Modo Web (Recomendado para desenvolvimento)

**1. Iniciar o Backend:**

```bash
cd backend
python main.py
```

O backend estará rodando em `http://localhost:8000`

**2. Iniciar o Frontend (em outro terminal):**

```bash
cd frontend
npm run dev
```

O frontend estará disponível em `http://localhost:3000`

**3. Acessar a aplicação:**

Abra seu navegador em `http://localhost:3000` e faça login com suas credenciais do Mint.

---

### Modo Desktop com Electron (opcional)

**1. Build do Frontend:**

```bash
cd frontend
npm run build
```

**2. Iniciar o Backend:**

```bash
cd backend
python main.py
```

**3. Iniciar o Electron (em outro terminal):**

```bash
cd electron
npm run electron:dev
```

---

**Desenvolvido com:** Python, FastAPI, React, Vite, Electron