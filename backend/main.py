from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
import uuid
import json
from datetime import datetime
from openai import OpenAI

app = FastAPI(title="AgentBase API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

# ── In-memory store ────────────────────────────────────────────────────────────
leads = {}        # lead_id -> lead data
conversations = {}  # session_id -> messages list

# ── Business configs ───────────────────────────────────────────────────────────
BUSINESS_CONFIGS = {
    "dealership": {
        "name": "AutoPrime Motors",
        "industry": "car dealership",
        "greeting": "Hey! Welcome to AutoPrime Motors 🚗 I'm your AI assistant. Looking to buy, sell, or just browsing?",
        "qualify_questions": ["budget", "vehicle_type", "timeline", "trade_in"],
        "appointment_type": "test drive",
        "system_prompt": """You are an AI sales assistant for AutoPrime Motors, a premium car dealership.

Your job is to:
1. Warmly greet visitors and understand what they're looking for
2. Qualify leads by naturally gathering: budget range, vehicle type/preference, buying timeline, trade-in situation
3. If they're serious (have budget + timeline within 3 months), offer to book a test drive
4. Be helpful, knowledgeable about cars, and never pushy
5. Keep responses SHORT — 2-3 sentences max unless explaining something complex

Lead scoring:
- HOT: Budget clear + timeline < 1 month + specific vehicle in mind
- WARM: Has budget + timeline 1-3 months
- COLD: Just browsing, no clear timeline

When you have enough info to score the lead, add this JSON at the END of your response (hidden from user):
[LEAD_DATA: {"name": "...", "email": "...", "phone": "...", "budget": "...", "vehicle": "...", "timeline": "...", "trade_in": "...", "score": "HOT/WARM/COLD", "appointment_requested": true/false}]

Only include fields you've collected. Ask for name/contact naturally when they show interest."""
    },
    "realestate": {
        "name": "Prestige Properties",
        "industry": "real estate agency",
        "greeting": "Welcome to Prestige Properties 🏡 I'm your AI property advisor. Are you looking to buy, rent, or sell?",
        "qualify_questions": ["budget", "property_type", "location", "timeline", "pre_approved"],
        "appointment_type": "property viewing",
        "system_prompt": """You are an AI property advisor for Prestige Properties, a premium real estate agency.

Your job is to:
1. Warmly greet visitors and understand their property needs
2. Qualify leads by naturally gathering: budget/price range, property type (house/condo/etc), preferred area/neighborhood, buying or renting, timeline, mortgage pre-approval status
3. If they're serious, offer to book a property viewing
4. Be helpful, knowledgeable about real estate, and professional
5. Keep responses SHORT — 2-3 sentences max unless explaining something

Lead scoring:
- HOT: Pre-approved + specific area + timeline < 1 month
- WARM: Has budget + timeline 1-3 months + general area in mind
- COLD: Early research stage, no clear requirements

When you have enough info, add this JSON at the END of your response:
[LEAD_DATA: {"name": "...", "email": "...", "phone": "...", "budget": "...", "property_type": "...", "location": "...", "timeline": "...", "buying_or_renting": "...", "pre_approved": "...", "score": "HOT/WARM/COLD", "appointment_requested": true/false}]

Only include fields you've collected. Ask for name/contact naturally when they show genuine interest."""
    }
}

# ── Helpers ────────────────────────────────────────────────────────────────────

def extract_lead_data(text: str) -> Optional[dict]:
    """Extract hidden lead data from AI response."""
    import re
    match = re.search(r'\[LEAD_DATA: ({.*?})\]', text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except:
            return None
    return None

def clean_response(text: str) -> str:
    """Remove hidden lead data from visible response."""
    import re
    return re.sub(r'\[LEAD_DATA:.*?\]', '', text, flags=re.DOTALL).strip()

# ── Routes ─────────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "AgentBase API running"}

@app.get("/businesses")
def get_businesses():
    return {k: {"name": v["name"], "industry": v["industry"], "greeting": v["greeting"]} 
            for k, v in BUSINESS_CONFIGS.items()}

class StartSession(BaseModel):
    business_id: str

@app.post("/session/start")
def start_session(req: StartSession):
    if req.business_id not in BUSINESS_CONFIGS:
        raise HTTPException(400, "Unknown business")
    session_id = str(uuid.uuid4())
    conversations[session_id] = []
    config = BUSINESS_CONFIGS[req.business_id]
    return {
        "session_id": session_id,
        "greeting": config["greeting"],
        "business_name": config["name"]
    }

class ChatMessage(BaseModel):
    session_id: str
    business_id: str
    message: str

@app.post("/chat")
async def chat(req: ChatMessage):
    if req.session_id not in conversations:
        raise HTTPException(404, "Session not found")
    if req.business_id not in BUSINESS_CONFIGS:
        raise HTTPException(400, "Unknown business")

    config = BUSINESS_CONFIGS[req.business_id]
    history = conversations[req.session_id]

    # Add user message
    history.append({"role": "user", "content": req.message})

    # Call OpenAI
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": config["system_prompt"]},
            *history
        ],
        temperature=0.7,
        max_tokens=400,
    )

    raw_response = response.choices[0].message.content

    # Extract lead data if present
    lead_data = extract_lead_data(raw_response)
    clean = clean_response(raw_response)

    # Add assistant response to history
    history.append({"role": "assistant", "content": clean})

    # Update or create lead
    lead_id = None
    lead_score = None
    appointment_requested = False

    if lead_data:
        # Find existing lead for this session or create new
        existing_lead_id = next((lid for lid, l in leads.items() if l.get("session_id") == req.session_id), None)

        if existing_lead_id:
            leads[existing_lead_id].update(lead_data)
            leads[existing_lead_id]["updated_at"] = datetime.now().isoformat()
            lead_id = existing_lead_id
        else:
            lead_id = str(uuid.uuid4())
            leads[lead_id] = {
                **lead_data,
                "lead_id": lead_id,
                "session_id": req.session_id,
                "business_id": req.business_id,
                "business_name": config["name"],
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
                "message_count": 0
            }

        leads[lead_id]["message_count"] = len([m for m in history if m["role"] == "user"])
        lead_score = lead_data.get("score")
        appointment_requested = lead_data.get("appointment_requested", False)

    return {
        "response": clean,
        "lead_id": lead_id,
        "lead_score": lead_score,
        "appointment_requested": appointment_requested
    }

