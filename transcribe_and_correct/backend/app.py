from flask import Flask, request, jsonify
from flask_cors import CORS
import whisper
import torch
import tempfile
import os
import requests

app = Flask(__name__)
CORS(app)

device = "cuda" if torch.cuda.is_available() else "cpu"
try:
    model = whisper.load_model("base").to(device)
except Exception as e:
    print(f"Error loading Whisper model: {e}")
    model = None  # Prevent crashes if model load fails

LLM_SERVER_URL = "http://localhost:5002/api/grammar-check"

@app.route("/transcribe", methods=["POST"])
def transcribe_audio():
    if not model:
        return jsonify({"error": "Whisper model failed to load."}), 500

    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as temp_audio:
        file.save(temp_audio.name)
        temp_audio_path = temp_audio.name

    try:
        audio = whisper.load_audio(temp_audio_path)
        audio = whisper.pad_or_trim(audio)
        mel = whisper.log_mel_spectrogram(audio).to(device)

        _, probs = model.detect_language(mel)
        detected_language = max(probs, key=probs.get)

        print(f"Detected language: {detected_language}")

        options = whisper.DecodingOptions(fp16=torch.cuda.is_available())
        result = whisper.decode(model, mel, options)

        os.remove(temp_audio_path)

        text_to_correct = result.text.strip()
        if not text_to_correct:
            return jsonify({"error": "No text extracted from audio."}), 400

        # Send to LLM for correction
        corrected_text = text_to_correct  # Default to original text
        try:
            response = requests.post(LLM_SERVER_URL, json={"text": text_to_correct})
            if response.status_code == 200:
                corrected_text = response.json().get("correctedText", text_to_correct)
            else:
                print(f"LLM Server Error: {response.status_code}, {response.text}")
        except requests.exceptions.RequestException as e:
            print(f"Error contacting LLM server: {e}")

        return jsonify({
            "original_text": text_to_correct,
            "corrected_text": corrected_text,
            "language": detected_language
        })

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5001)
