FROM python:3.8-slim

WORKDIR /app

# Install dependencies
RUN apt-get update && apt-get install -y \
    git \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Install pip packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install "accelerate>=0.26.0"

# Copy the application code
COPY . .

# Set the model name
ENV MODEL_NAME="deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B"

# Expose port
EXPOSE 5000

# Run the application
CMD ["python", "serve.py"]

