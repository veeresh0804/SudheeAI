# SudheeAI - AI-Powered Dual-Portal Recruitment Platform

SudheeAI is a production-hardened AI intelligence platform designed to revolutionize the recruitment process through deep skill verification and predictive analytics.

## 🚀 Core Features

- **AI-Powered Scoring**: Multi-dimensional candidate evaluation using Gemini AI.
- **Deep Skill Verification**: Automatic scraping and analysis of LeetCode, GitHub, and LinkedIn profiles.
- **Coding DNA Analysis**: Heuristic analysis of project architecture, abstraction levels, and code maturity.
- **Fraud Detection Engine**: Advanced pattern recognition to identify suspicious activity and anomalies.
- **Growth Velocity Tracking**: Monitors skill acquisition rates and identifies high-potential talent.
- **Talent Trajectory Prediction**: Forecasts career growth and future role readiness.
- **AI Rejection Portal**: Provides constructive, automated feedback and personalized learning roadmaps for applicants.

## 🛠️ Technology Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui.
- **Backend**: FastAPI (Python), Uvicorn, SlowAPI (Rate Limiting).
- **AI/LLM**: Google Gemini AI (Pro 1.5).
- **Database**: Supabase (PostgreSQL) with Row Level Security (RLS).
- **Scraping**: Asynchronous platform scrapers with multi-level caching.

## 📦 Getting Started

### Backend Setup
1. Navigate to the `backend` directory.
2. Install dependencies: `pip install -r requirements.txt`.
3. Configure your `.env` file with `GEMINI_API_KEY`, `SUPABASE_URL`, and `SUPABASE_KEY`.
4. Run the server: `python -m uvicorn main:app --reload`.

### Frontend Setup
1. Install dependencies: `npm install`.
2. Configure your `.env` file with Supabase credentials.
3. Start the development server: `npm run dev`.

## 📜 Database Migrations
Database schema updates are located in the `supabase/migrations` directory. Ensure all migrations are applied to your Supabase instance.

---
© 2026 SudheeAI. All rights reserved.
