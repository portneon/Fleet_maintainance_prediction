"""
Vehicle Maintenance Report Generator using Groq AI
"""

from __future__ import annotations
from dotenv import load_dotenv  
import os
import asyncio
from typing import Dict, Any
from groq import Groq

# =====================
# Groq Configuration
# =====================
load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

client = Groq(api_key=GROQ_API_KEY)


async def generate_maintenance_report(
    prediction_result: Dict[str, Any],
    vehicle_type: str,
    vehicle_age: float,
    total_kilometers: float,
    vehicle_name: str = "Unknown",
    model: str = "Unknown"
) -> Dict[str, Any]:
    """
    Generate a detailed maintenance report using Groq AI.
    """

    # ---------------------
    # Prediction summary
    # ---------------------
    failure_status = (
        "CRITICAL - Failure Detected"
        if prediction_result.get("failure") == 1
        else "Operational"
    )

    failure_prob = prediction_result.get("failure_probability", 0.0)
    failure_types = prediction_result.get("failure_types") or {}

    quality = "Medium Quality" if vehicle_type == "M" else "Low Quality"

    failure_details = [
        f"- {mode}: {prob * 100:.1f}% probability"
        for mode, prob in failure_types.items()
        if prob > 0
    ]

    failure_info = (
        "\n".join(failure_details)
        if failure_details
        else "No specific failure modes detected"
    )

    # ---------------------
    # Groq Prompt
    # ---------------------
    prompt = f"""
You are an expert industrial machinery maintenance advisor.

Vehicle Information:
- Name/ID: {vehicle_name}
- Model: {model}
- Type: {quality} ({vehicle_type})
- Age: {vehicle_age} years
- Total Kilometers: {total_kilometers:,} km

Prediction Analysis:
- Status: {failure_status}
- Failure Probability: {failure_prob * 100:.1f}%
- Detected Failure Modes:
{failure_info}

Generate a report with:
1. Executive Summary
2. Risk Assessment
3. Recommended Actions (Immediate / Short-term / Long-term)
4. Cost Implications in InIndian Rupees (INR)
5. Preventive Measures
6. Diagnostic Recommendations for Mechanics 
"""

    # ---------------------
    # Fallback (no Groq)
    # ---------------------
    if not client:
        return {
            **prediction_result,
            "maintenance_report": {
                "summary": "Groq API key not configured",
                "status": failure_status,
                "groq_available": False,
            }
        }

    # ---------------------
    # Groq API Call
    # ---------------------
    try:
        groq_response = await asyncio.to_thread(
            client.chat.completions.create,
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a senior predictive maintenance engineer "
                        "with over 20 years of experience."
                    ),
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
            temperature=0.7,
            max_tokens=1500,
        )

        report_text = (
            groq_response.choices[0].message.content.strip()
            if groq_response.choices
            else "No report generated."
        )

        return {
            **prediction_result,
            "maintenance_report": {
                "report": report_text,
                "status": failure_status,
                "vehicle_info": {
                    "name": vehicle_name,
                    "model": model,
                    "type": vehicle_type,
                    "quality": quality,
                    "age_years": vehicle_age,
                    "total_km": total_kilometers,
                },
                "groq_available": True,
            },
        }

    # ---------------------
    # Error handling
    # ---------------------
    except Exception as e:
        return {
            **prediction_result,
            "maintenance_report": {
                "summary": "Failed to generate Groq report",
                "status": failure_status,
                "groq_available": False,
                "error": str(e),
            },
        }
