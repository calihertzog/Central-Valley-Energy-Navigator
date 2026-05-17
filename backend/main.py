from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import os

app = FastAPI()

# --- CORS Configuration ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://central-valley-energy-navigator.vercel.app",
        "http://localhost:3000",
        "http://localhost:5173" # Added Vite default port just in case!
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SurveyResults(BaseModel):
    county: str
    size: str
    utility: str
    income: str
    assistance: List[str] = []

@app.post("/api/evaluate-eligibility")
async def evaluate_eligibility(results: SurveyResults):
    # 1. Categorical Eligibility (Instant CARE)
    if len(results.assistance) > 0:
        return {
            "eligible": True,
            "program": "CARE",
            "messageKey": "care_assistance_msg",
            "discountKey": "care_discount"
        }

    # 2. Income Mapping
    income_map = {
        'Under $42,300': 42299,
        '$42,300 - $53,300': 53300,
        '$53,300 - $64,300': 64300,  
        '$64,300 - $75,300': 75300,
        '$75,300 - $86,300': 86300,
        '$86,300 - $97,300': 97300,
        '$97,300 - $108,300': 108300,
        'Over $108,300': 108301
    }
    user_income = income_map.get(results.income, 999999)

    # 3. CARE Income Limits (2025-2026)
    care_limits = {
        "1-2": 42300, "3": 53300, "4": 64300, "5": 75300, 
        "6": 86300, "7": 97300, "8": 108300, "more than 8": 119300
    }
    
    if user_income <= care_limits.get(results.size, 0):
        return {
            "eligible": True,
            "program": "CARE",
            "messageKey": "care_income_msg",
            "discountKey": "care_discount"
        }

    # 4. FERA Income Limits (HHS of 3+ and specific electric utilities)
    is_electric_provider = results.utility in ['PG&E', 'Southern California Edison (SCE)']
    fera_limits = {
        "3": 66625, "4": 80375, "5": 94125, "6": 107875, 
        "7": 121625, "8": 135375, "more than 8": 149125
    }

    if is_electric_provider and user_income <= fera_limits.get(results.size, 0):
        return {
            "eligible": True,
            "program": "FERA",
            "messageKey": "fera_income_msg",
            "discountKey": "fera_discount"
        }

    # 5. Ineligible
    return {
        "eligible": False,
        "program": None,
        "messageKey": "ineligible_msg",
        "discountKey": None
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)