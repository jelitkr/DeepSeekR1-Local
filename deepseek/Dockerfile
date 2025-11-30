FROM python:3.8-slim

WORKDIR /app

# Install dependencies including curl for healthcheck
RUN apt-get update && apt-get install -y \
    git \
    wget \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install pip packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install "accelerate>=0.26.0"

# Copy the application code
COPY . .

# Set the model name
ENV MODEL_NAME="Qwen/Qwen2.5-0.5B-Instruct"

# Expose port
EXPOSE 5000

# Run the application
CMD ["python", "serve.py"]

