import os
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Use a distill variant that works with transformers and fits on normal hardware.
model_name = os.getenv("MODEL_NAME", "deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B")

device = "cuda" if torch.cuda.is_available() else "cpu"

try:
    tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
    model = AutoModelForCausalLM.from_pretrained(
        model_name,
        torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
        trust_remote_code=True,
    ).to(device)
except Exception as e:
    print(f"Error loading model: {e}")
    exit(1)


@app.route("/generate", methods=["POST"])
def generate():
    data = request.json or {}
    prompt = data.get("prompt", "")
    max_new_tokens = int(data.get("max_length", 100))

    if not prompt:
        return jsonify({"error": "prompt is empty"}), 400

    messages = [
        {"role": "system", "content": "You are a helpful AI assistant."},
        {"role": "user", "content": prompt},
    ]

    # Let tokenizer build the correct chat template for DeepSeek/Qwen.
    input_text = tokenizer.apply_chat_template(
        messages, tokenize=False, add_generation_prompt=True
    )

    inputs = tokenizer(input_text, return_tensors="pt").to(model.device)

    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=max_new_tokens,
            do_sample=True,
            temperature=0.8,
            top_p=0.9,
        )

    full_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
    # Simple way to remove the prompt from the front.
    reply = full_text[len(input_text):].strip()

    return jsonify({"response": reply})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)

