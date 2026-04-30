import os
import re
from flask import Flask, request, jsonify
from flask_cors import CORS
from services.ai_service import generate_health_insights
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)

# ── CORS ───────────────────────────────────────────────────────────────────────
# Restrict to the deployed Vercel frontend and local dev origins only
ALLOWED_ORIGINS = [
    os.getenv("FRONTEND_URL", "https://bodywise-two.vercel.app"),
    "http://localhost:5000",
    "http://localhost:3000",
]
CORS(app, origins=ALLOWED_ORIGINS, methods=["GET", "POST", "OPTIONS"])


def sanitize_string(value, max_len=100):
    """Strip prompt-injection patterns and enforce a length cap."""
    if not isinstance(value, str):
        return str(value) if value is not None else ""
    value = value[:max_len]
    # Remove shell / template characters and common injection keywords
    value = re.sub(r'[`${}[\]\\]', '', value)
    value = re.sub(r'\b(ignore|forget|override|system|assistant)\b', '', value, flags=re.IGNORECASE)
    return value.strip()


def validate_number(value, min_val, max_val, field_name):
    """Return (float, None) on success or (None, error_message) on failure."""
    try:
        n = float(value)
        if not (min_val <= n <= max_val):
            return None, f"{field_name} must be between {min_val} and {max_val}"
        return n, None
    except (TypeError, ValueError):
        return None, f"{field_name} must be a valid number"


@app.route('/api/ai-insights', methods=['POST'])
def get_ai_insights():
    """
    Receive health data, validate it, sanitize it, and return Gemini-generated insights.
    """
    data = request.get_json()

    if not data:
        return jsonify({"success": False, "error": "No data provided"}), 400

    errors = []

    weight, err = validate_number(data.get("weight"), 20, 500, "weight")
    if err:
        errors.append(err)

    height, err = validate_number(data.get("height"), 50, 300, "height")
    if err:
        errors.append(err)

    age, err = validate_number(data.get("age"), 1, 120, "age")
    if err:
        errors.append(err)

    if "activity" not in data or not data["activity"]:
        errors.append("activity is required")

    if errors:
        return jsonify({"success": False, "error": "; ".join(errors)}), 400

    # Sanitize all string fields before passing to AI
    clean_data = {
        "weight": weight,
        "height": height,
        "age": age,
        "activity": sanitize_string(str(data.get("activity", ""))),
    }

    result = generate_health_insights(clean_data)

    return jsonify({
        "success": True,
        "data": result
    })


@app.errorhandler(404)
def not_found(e):
    return jsonify({"success": False, "error": "Endpoint not found"}), 404


@app.errorhandler(500)
def server_error(e):
    return jsonify({"success": False, "error": "Internal server error"}), 500


if __name__ == '__main__':
    port = int(os.getenv("PORT", 5001))
    # Read debug flag from env — defaults to False in production
    debug_mode = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    print(f"Flask AI Microservice starting on port {port} (debug={debug_mode})...")
    app.run(host='0.0.0.0', port=port, debug=debug_mode)
