import os
import sys
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Use Qwen 2.5 0.5B - small, fast and smart model.
model_name = os.getenv("MODEL_NAME", "Qwen/Qwen2.5-0.5B-Instruct")

device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Using device: {device}", flush=True)
print(f"Loading model: {model_name}", flush=True)

model = None
tokenizer = None

try:
    print(f"Loading tokenizer for {model_name}...", flush=True)
    tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
    print("Tokenizer loaded successfully", flush=True)
    
    print(f"Loading model for {model_name}...", flush=True)
    model = AutoModelForCausalLM.from_pretrained(
        model_name,
        torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
        trust_remote_code=True,
    ).to(device)
    print("Model loaded successfully", flush=True)
except Exception as e:
    print(f"Error loading model: {e}", flush=True)
    import traceback
    traceback.print_exc()
    sys.exit(1)


@app.route("/health", methods=["GET"])
def health():
    if model is None or tokenizer is None:
        return jsonify({"status": "loading", "message": "Model is still loading..."}), 503
    return jsonify({"status": "ready", "model": model_name, "device": device}), 200


@app.route("/generate", methods=["POST"])
def generate():
    if model is None or tokenizer is None:
        return jsonify({"error": "Model is still loading. Please try again in a moment."}), 503
    
    data = request.json or {}
    prompt = data.get("prompt", "")
    max_new_tokens = int(data.get("max_length", 150))

    if not prompt:
        return jsonify({"error": "prompt is empty"}), 400

    try:
        messages = [
            {"role": "system", "content": "You are a helpful AI assistant. Be concise and direct."},
            {"role": "user", "content": prompt},
        ]

        # Use chat template if available
        try:
            input_text = tokenizer.apply_chat_template(
                messages, tokenize=False, add_generation_prompt=True
            )
        except:
            # Fallback to simple format if chat template is not available
            input_text = f"System: You are a helpful AI assistant. Be concise and direct.\nUser: {prompt}\nAssistant:"

        inputs = tokenizer(input_text, return_tensors="pt").to(model.device)
        input_length = inputs['input_ids'].shape[1]

        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=max_new_tokens,
                do_sample=True,
                temperature=0.5,
                top_p=0.85,
            )

        full_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        # Extract only the assistant response
        # Try multiple patterns to find the response
        reply = ""
        
        # Pattern 1: Look for "assistant" followed by the response
        if "assistant" in full_text.lower():
            parts = full_text.lower().split("assistant")
            if len(parts) > 1:
                reply = full_text[full_text.lower().find("assistant") + len("assistant"):].strip()
        
        # Pattern 2: If still empty, look for the response after prompt
        if not reply:
            if full_text.startswith(input_text):
                reply = full_text[len(input_text):].strip()
            else:
                reply = full_text.strip()
        
        # Pattern 3: Clean up common prefixes
        if reply.startswith("\n"):
            reply = reply[1:].strip()
        
        # Remove any remaining "user" or "system" tags
        reply = reply.replace("user\n", "").replace("system\n", "").strip()
        
        # If still contains unwanted tags, split on them
        for tag in ["user", "system", "assistant"]:
            if tag in reply:
                parts = reply.split(tag)
                if len(parts) > 1:
                    reply = parts[-1].strip()

        return jsonify({"response": reply})
    except Exception as e:
        print(f"Error generating response: {e}", flush=True)
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Error generating response: {str(e)}"}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)

