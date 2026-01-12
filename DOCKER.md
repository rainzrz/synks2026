# Docker Setup Guide - Synks Application

Este guia explica como executar a aplicação Synks usando Docker.

## Pré-requisitos

- Docker instalado ([Download Docker](https://www.docker.com/get-started))
- Docker Compose instalado (geralmente incluído com o Docker Desktop)

## Estrutura de Arquivos Docker

```
synks2026/
├── docker-compose.yml           # Orquestração dos containers
├── backend/
│   ├── Dockerfile              # Imagem do backend (Python/FastAPI)
│   ├── .dockerignore           # Arquivos ignorados no build
│   └── [código backend...]
└── frontend/
    ├── Dockerfile              # Imagem do frontend (React/Nginx)
    ├── .dockerignore           # Arquivos ignorados no build
    ├── nginx.conf              # Configuração do Nginx
    └── [código frontend...]
```

## Como Usar

### 1. Subir a Aplicação

Execute no diretório raiz do projeto:

```bash
docker-compose up -d
```

Esse comando irá:
- Construir as imagens Docker (backend e frontend)
- Criar e iniciar os containers
- Configurar a rede entre os serviços

### 2. Verificar Status dos Containers

```bash
docker-compose ps
```

Você deve ver:
- `synks-backend` rodando na porta 8000
- `synks-frontend` rodando na porta 80

### 3. Acessar a Aplicação

- **Frontend**: [http://localhost](http://localhost)
- **Backend API**: [http://localhost:8000](http://localhost:8000)
- **Health Check**: [http://localhost:8000/api/health](http://localhost:8000/api/health)

### 4. Ver Logs

Ver logs de todos os serviços:
```bash
docker-compose logs -f
```

Ver logs apenas do backend:
```bash
docker-compose logs -f backend
```

Ver logs apenas do frontend:
```bash
docker-compose logs -f frontend
```

### 5. Parar a Aplicação

```bash
docker-compose down
```

Para parar e remover volumes (dados do banco):
```bash
docker-compose down -v
```

### 6. Reiniciar Após Mudanças no Código

Se você fizer alterações no código, reconstrua as imagens:

```bash
docker-compose up -d --build
```

## Detalhes Técnicos

### Backend (FastAPI)

- **Base**: Python 3.11 slim
- **Porta**: 8000
- **Volume**: `./backend/data` para persistir o banco de dados
- **Health Check**: Verifica `/api/health` a cada 30 segundos

### Frontend (React + Nginx)

- **Build Stage**: Node 20 Alpine (compila o React)
- **Production Stage**: Nginx Alpine (serve arquivos estáticos)
- **Porta**: 80
- **Features**:
  - Compressão Gzip
  - Cache de assets estáticos
  - Suporte a React Router (SPA)
  - Headers de segurança

### Rede

Os containers estão em uma rede bridge chamada `synks-network`, permitindo comunicação entre eles usando os nomes dos serviços.

## Persistência de Dados

O banco de dados SQLite é persistido em:
- Host: `./backend/data/portal.db`
- Container: `/app/data/portal.db`

Isso garante que os dados não sejam perdidos quando os containers forem removidos.

## Troubleshooting

### Porta já em uso

Se a porta 80 ou 8000 já estiver em uso, você pode modificar o `docker-compose.yml`:

```yaml
services:
  backend:
    ports:
      - "8001:8000"  # Muda para porta 8001 no host

  frontend:
    ports:
      - "8080:80"    # Muda para porta 8080 no host
```

### Reconstruir do zero

```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Ver uso de recursos

```bash
docker stats
```

### Acessar shell do container

Backend:
```bash
docker exec -it synks-backend /bin/bash
```

Frontend:
```bash
docker exec -it synks-frontend /bin/sh
```

## Ambiente de Produção

Para produção, considere:

1. **Variáveis de Ambiente**: Use arquivo `.env` para configurações sensíveis
2. **CORS**: Configure apenas os domínios necessários em [config.py](backend/config.py)
3. **HTTPS**: Configure certificados SSL no Nginx
4. **Reverse Proxy**: Use Nginx ou Traefik na frente dos containers
5. **Monitoring**: Adicione logs centralizados e métricas
6. **Backup**: Configure backup automático do banco de dados

## Comandos Úteis

```bash
# Rebuild apenas um serviço
docker-compose up -d --build backend

# Remover imagens antigas
docker image prune -a

# Ver volumes
docker volume ls

# Remover volumes não utilizados
docker volume prune

# Inspecionar container
docker inspect synks-backend

# Exportar logs
docker-compose logs > logs.txt
```

## Próximos Passos

1. Configure variáveis de ambiente para MINT_URL e outras configurações
2. Adicione Docker secrets para credenciais sensíveis
3. Configure CI/CD para build e deploy automatizados
4. Implemente health checks mais robustos
5. Configure monitoramento com Prometheus/Grafana
