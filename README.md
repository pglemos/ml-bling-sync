# ML Bling Sync - SaaS White-Label Dropshipping Platform

A comprehensive SaaS platform that unifies supplier catalogs (Shopify, Nuvem Shop, Bling/Wedrop), synchronizes inventory, and enables clients to publish products to multiple marketplaces with fee/margin simulation.

## 🚀 Project Status

✅ **Frontend**: Modern Next.js dashboard with TypeScript & Tailwind CSS  
✅ **Backend**: FastAPI Python backend with SQLAlchemy & Alembic  
✅ **Database**: PostgreSQL with Supabase integration  
✅ **Authentication**: Supabase Auth with multi-tenant support  
✅ **CI/CD**: Comprehensive GitHub Actions workflow  
🔄 **Connectors**: Supplier and marketplace integrations in development  
🔄 **Sync Engine**: Real-time inventory synchronization  
🔄 **Fee Calculator**: Marketplace fee and margin simulation  

## 🏗️ Project Architecture

```
ml-bling-sync/
├── src/                     # Frontend Next.js Application
│   ├── app/                 # App Router pages
│   ├── components/          # Reusable React components
│   │   ├── ui/             # Base UI components
│   │   └── layout/         # Layout components
│   ├── lib/                # Utilities and configurations
│   ├── hooks/              # Custom React hooks
│   ├── types/              # TypeScript type definitions
│   └── styles/             # Global styles
├── backend/                 # FastAPI Python Backend
│   ├── app/                # Application core
│   │   ├── models/         # SQLAlchemy models
│   │   ├── api/            # API routes
│   │   ├── core/           # Core configurations
│   │   └── services/       # Business logic
│   ├── alembic/            # Database migrations
│   └── tests/              # Backend tests
├── shared/                  # Shared types and utilities
│   ├── types/              # Common TypeScript types
│   └── constants/          # Shared constants
├── infra/                   # Infrastructure configurations
│   ├── docker/             # Docker configurations
│   ├── ci/                 # CI/CD scripts
│   └── db/                 # Database scripts
├── tests/                   # Frontend tests
│   ├── integration/        # Integration tests
│   └── __mocks__/          # Test mocks
└── docs/                    # Documentation
```

## 🚀 Local Development Setup

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+
- PostgreSQL 15+ (or use Supabase)
- Git

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/pglemos/ml-bling-sync.git
cd ml-bling-sync

# 2. Setup environment variables
cp .env.example .env.local
# Edit .env.local with your actual values

# 3. Install dependencies and setup
npm run setup:dev

# 4. Start development servers
npm run full:dev
```

### Manual Setup

#### Frontend Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev
# Access at http://localhost:3000
```

#### Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
# API available at http://localhost:8000
```

#### Database Setup
```bash
# Run migrations
npm run db:migrate

# Seed database with sample data
npm run db:seed
```

## 🔧 Available Scripts

```bash
# Development
npm run dev              # Start frontend development server
npm run backend:dev      # Start backend development server
npm run full:dev         # Start both frontend and backend

# Testing
npm test                 # Run unit tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage
npm run test:integration # Run integration tests

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run type-check       # Run TypeScript checks
npm run backend:lint     # Run Python linting (black, isort, flake8)

# Build & Deploy
npm run build            # Build for production
npm start                # Start production server
npm run analyze          # Analyze bundle size

# Database
npm run db:migrate       # Run database migrations
npm run db:seed          # Seed database with sample data

# Utilities
npm run clean            # Clean build artifacts
npm run setup:dev        # Quick development setup
```

## 🔧 Implemented Features

### Core Platform
- ✅ Modern responsive dashboard with Next.js 15 & TypeScript
- ✅ Multi-tenant architecture with Supabase Auth
- ✅ Real-time notifications and loading states
- ✅ Comprehensive CI/CD pipeline with GitHub Actions
- ✅ Database models for SPU/SKU/Channel mapping
- ✅ Theme switcher (light/dark mode)
- ✅ Accessibility features (ARIA labels, keyboard navigation)

### Development Experience
- ✅ Hot reload for both frontend and backend
- ✅ Comprehensive test setup (unit, integration)
- ✅ Code quality tools (ESLint, TypeScript, Python linting)
- ✅ Bundle size monitoring and performance tracking
- ✅ Security scanning and dependency checks

## 🚧 In Development

### Supplier Connectors
- 🔄 Shopify integration
- 🔄 Nuvem Shop connector
- 🔄 Bling/Wedrop API integration

### Marketplace Connectors
- 🔄 Mercado Livre integration
- 🔄 Amazon Seller Central
- 🔄 Shopee integration

### Core Features
- 🔄 Real-time inventory synchronization
- 🔄 Fee and margin calculation engine
- 🔄 Automated product publishing
- 🔄 Advanced analytics and reporting
- 🔄 Webhook management system

## 🌐 Deployment

The project is configured for automatic deployment:
- **Frontend**: Vercel (https://ml-bling-sync.vercel.app)
- **Backend**: Railway/Render (FastAPI)
- **Database**: Supabase PostgreSQL
- **CI/CD**: GitHub Actions

### Environment Variables
Ensure these are set in your deployment environment:
```bash
# Required for production
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
DATABASE_URL=your_production_database_url
JWT_SECRET=your_production_jwt_secret
API_SECRET_KEY=your_production_api_secret
```

## 📝 Development Roadmap

### Phase 1: Foundation (Current)
- [x] Project setup and CI/CD
- [x] Design tokens and theme system
- [ ] Database models and migrations
- [ ] Authentication and authorization

### Phase 2: Core Features
- [ ] Supplier connector framework
- [ ] Marketplace connector framework
- [ ] Product synchronization engine
- [ ] Fee calculation system

### Phase 3: Advanced Features
- [ ] Real-time inventory tracking
- [ ] Advanced analytics dashboard
- [ ] Webhook management
- [ ] Multi-tenant white-labeling

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/task-xx-description`)
3. **Follow** the coding standards:
   - Frontend: TypeScript + Tailwind (no inline styles)
   - Backend: FastAPI + SQLAlchemy + Alembic
   - Tests: Jest (frontend) + Pytest (backend)
4. **Commit** your changes (`git commit -m 'feat: add amazing feature'`)
5. **Push** to the branch (`git push origin feature/task-xx-description`)
6. **Open** a Pull Request with:
   - Clear description of changes
   - Test plan and screenshots (if UI changes)
   - Ensure CI checks pass

### Code Standards
- **Frontend**: Use TypeScript, follow ESLint rules, add tests
- **Backend**: Use type hints, follow Black/isort formatting, add tests
- **Accessibility**: Include ARIA labels and keyboard navigation
- **Security**: Never commit secrets, use environment variables

## 📊 Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **State Management**: React Context/Zustand
- **Testing**: Jest + React Testing Library

### Backend
- **Framework**: FastAPI
- **Language**: Python 3.11+
- **Database**: PostgreSQL + SQLAlchemy
- **Migrations**: Alembic
- **Authentication**: Supabase Auth
- **Testing**: Pytest

### Infrastructure
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth
- **Deployment**: Vercel (Frontend) + Railway (Backend)
- **CI/CD**: GitHub Actions
- **Monitoring**: Built-in metrics and logging

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for details.

---

**Built with ❤️ for the dropshipping community**
