# Deployment Guide

## Pre-deployment Checklist

### Backend Setup
1. Install Python dependencies: `pip install -r backend/requirements.txt`
2. Copy `backend/.env.example` to `backend/.env` and configure
3. Run migrations: `python backend/manage.py migrate`
4. Create superuser: `python backend/manage.py createsuperuser`
5. Start backend: `python backend/manage.py runserver`

### Frontend Setup
1. Install Node.js dependencies: `cd frontend && npm install`
2. Start frontend: `npm run dev`

### Production Deployment
- Backend: Use gunicorn or similar WSGI server
- Frontend: Build with `npm run build` and serve static files
- Database: Use PostgreSQL or MySQL instead of SQLite
- Environment: Set DEBUG=False in production

## Files Excluded from Repository
- Virtual environments (venv/)
- Database files (db.sqlite3)
- Environment files (.env)
- Node modules (node_modules/)
- Build artifacts (dist/)
- Development scripts and test files