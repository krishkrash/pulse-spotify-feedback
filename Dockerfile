# Base image with Node.js and Python
FROM node:20-bookworm-slim

# Install system dependencies, including Python 3, pip, and virtual environments
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    build-essential \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json to install Node dependencies
COPY package*.json ./
RUN npm install --production

# Create virtual environment for Python scraper and install packages
COPY scraper/requirements.txt ./scraper/requirements.txt
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip3 install --no-cache-dir -r ./scraper/requirements.txt

# Copy all project source code
COPY . .

# Set dynamic environment flags
ENV PORT=3001
EXPOSE 3001

# Command to start the API server and the background scheduler concurrently
CMD ["npm", "run", "dev"]
