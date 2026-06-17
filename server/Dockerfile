FROM node:20

# Install system dependencies required for node-canvas
RUN apt-get update && apt-get install -y \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Create writable directories for the PDF/image cache and file uploads
# Hugging Face runs with a random non-root UID (1000), so we must grant write access
RUN mkdir -p file/cache uploads && chmod -R 777 file uploads

# Hugging Face Spaces automatically maps and routes port 7860
EXPOSE 7860
ENV PORT=7860
ENV HOST=0.0.0.0

CMD ["node", "index.js"]
