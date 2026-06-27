"""
Small Flask app that exposes the chatbot over HTTP and serves the web chat UI.

    pip install -r requirements.txt
    python app.py

Then open http://localhost:5000 in the browser.
"""

from flask import Flask, request, jsonify, send_from_directory

from codealpha_tasks.FAQChatbot.CodeAlpha_FAQChatbot.CodeAlpha_FAQChatbot.chatbot import FAQChatbot

app = Flask(__name__, static_folder="frontend", static_url_path="")

# Build the bot once when the server starts (vectorizer is fitted here).
bot = FAQChatbot()


@app.route("/")
def home():
    return send_from_directory("frontend", "index.html")


@app.route("/ask", methods=["POST"])
def ask():
    payload = request.get_json(silent=True) or {}
    query = (payload.get("message") or "").strip()

    if not query:
        return jsonify({"error": "Empty message"}), 400

    result = bot.get_response(query)
    return jsonify(result)


if __name__ == "__main__":
    app.run(debug=True, port=5000)
