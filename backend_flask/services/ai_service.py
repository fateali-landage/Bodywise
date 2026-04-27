import json
import re
from config.gemini_client import get_gemini_model

def generate_health_insights(user_data):
    """
    Generate health insights using Gemini AI based on user data.
    """
    weight = user_data.get("weight")
    height = user_data.get("height")
    age = user_data.get("age")
    activity = user_data.get("activity")

    # Initialize Gemini model
    model = get_gemini_model()

    # Build the prompt
    prompt = f"""
    You are an AI health assistant.

    Analyze the user's health data:
    * Weight: {weight} kg
    * Height: {height} cm
    * Age: {age}
    * Activity Level: {activity}

    Instructions:
    * Provide simple and practical health insights
    * Suggest improvements (diet, exercise, habits)
    * Predict possible health risks
    * Prefer Indian diet examples (roti, rice, dal, etc.)

    IMPORTANT:
    Return ONLY valid JSON. No extra text.

    JSON format:
    {{
    "insight": "...",
    "recommendation": "...",
    "risk_prediction": "..."
    }}
    """

    try:
        # Call Gemini API
        response = model.generate_content(prompt)
        
        # Clean response to remove markdown formatting if present
        textResponse = response.text.strip()
        # Remove ```json and ``` if they exist
        textResponse = re.sub(r'^```json\s*', '', textResponse)
        textResponse = re.sub(r'\s*```$', '', textResponse)

        # Parse JSON
        result = json.loads(textResponse)
        return result

    except Exception as e:
        print(f"Error generating insights: {e}")
        # Fallback JSON on error
        return {
            "insight": "Unable to analyze health data at the moment.",
            "recommendation": "Please try again later.",
            "risk_prediction": "Unknown"
        }