@app.get("/leads")
def get_leads(business_id: Optional[str] = None):
    all_leads = list(leads.values())
    if business_id:
        all_leads = [l for l in all_leads if l.get("business_id") == business_id]
    # Sort by score then date
    score_order = {"HOT": 0, "WARM": 1, "COLD": 2}
    all_leads.sort(key=lambda x: (score_order.get(x.get("score", "COLD"), 2), x.get("created_at", "")))
    return all_leads

@app.get("/leads/{lead_id}/conversation")
def get_conversation(lead_id: str):
    lead = leads.get(lead_id)
    if not lead:
        raise HTTPException(404, "Lead not found")
    session_id = lead.get("session_id")
    messages = conversations.get(session_id, [])
    return {"lead": lead, "messages": messages}

@app.get("/stats")
def get_stats(business_id: Optional[str] = None):
    all_leads = list(leads.values())
    if business_id:
        all_leads = [l for l in all_leads if l.get("business_id") == business_id]
    return {
        "total": len(all_leads),
        "hot": len([l for l in all_leads if l.get("score") == "HOT"]),
        "warm": len([l for l in all_leads if l.get("score") == "WARM"]),
        "cold": len([l for l in all_leads if l.get("score") == "COLD"]),
        "appointments": len([l for l in all_leads if l.get("appointment_requested")]),
    }
