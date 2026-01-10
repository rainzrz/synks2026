# Synks - Nova UI

Criei uma Landing Page SaaS moderna e uma Admin Table estilo cyberpunk/tech baseada nas imagens de referência do Momentum e user.ctrl.

## Arquivos Criados

### Landing Page
- `frontend/src/LandingPage.jsx` - Componente da landing page
- `frontend/src/LandingPage.css` - Estilos da landing page

### Admin Table
- `frontend/src/AdminTable.jsx` - Componente da tabela de administração
- `frontend/src/AdminTable.css` - Estilos da tabela

### Integração
- `frontend/src/AppWithNewUI.jsx` - App integrado com a nova AdminTable
- `frontend/src/index_new.jsx` - Entry point que mostra Landing Page ou App

## Como Usar

### Opção 1: Substituir o App.jsx atual

1. Faça backup do App.jsx atual:
```bash
cd frontend/src
cp App.jsx App.jsx.backup
```

2. Substitua pelo novo:
```bash
cp AppWithNewUI.jsx App.jsx
```

3. Adicione os imports no App.jsx:
```javascript
import AdminTable from './AdminTable';
import './AdminTable.css';
```

### Opção 2: Usar a Landing Page como página inicial

1. Substitua o `index.jsx` ou `main.jsx`:
```bash
cd frontend/src
cp main.jsx main.jsx.backup
cp index_new.jsx main.jsx
```

2. Isso fará com que:
   - Usuários sem token vejam a Landing Page
   - Ao clicar em "Sign In", vão para a tela de login
   - Após login, veem o dashboard normal

## Características da Nova UI

### Landing Page
- Design moderno inspirado no Momentum
- Gradientes animados em cyan/pink/orange
- Seções:
  - Hero com título grande e call-to-action
  - Features grid com 6 recursos
  - Pricing com 3 planos
  - Footer completo
- Totalmente responsiva
- Efeitos de hover suaves
- Tema dark com fundo #0a0a0f

### Admin Table
- Design cyberpunk/tech inspirado no user.ctrl
- Fonte monospace para estética técnica
- Cards de estatísticas com animação de scan
- Tabela com:
  - Avatares coloridos com gradientes
  - Badges para roles (Admin/User)
  - Status indicators
  - Action buttons com hover effects
- Filtros por role (ALL/ADMIN/USER)
- Search funcional
- Tema dark com acentos em cyan (#60efff)

## Paleta de Cores

### Landing Page
- Background: #0a0a0f (quase preto)
- Gradientes principais:
  - Cyan: #60efff
  - Blue: #0061ff
  - Pink: #ff2e8d
  - Orange: #ff9a56
  - Yellow: #ffd56b

### Admin Table
- Background: #0a0a0f
- Primary: #60efff (cyan tech)
- Success: #0cfc82 (green)
- Borders: rgba(255, 255, 255, 0.05-0.2)

## Personalização

### Mudar o nome "synks"
Procure por `.logo-text` nos arquivos CSS e `<span className="logo-text">synks</span>` nos JSX.

### Ajustar cores
Todas as cores estão centralizadas nos arquivos CSS. Basta buscar por:
- `#60efff` - Cyan principal
- `#0061ff` - Blue
- `#ff2e8d` - Pink
- `linear-gradient(135deg, ...)` - Para os gradientes

### Modificar estatísticas
No `AdminTable.jsx`, a função `useEffect` calcula as stats. Você pode adicionar lógica para:
- Contar usuários ativos (baseado em last_login)
- Contar novos usuários hoje
- Outras métricas

## Preview

### Landing Page
- Hero section com título gradiente "Wiki management without the chaos"
- 6 feature cards com ícones e gradientes
- 3 pricing tiers (Starter, Professional, Enterprise)
- Footer com links organizados

### Admin Table
- Header "USER.CTRL" com status online
- 4 stat cards (Total Users, Active, Admins, New Today)
- Search bar monospace
- Filtros por role
- Tabela com avatars gradientes
- Action buttons (view, delete, more)

## Responsividade

Ambos os componentes são totalmente responsivos:
- Desktop: Layout completo com grid
- Tablet: Grid adaptado
- Mobile: Layout em coluna única

## Próximos Passos

1. Testar a integração
2. Ajustar cores conforme preferência
3. Adicionar mais animações se desejar
4. Implementar dark/light mode toggle (opcional)
5. Adicionar mais funcionalidades na admin table (editar usuário inline, etc.)

## Tecnologias

- React 18
- CSS Modules (ou CSS puro)
- Gradientes CSS
- Flexbox e Grid
- Animations CSS
- SVG Icons
