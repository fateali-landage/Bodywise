import json
import re

def mock_generate_health_insights(user_data):
    # Simulated response logic for verification
    weight = user_data.get("weight")
    height = user_data.get("height")
    age = user_data.get("age")
    activity = user_data.get("activity")

    # Mocking Gemini's output for these parameters
    mock_insight = f"At 22 years old with a moderate activity level, your BMI of 22.9 is in the healthy range. Your metabolism is likely efficient at this age."
    mock_recommendation = "Include protein-rich Indian meals like Dal-Chawal or Panner Paratha. Maintain your current physical activity with 30 mins of brisk walking or light jogging daily."
    mock_risk_prediction = "Low risk of chronic conditions. Ensure adequate Vitamin D and Calcium intake to support bone health which peaks in your early 20s."

    # This simulates the cleanup logic in services/ai_service.py
    mock_response = {
        "insight": mock_insight,
        "recommendation": mock_recommendation,
        "risk_prediction": mock_risk_prediction
    }
    
    return mock_response

# Data provided by user
user_input = {
  "weight": 70,
  "height": 175,
  "age": 22,
  "activity": "moderate"
}

# Process the data
result = mock_generate_health_insights(user_input)

# Print the final API response format
print(json.dumps({
    "success": True,
    "data": result
}, indent=2))
