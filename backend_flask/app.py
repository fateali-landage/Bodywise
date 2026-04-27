import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from services.ai_service import generate_health_insights
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
# Enable CORS for all routes
CORS(app)

@app.route('/api/ai-insights', methods=['POST'])
def get_ai_insights():
    """
    Endpoint to receive health data and return Gemini-generated insights.
    """
    data = request.get_json()

    if not data:
        return jsonify({"success": False, "error": "No data provided"}), 400

    # Required fields validation
    required_fields = ["weight", "height", "age", "activity"]
    for field in required_fields:
        if field not in data:
            return jsonify({"success": False, "error": f"Missing required field: {field}"}), 400

    # Call the AI service
    result = generate_health_insights(data)

    return jsonify({
        "success": True,
        "data": result
    })

if __name__ == '__main__':
    port = int(os.getenv("PORT", 5001))
    print(f"Flask AI Microservice starting on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=True)
