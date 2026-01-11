# Guia de Integração - Analytics e Status Monitoring

## 📋 Passos para Integrar

### 1. Instalar Dependências

```bash
cd backend
# Não precisa instalar nenhuma dependência extra!
# O status check usa apenas bibliotecas padrão do Python (socket, subprocess)
```

### 2. Integrar os Endpoints no main.py

Abra seu arquivo `main.py` e adicione:

```python
# No topo do arquivo, adicione o import
from analytics_endpoints import router as analytics_router

# Depois de criar o app FastAPI, adicione:
app.include_router(analytics_router)
```

### 3. Implementar as Funções Auxiliares

As seguintes funções são placeholders e precisam ser implementadas baseadas na sua estrutura existente:

#### 3.1. `get_all_links_from_gitlab()`

```python
async def get_all_links_from_gitlab() -> List[dict]:
    """Pega todos os links de todos os usuários"""
    # Use sua função existente que busca dados do GitLab
    # Exemplo baseado no seu código:

    users = await get_all_users()  # Função que você já tem
    all_links = []

    for user in users:
        try:
            # Use sua função existente de buscar dashboard
            dashboard_data = await fetch_gitlab_wiki_dashboard(user['username'])

            # Extrair links dos grupos
            for group in dashboard_data.get('groups', []):
                for link in group.get('links', []):
                    all_links.append({
                        'id': f"{user['username']}_{link['url']}",  # ID único
                        'name': link.get('text', link['url']),
                        'url': link['url'],
                        'username': user['username'],
                        'product': group.get('product'),
                        'environment': group.get('environment')
                    })
        except Exception as e:
            print(f"Erro ao buscar links do usuário {user['username']}: {e}")
            continue

    return all_links
```

#### 3.2. `get_user_links_from_gitlab(username)`

```python
async def get_user_links_from_gitlab(username: str) -> List[dict]:
    """Pega links de um usuário específico"""

    try:
        # Use sua função existente
        dashboard_data = await fetch_gitlab_wiki_dashboard(username)

        links = []
        for group in dashboard_data.get('groups', []):
            for link in group.get('links', []):
                links.append({
                    'id': f"{username}_{link['url']}",
                    'name': link.get('text', link['url']),
                    'url': link['url'],
                    'product': group.get('product'),
                    'environment': group.get('environment')
                })

        return links
    except Exception as e:
        print(f"Erro ao buscar links do usuário {username}: {e}")
        return []
```

#### 3.3. `get_link_url_by_id(link_id)`

```python
async def get_link_url_by_id(link_id: str) -> Optional[str]:
    """Retorna a URL de um link pelo ID"""

    # O ID está no formato: username_url
    try:
        parts = link_id.split('_', 1)
        if len(parts) == 2:
            return parts[1]  # Retorna a URL
    except Exception:
        pass

    return None
```

### 4. Adicionar Tracking de Clicks (Opcional)

Para rastrear clicks automaticamente, adicione isso no seu componente de dashboard:

#### Frontend - UserDashboard.jsx

```jsx
const trackLinkClick = async (linkName, linkUrl) => {
  try {
    await fetch(`${API_BASE_URL}/api/analytics/track`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        link_name: linkName,
        link_url: linkUrl
      })
    });
  } catch (err) {
    console.error('Failed to track click:', err);
  }
};

// No link-item, adicione onClick:
<a
  href={link.url}
  target="_blank"
  rel="noopener noreferrer"
  className="link-item"
  onClick={() => trackLinkClick(link.text, link.url)}
>
  {/* ... */}
</a>
```

### 5. Persistência de Dados (Recomendado)

Os dados de analytics estão em memória. Para produção, adicione um banco de dados:

#### Opção 1: SQLite (Simples)

```python
import sqlite3
from datetime import datetime

# Criar tabela
def init_analytics_db():
    conn = sqlite3.connect('analytics.db')
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS link_clicks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            link_name TEXT NOT NULL,
            link_url TEXT NOT NULL,
            timestamp DATETIME NOT NULL
        )
    ''')

    conn.commit()
    conn.close()

# Salvar click
def save_click(username, link_name, link_url):
    conn = sqlite3.connect('analytics.db')
    cursor = conn.cursor()

    cursor.execute('''
        INSERT INTO link_clicks (username, link_name, link_url, timestamp)
        VALUES (?, ?, ?, ?)
    ''', (username, link_name, link_url, datetime.now()))

    conn.commit()
    conn.close()
```

#### Opção 2: PostgreSQL (Produção)

```python
# Adicione ao seu modelo do SQLAlchemy:

class LinkClick(Base):
    __tablename__ = "link_clicks"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, index=True)
    link_name = Column(String)
    link_url = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)
```

### 6. Testar os Endpoints

```bash
# Com o backend rodando, teste:

# Analytics do admin
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/analytics?range=7d

# Status de links
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/status/links

# Ping de um link específico
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/status/ping/link_id_here
```

## 🔧 Configurações Adicionais

### Ajustar Timeout para Links Lentos

No `analytics_endpoints.py`, linha com `httpx.AsyncClient`:

```python
async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
    # Aumenta timeout para 30 segundos
```

### Background Task para Monitoramento Contínuo

Adicione ao `main.py`:

```python
from fastapi import BackgroundTasks
import asyncio

async def periodic_link_check():
    """Verifica status dos links periodicamente"""
    while True:
        try:
            links = await get_all_links_from_gitlab()
            for link in links:
                status = await check_link_status(link['url'])
                # Salvar status no banco de dados
                print(f"Link {link['url']}: {status['status']}")
        except Exception as e:
            print(f"Erro no check periódico: {e}")

        await asyncio.sleep(300)  # 5 minutos

# Iniciar ao startar o app
@app.on_event("startup")
async def startup_event():
    asyncio.create_task(periodic_link_check())
```

## 🐛 Troubleshooting

### Erro: "Module not found: analytics_endpoints"

Certifique-se de que `analytics_endpoints.py` está no mesmo diretório que `main.py`.

### Status check sempre retorna offline

1. Verifique firewall - ping pode estar bloqueado
2. Teste manualmente: `ping hostname` ou `telnet hostname port`
3. Alguns servidores bloqueiam ping (ICMP)

### Links sempre aparecem como offline

1. Verifique se as URLs estão corretas (devem incluir http:// ou https://)
2. Aumente o timeout
3. Verifique firewall/proxy

### Analytics não mostra dados

1. Certifique-se de implementar `trackLinkClick` no frontend
2. Verifique se os clicks estão sendo salvos (`link_clicks` array)
3. Implemente persistência em banco de dados

## 📊 Próximos Passos

1. ✅ Implementar funções auxiliares
2. ✅ Adicionar tracking de clicks
3. ✅ Testar endpoints
4. 🔄 Adicionar banco de dados (SQLite/PostgreSQL)
5. 🔄 Implementar export para PDF (usando reportlab)
6. 🔄 Adicionar alertas quando links caem
7. 🔄 Dashboard público de status

## 💡 Dicas

- Use cache Redis para melhorar performance do status monitoring
- Implemente rate limiting para evitar sobrecarga
- Adicione logs para debugging
- Configure CORS corretamente para permitir requisições do frontend
