# Lead Qualifier Frontend

This directory contains the React frontend component for the Lead Qualifier dashboard.

## Setup

### Option 1: Use with Create React App or Vite

1. Create a new React project:
   ```bash
   npx create-react-app lead-qualifier-frontend
   # or
   npm create vite@latest lead-qualifier-frontend -- --template react
   ```

2. Copy `LeadQualifierFrontend.jsx` to your `src` folder

3. Install Tailwind CSS (for styling):
   ```bash
   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   ```

4. Update `tailwind.config.js`:
   ```js
   content: [
     "./src/**/*.{js,jsx,ts,tsx}",
   ],
   ```

5. Add to `src/index.css`:
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```

6. Start the frontend:
   ```bash
   npm start
   # or for Vite
   npm run dev
   ```

### Option 2: Use with Next.js

1. Create a Next.js app:
   ```bash
   npx create-next-app@latest lead-qualifier-frontend
   ```

2. Copy the component to `pages/index.js` or `app/page.js`

3. Install Tailwind CSS (usually included in Next.js)

### Option 3: Standalone HTML (Simple Demo)

See `index.html` for a simple standalone version.

## Backend Setup

Make sure the FastAPI backend is running:

```bash
cd ../api
python main.py
```

Or with uvicorn:
```bash
uvicorn api.main:app --reload --port 8000
```

The frontend expects the API to be available at `http://localhost:8000`.

## Features

- **Quick Score**: Paste email text and get instant scoring
- **Recent Leads**: View all processed leads from Excel files
- **Super Leads**: Highlighted section for high-scoring leads (score > 80)
- **Download**: Download good/bad leads as Excel files
- **Real-time**: Refresh to see latest processed leads

## API Endpoints Required

- `POST /api/score` - Score a single email
- `GET /api/leads` - Get all leads
- `GET /api/download/good` - Download good_leads.xlsx
- `GET /api/download/bad` - Download bad_leads.xlsx

