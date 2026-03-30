# Aviation

Aviation Website MVP — monorepo with React frontend and Node/Express backend.

## Structure

```
Aviation/
├── frontend/       React + Tailwind + Vite
├── backend/       Node + Express + Supabase
├── shared/        Shared TypeScript types & utilities
├── package.json   Monorepo root (npm workspaces)
├── tsconfig.json  Project references
└── .gitignore
```

## Tech Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS, Vite
- **Backend:** Node.js, Express, Supabase
- **Shared:** TypeScript types/utils
- **Package Manager:** npm (workspaces)

## Getting Started

```bash
# Install all dependencies
npm install

# Run both frontend and backend
npm run dev
```

Frontend: http://localhost:3000
Backend:  http://localhost:3001

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Run frontend + backend concurrently |
| `npm run dev:frontend` | Frontend only |
| `npm run dev:backend` | Backend only |
| `npm run build` | Build all workspaces |
| `npm run lint` | Lint all workspaces |
