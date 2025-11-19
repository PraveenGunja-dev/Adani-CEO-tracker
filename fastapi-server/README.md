# FastAPI Server for Adani Excel

This FastAPI server is designed to serve the Next.js application as static files.

## Prerequisites

1. Python 3.7+
2. Node.js and npm
3. Required Python packages (listed in requirements.txt)

## Installation

1. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Usage

### Development Mode

For development, you can run the Next.js app separately using:
```bash
npm run dev
```

And run the FastAPI server with:
```bash
python main.py
```

### Production Mode

1. Build the Next.js application:
   ```bash
   npm run build
   ```

2. Export the Next.js application as static files:
   ```bash
   npm run export
   ```

3. Start the FastAPI server:
   ```bash
   python main.py
   ```

The application will be available at http://localhost:8000

## API Endpoints

- `/health` - Health check endpoint
- `/` - Serves the Next.js application

## How It Works

The FastAPI server mounts the Next.js static files (exported to the `out` directory) and serves them. It also provides API endpoints for health checks and other server-side functionality.