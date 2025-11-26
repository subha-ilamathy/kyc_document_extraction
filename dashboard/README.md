# KYC Identity Verification Dashboard

React/TypeScript dashboard for the KYC Identity Verification system, built for Lovable.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set environment variables:
```bash
# Create .env file
VITE_API_BASE_URL=http://localhost:8000
```

3. Start development server:
```bash
npm run dev
```

The dashboard will be available at `http://localhost:3000`

## Building for Production

```bash
npm run build
```

## Features

- Document upload with drag & drop
- Real-time processing status
- Results display with extracted information
- Document history with search and filters
- Export functionality

## API Integration

The dashboard connects to the FastAPI backend at `http://localhost:8000` by default.

Make sure the backend API server is running before using the dashboard.

