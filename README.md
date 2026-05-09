# AgentBase — AI Business Agent Platform

> Plug & play AI agents that qualify leads, book appointments, and score prospects automatically.

![Status](https://img.shields.io/badge/Status-Live-brightgreen) ![React](https://img.shields.io/badge/React-18-blue) ![FastAPI](https://img.shields.io/badge/FastAPI-Python-green) ![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-orange)

🔗 Live Demo: https://agentbase-cyan.vercel.app/

## What It Does

AgentBase is a configurable AI agent platform. Each agent handles inbound inquiries 24/7, qualifies leads, books appointments, and scores prospects — all autonomously.

**Live demos:**
- 🚗 AutoPrime Motors (car dealership)
- 🏡 Prestige Properties (real estate)
- 🏥 CarePoint Clinic (medical clinic)
- ✂️ Sharp Cuts (barbershop)
- ⚖️ Apex Legal Associates (law firm)
## Features
- Multi-turn AI conversations with context memory
- Automatic lead qualification (budget, timeline, requirements)
- HOT / WARM / COLD lead scoring
- Appointment booking detection
- Real-time lead dashboard
- Filter by business, score, or status
- Full conversation history per lead

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Backend | Python + FastAPI |
| AI | OpenAI GPT-4o-mini |
| Deploy | Vercel + Render |

## Local Development

### Backend
```bash
cd backend
pip install -r requirements.txt
export OPENAI_API_KEY=your_key
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
echo "VITE_BACKEND_URL=http://localhost:8000" > .env
npm run dev
```

## Built By
**Omer Yousif** — Software Engineering & AI Student
- GitHub: [@omerf9](https://github.com/omerf9)
