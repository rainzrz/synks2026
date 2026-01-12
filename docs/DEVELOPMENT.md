# 🔧 Development Guide

[![Development](https://img.shields.io/badge/Development-Active-brightgreen?style=for-the-badge)](https://github.com/username/synks)
[![Contributors](https://img.shields.io/github/contributors/username/synks?style=for-the-badge)](https://github.com/username/synks/graphs/contributors)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen?style=for-the-badge)](https://github.com/username/synks/pulls)

---

## 📋 Table of Contents

- [Getting Started](#-getting-started)
- [Development Environment](#-development-environment)
- [Project Structure](#-project-structure)
- [Coding Standards](#-coding-standards)
- [Git Workflow](#-git-workflow)
- [Testing](#-testing)
- [Debugging](#-debugging)
- [Performance Optimization](#-performance-optimization)
- [Common Tasks](#-common-tasks)

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:

| Tool | Version | Purpose |
|------|---------|---------|
| **Python** | 3.11+ | Backend development |
| **Node.js** | 18+ | Frontend development |
| **npm** | 9+ | Package management |
| **Docker** | 24+ | Containerization |
| **Git** | 2.30+ | Version control |
| **Make** | 4.0+ | Build automation (optional) |
| **VS Code** | Latest | Recommended IDE |

### Initial Setup

```bash
# 1. Clone the repository
git clone https://github.com/username/synks.git
cd synks

# 2. Install dependencies
make install-all
# or manually:
cd backend && pip install -r requirements.txt
cd ../frontend && npm install

# 3. Setup environment
cp .env.example .env
# Edit .env with your local configuration

# 4. Start development servers
make dev
# or manually:
cd backend && uvicorn main:app --reload
cd frontend && npm run dev
```

### First-Time Configuration

```bash
# Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
pip install -r requirements-dev.txt  # Development dependencies

# Database setup (if not using Docker)
createdb synks_dev
alembic upgrade head

# Frontend setup
cd frontend
npm install
npm run prepare  # Setup Git hooks
```

---

## 💻 Development Environment

### Recommended IDE: VS Code

#### Essential Extensions

```json
// .vscode/extensions.json
{
  "recommendations": [
    // Python
    "ms-python.python",
    "ms-python.vscode-pylance",
    "ms-python.black-formatter",
    "ms-python.flake8",

    // JavaScript/TypeScript
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",

    // Docker
    "ms-azuretools.vscode-docker",

    // Git
    "eamodio.gitlens",
    "mhutchie.git-graph",

    // Utilities
    "streetsidesoftware.code-spell-checker",
    "usernamehw.errorlens",
    "christian-kohler.path-intellisense"
  ]
}
```

#### Workspace Settings

```json
// .vscode/settings.json
{
  // Python
  "python.defaultInterpreterPath": "${workspaceFolder}/backend/venv/bin/python",
  "python.formatting.provider": "black",
  "python.linting.enabled": true,
  "python.linting.flake8Enabled": true,
  "python.testing.pytestEnabled": true,

  // JavaScript/TypeScript
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },

  // Files
  "files.exclude": {
    "**/__pycache__": true,
    "**/.pytest_cache": true,
    "**/node_modules": true,
    "**/.next": true,
    "**/dist": true
  },

  // Editor
  "editor.rulers": [88, 120],
  "editor.tabSize": 2,
  "files.trimTrailingWhitespace": true,
  "files.insertFinalNewline": true
}
```

### Development Containers

#### Backend Development

```bash
# Start backend with hot reload
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Alternative: Use make
make dev-backend

# Access API documentation
# http://localhost:8000/docs (Swagger UI)
# http://localhost:8000/redoc (ReDoc)
```

#### Frontend Development

```bash
# Start frontend with hot reload
cd frontend
npm run dev

# Alternative: Use make
make dev-frontend

# Access application
# http://localhost:5173 (Vite dev server)
```

#### Full Stack Development

```bash
# Start all services with Docker Compose
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Or use make
make dev-up

# View logs
make dev-logs
```

---

## 📁 Project Structure

### Backend Structure

```
backend/
├── main.py                    # Application entry point
├── config.py                  # Configuration management
├── requirements.txt           # Production dependencies
├── requirements-dev.txt       # Development dependencies
│
├── api/                       # API layer
│   ├── routers/               # API endpoints
│   │   ├── auth.py            # Authentication endpoints
│   │   ├── users.py           # User management
│   │   ├── categories.py      # Category management
│   │   └── dashboard.py       # Dashboard endpoints
│   ├── dependencies.py        # Dependency injection
│   └── middleware/            # Custom middleware
│
├── application/               # Business logic
│   ├── use_cases/             # Use case implementations
│   └── services/              # Application services
│
├── domain/                    # Domain layer
│   ├── entities/              # Business entities
│   ├── value_objects/         # Value objects
│   └── repositories/          # Repository interfaces
│
├── infrastructure/            # Infrastructure
│   ├── database/              # Database
│   │   ├── models.py          # SQLAlchemy models
│   │   ├── session.py         # Database session
│   │   └── migrations/        # Alembic migrations
│   ├── cache/                 # Redis cache
│   └── repositories/          # Repository implementations
│
├── schemas/                   # Pydantic schemas
│   ├── auth.py                # Auth DTOs
│   ├── user.py                # User DTOs
│   └── category.py            # Category DTOs
│
└── tests/                     # Tests
    ├── unit/                  # Unit tests
    ├── integration/           # Integration tests
    └── conftest.py            # Pytest fixtures
```

### Frontend Structure

```
frontend/
├── public/                    # Static files
├── src/
│   ├── App.tsx                # Root component
│   ├── main.tsx               # Entry point
│   │
│   ├── pages/                 # Page components
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   └── RegisterPage.tsx
│   │   ├── dashboard/
│   │   └── categories/
│   │
│   ├── components/            # Reusable components
│   │   ├── common/            # Generic UI components
│   │   │   ├── Button/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Button.test.tsx
│   │   │   │   └── Button.stories.tsx
│   │   │   ├── Input/
│   │   │   └── Card/
│   │   ├── layout/            # Layout components
│   │   └── features/          # Feature-specific
│   │
│   ├── store/                 # Redux state
│   │   ├── index.ts           # Store config
│   │   └── slices/            # Redux slices
│   │       ├── authSlice.ts
│   │       └── userSlice.ts
│   │
│   ├── hooks/                 # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useApi.ts
│   │   └── useDebounce.ts
│   │
│   ├── services/              # API services
│   │   ├── api.ts             # Axios config
│   │   ├── authService.ts
│   │   └── userService.ts
│   │
│   ├── utils/                 # Utilities
│   │   ├── validators.ts
│   │   ├── formatters.ts
│   │   └── constants.ts
│   │
│   ├── types/                 # TypeScript types
│   │   ├── auth.types.ts
│   │   └── user.types.ts
│   │
│   └── styles/                # Styles
│       ├── index.css
│       └── tailwind.css
│
├── package.json               # Dependencies
├── tsconfig.json              # TypeScript config
├── vite.config.ts             # Vite config
└── tailwind.config.js         # Tailwind config
```

---

## 📏 Coding Standards

### Python Style Guide

#### Follow PEP 8 + Black

```python
# Good: Clear, concise, type-annotated
async def get_user_by_email(
    email: str,
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    """
    Retrieve a user by email address.

    Args:
        email: User's email address
        db: Database session

    Returns:
        User object if found, None otherwise
    """
    result = await db.execute(
        select(User).where(User.email == email)
    )
    return result.scalar_one_or_none()


# Bad: No type hints, poor naming, no docstring
async def get_user(e, d):
    r = await d.execute(select(User).where(User.email == e))
    return r.scalar_one_or_none()
```

#### Code Organization

```python
# Standard library imports
import asyncio
import logging
from datetime import datetime
from typing import Optional, List

# Third-party imports
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, EmailStr

# Local imports
from api.dependencies import get_db, get_current_user
from domain.entities.user import User
from schemas.user import UserResponse


# Constants at module level
DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100

# Configure logging
logger = logging.getLogger(__name__)
```

#### Error Handling

```python
# Good: Specific exceptions, informative messages
async def delete_user(user_id: str, db: AsyncSession) -> None:
    """Delete a user by ID."""
    try:
        user = await get_user_by_id(user_id, db)
        if not user:
            raise HTTPException(
                status_code=404,
                detail=f"User with id {user_id} not found"
            )

        await db.delete(user)
        await db.commit()

    except SQLAlchemyError as e:
        await db.rollback()
        logger.error(f"Database error deleting user {user_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to delete user"
        )


# Bad: Generic exception, no logging
async def delete_user(user_id, db):
    user = await get_user_by_id(user_id, db)
    await db.delete(user)
    await db.commit()
```

### TypeScript/React Style Guide

#### Component Structure

```typescript
// Good: Properly typed, documented, organized
import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store'
import { fetchUsers } from '@/store/slices/userSlice'
import { Button } from '@/components/common/Button'

interface UserListProps {
  /** Maximum number of users to display */
  limit?: number
  /** Callback when user is selected */
  onUserSelect?: (userId: string) => void
}

/**
 * Displays a list of users with pagination and search.
 *
 * @example
 * ```tsx
 * <UserList limit={10} onUserSelect={(id) => console.log(id)} />
 * ```
 */
export const UserList: React.FC<UserListProps> = ({
  limit = 20,
  onUserSelect
}) => {
  const dispatch = useDispatch()
  const { users, loading, error } = useSelector(
    (state: RootState) => state.users
  )

  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    dispatch(fetchUsers({ limit, search: searchTerm }))
  }, [dispatch, limit, searchTerm])

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div className="user-list">
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search users..."
        className="search-input"
      />

      <ul className="user-list__items">
        {users.map(user => (
          <li key={user.id} onClick={() => onUserSelect?.(user.id)}>
            {user.name}
          </li>
        ))}
      </ul>
    </div>
  )
}


// Bad: No types, poor structure, unclear
export const UserList = ({ limit, onUserSelect }) => {
  const dispatch = useDispatch()
  const users = useSelector(state => state.users.users)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    dispatch(fetchUsers({ limit, search: searchTerm }))
  }, [searchTerm])

  return (
    <div>
      <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      <ul>
        {users.map(u => <li onClick={() => onUserSelect(u.id)}>{u.name}</li>)}
      </ul>
    </div>
  )
}
```

#### Hooks and State Management

```typescript
// Good: Custom hook with clear interface
import { useState, useCallback } from 'react'

interface UseApiOptions<T> {
  initialData?: T
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
}

interface UseApiReturn<T> {
  data: T | null
  loading: boolean
  error: Error | null
  execute: (...args: any[]) => Promise<void>
}

/**
 * Custom hook for API calls with loading and error states.
 */
export function useApi<T>(
  apiCall: (...args: any[]) => Promise<T>,
  options: UseApiOptions<T> = {}
): UseApiReturn<T> {
  const [data, setData] = useState<T | null>(options.initialData ?? null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const execute = useCallback(async (...args: any[]) => {
    try {
      setLoading(true)
      setError(null)
      const result = await apiCall(...args)
      setData(result)
      options.onSuccess?.(result)
    } catch (err) {
      const error = err as Error
      setError(error)
      options.onError?.(error)
    } finally {
      setLoading(false)
    }
  }, [apiCall, options])

  return { data, loading, error, execute }
}

// Usage
const { data, loading, error, execute } = useApi(fetchUsers, {
  onSuccess: (users) => console.log(`Loaded ${users.length} users`),
  onError: (error) => showErrorToast(error.message)
})
```

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

#### Types

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat(auth): add OAuth2 login` |
| `fix` | Bug fix | `fix(dashboard): resolve chart rendering` |
| `docs` | Documentation | `docs(api): update endpoint descriptions` |
| `style` | Code style (formatting) | `style(backend): apply black formatting` |
| `refactor` | Code refactoring | `refactor(api): simplify error handling` |
| `perf` | Performance improvement | `perf(db): add index to users table` |
| `test` | Add/update tests | `test(auth): add login unit tests` |
| `chore` | Maintenance tasks | `chore(deps): update dependencies` |
| `ci` | CI/CD changes | `ci(actions): add security scan` |

#### Examples

```bash
# Simple commit
git commit -m "feat(auth): add password reset functionality"

# Commit with body
git commit -m "fix(dashboard): resolve data loading issue

The dashboard was not loading user data correctly due to
an incorrect API endpoint. This commit fixes the endpoint
and adds error handling.

Closes #123"

# Breaking change
git commit -m "feat(api)!: change authentication to use OAuth2

BREAKING CHANGE: The /auth/login endpoint now requires OAuth2
credentials instead of username/password. Update your clients
accordingly.

See migration guide: docs/migration-v2.md"
```

Use the interactive commit helper:

```bash
make commit
# or: npm run commit
```

---

## 🌿 Git Workflow

### Branch Strategy

```
main (production)
  ↓
develop (staging)
  ↓
feature/*, fix/*, refactor/* (development)
```

#### Branch Naming

| Prefix | Purpose | Example |
|--------|---------|---------|
| `feat/` | New feature | `feat/user-authentication` |
| `fix/` | Bug fix | `fix/login-redirect-loop` |
| `refactor/` | Code refactoring | `refactor/api-error-handling` |
| `docs/` | Documentation | `docs/api-endpoints` |
| `test/` | Tests | `test/auth-integration` |
| `chore/` | Maintenance | `chore/update-dependencies` |

### Development Workflow

```bash
# 1. Create feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feat/my-new-feature

# 2. Make changes and commit
git add .
make commit  # Interactive commit
# or: git commit -m "feat(scope): description"

# 3. Keep branch updated
git fetch origin
git rebase origin/develop

# 4. Push to remote
git push origin feat/my-new-feature

# 5. Create Pull Request on GitHub
# - Target: develop
# - Fill PR template
# - Request reviews

# 6. After approval, squash and merge
# PR will be automatically merged by GitHub Actions
```

### Pull Request Guidelines

#### PR Title Format

```
<type>(<scope>): <description>

Examples:
feat(auth): add two-factor authentication
fix(dashboard): resolve chart rendering issue
docs(api): update authentication documentation
```

#### PR Description Template

```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] 🐛 Bug fix
- [ ] ✨ New feature
- [ ] 💥 Breaking change
- [ ] 📚 Documentation
- [ ] 🔧 Refactoring

## Related Issues
Closes #123

## Changes Made
- Change 1
- Change 2
- Change 3

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed
- [ ] All tests passing

## Screenshots
(if applicable)

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added to complex code
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests added and passing
```

---

## 🧪 Testing

### Backend Testing

#### Unit Tests

```python
# tests/unit/test_user_service.py
import pytest
from unittest.mock import Mock, AsyncMock
from application.services.user_service import UserService
from domain.entities.user import User

@pytest.fixture
def user_service():
    """Create user service with mocked dependencies."""
    mock_repo = Mock()
    mock_cache = Mock()
    return UserService(repository=mock_repo, cache=mock_cache)


@pytest.mark.asyncio
async def test_get_user_by_id_success(user_service):
    """Test successful user retrieval."""
    # Arrange
    user_id = "123"
    expected_user = User(id=user_id, email="test@example.com")
    user_service.repository.get_by_id = AsyncMock(return_value=expected_user)

    # Act
    result = await user_service.get_user_by_id(user_id)

    # Assert
    assert result == expected_user
    user_service.repository.get_by_id.assert_called_once_with(user_id)


@pytest.mark.asyncio
async def test_get_user_by_id_not_found(user_service):
    """Test user not found scenario."""
    # Arrange
    user_id = "nonexistent"
    user_service.repository.get_by_id = AsyncMock(return_value=None)

    # Act & Assert
    with pytest.raises(UserNotFoundError):
        await user_service.get_user_by_id(user_id)
```

#### Integration Tests

```python
# tests/integration/test_auth_api.py
import pytest
from httpx import AsyncClient
from main import app

@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    """Test successful login flow."""
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "test@example.com",
            "password": "secure_password123"
        }
    )

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_invalid_credentials(client: AsyncClient):
    """Test login with invalid credentials."""
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "test@example.com",
            "password": "wrong_password"
        }
    )

    assert response.status_code == 401
    assert "Invalid credentials" in response.json()["detail"]
```

#### Run Backend Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=. --cov-report=html

# Run specific test file
pytest tests/unit/test_user_service.py

# Run tests matching pattern
pytest -k "test_login"

# Run with verbose output
pytest -v

# Use make commands
make test-backend          # Run all tests
make test-backend-unit     # Unit tests only
make test-backend-integration  # Integration tests only
make coverage-backend      # Generate coverage report
```

### Frontend Testing

#### Component Tests

```typescript
// components/common/Button/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  it('renders with children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)

    fireEvent.click(screen.getByText('Click me'))

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled when loading', () => {
    render(<Button loading>Click me</Button>)
    const button = screen.getByRole('button')

    expect(button).toBeDisabled()
    expect(screen.getByTestId('spinner')).toBeInTheDocument()
  })

  it('applies correct variant classes', () => {
    render(<Button variant="danger">Delete</Button>)
    const button = screen.getByRole('button')

    expect(button).toHaveClass('button--danger')
  })
})
```

#### Hook Tests

```typescript
// hooks/useAuth.test.ts
import { renderHook, act } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { useAuth } from './useAuth'
import authReducer from '@/store/slices/authSlice'

const createMockStore = () => {
  return configureStore({
    reducer: { auth: authReducer }
  })
}

describe('useAuth', () => {
  it('returns authenticated state', () => {
    const store = createMockStore()
    const wrapper = ({ children }) => (
      <Provider store={store}>{children}</Provider>
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
  })

  it('updates state after login', async () => {
    const store = createMockStore()
    const wrapper = ({ children }) => (
      <Provider store={store}>{children}</Provider>
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.login({
        email: 'test@example.com',
        password: 'password123'
      })
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user).toBeDefined()
  })
})
```

#### Run Frontend Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run specific test file
npm test -- Button.test.tsx

# Use make commands
make test-frontend         # Run all tests
make test-frontend-watch   # Watch mode
make coverage-frontend     # Generate coverage report
```

---

## 🐛 Debugging

### Backend Debugging

#### VS Code Debug Configuration

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Python: FastAPI",
      "type": "python",
      "request": "launch",
      "module": "uvicorn",
      "args": [
        "main:app",
        "--reload",
        "--host",
        "0.0.0.0",
        "--port",
        "8000"
      ],
      "jinja": true,
      "justMyCode": true,
      "cwd": "${workspaceFolder}/backend"
    }
  ]
}
```

#### Logging

```python
import logging

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

# Usage
logger.debug("Detailed debugging information")
logger.info("General information")
logger.warning("Warning message")
logger.error("Error occurred", exc_info=True)
logger.critical("Critical error")
```

### Frontend Debugging

#### Browser DevTools

```typescript
// Add debugging statements
console.log('User data:', user)
console.table(users)  // Display array as table
console.group('API Call')
console.log('Request:', request)
console.log('Response:', response)
console.groupEnd()

// Debugger statement
if (someCondition) {
  debugger  // Pauses execution
}
```

#### React Developer Tools

- Install React DevTools extension
- Inspect component hierarchy
- View props and state
- Profile performance

#### Redux DevTools

- Install Redux DevTools extension
- Time-travel debugging
- View action history
- Inspect state changes

---

## ⚡ Performance Optimization

### Backend Optimization

#### Database Query Optimization

```python
# Bad: N+1 query problem
users = await db.execute(select(User))
for user in users:
    categories = await db.execute(
        select(Category).where(Category.user_id == user.id)
    )

# Good: Use eager loading
users = await db.execute(
    select(User).options(selectinload(User.categories))
)
```

#### Caching Strategy

```python
from functools import lru_cache
import redis

# In-memory cache (for pure functions)
@lru_cache(maxsize=128)
def calculate_expensive_operation(n: int) -> int:
    return sum(range(n))

# Redis cache (for database queries)
async def get_user_cached(user_id: str, cache: Redis, db: Session):
    # Try cache first
    cached = await cache.get(f"user:{user_id}")
    if cached:
        return json.loads(cached)

    # Query database
    user = await db.get(User, user_id)

    # Cache result
    await cache.setex(
        f"user:{user_id}",
        3600,  # 1 hour TTL
        json.dumps(user.dict())
    )

    return user
```

### Frontend Optimization

#### Component Optimization

```typescript
import React, { memo, useMemo, useCallback } from 'react'

// Memoize expensive component
const UserList = memo(({ users, onSelect }) => {
  return (
    <ul>
      {users.map(user => (
        <li key={user.id} onClick={() => onSelect(user)}>
          {user.name}
        </li>
      ))}
    </ul>
  )
})

// Memoize expensive calculations
function ExpensiveComponent({ data }) {
  const processedData = useMemo(() => {
    return data.map(/* expensive operation */)
  }, [data])

  const handleClick = useCallback(() => {
    console.log('Clicked')
  }, [])

  return <div>{/* render */}</div>
}
```

#### Code Splitting

```typescript
// Lazy load routes
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Profile = lazy(() => import('./pages/Profile'))

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Suspense>
  )
}
```

---

## 📝 Common Tasks

### Add a New API Endpoint

```python
# 1. Create schema (schemas/my_entity.py)
from pydantic import BaseModel

class MyEntityCreate(BaseModel):
    name: str
    description: str

class MyEntityResponse(BaseModel):
    id: str
    name: str
    description: str

# 2. Create model (infrastructure/database/models.py)
class MyEntity(Base):
    __tablename__ = "my_entities"

    id = Column(UUID(as_uuid=True), primary_key=True)
    name = Column(String, nullable=False)
    description = Column(Text)

# 3. Create repository (infrastructure/repositories/my_entity_repo.py)
class MyEntityRepository:
    async def create(self, entity: MyEntityCreate) -> MyEntity:
        # Implementation
        pass

# 4. Create router (api/routers/my_entity.py)
from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/entities", tags=["entities"])

@router.post("/", response_model=MyEntityResponse)
async def create_entity(entity: MyEntityCreate):
    # Implementation
    pass

# 5. Register router (main.py)
from api.routers import my_entity

app.include_router(my_entity.router)
```

### Add a New React Component

```bash
# Create component directory
mkdir -p frontend/src/components/features/MyFeature

# Create component files
cd frontend/src/components/features/MyFeature
touch MyFeature.tsx MyFeature.test.tsx MyFeature.stories.tsx
```

```typescript
// MyFeature.tsx
import React from 'react'

interface MyFeatureProps {
  title: string
}

export const MyFeature: React.FC<MyFeatureProps> = ({ title }) => {
  return <div>{title}</div>
}

// MyFeature.test.tsx
import { render, screen } from '@testing-library/react'
import { MyFeature } from './MyFeature'

describe('MyFeature', () => {
  it('renders title', () => {
    render(<MyFeature title="Test" />)
    expect(screen.getByText('Test')).toBeInTheDocument()
  })
})
```

### Database Migration

```bash
# Create migration
cd backend
alembic revision --autogenerate -m "Add my_entities table"

# Review migration file
# Edit if needed: backend/infrastructure/database/migrations/versions/xxx_add_my_entities_table.py

# Apply migration
alembic upgrade head

# Rollback migration
alembic downgrade -1
```

---

<div align="center">

**Happy coding! For questions, open an issue or reach out to the team.**

[📚 Back to Documentation](../README.md#-documentation)

</div>
