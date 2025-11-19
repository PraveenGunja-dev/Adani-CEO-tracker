#!/usr/bin/env python3
"""
Script to start the FastAPI server for serving the Next.js application.
"""

import subprocess
import sys
import os

def build_nextjs():
    """Build the Next.js application."""
    print("Building Next.js application...")
    try:
        # Change to the parent directory where the Next.js app is located
        os.chdir("..")
        result = subprocess.run(["npm", "run", "build"], check=True, capture_output=True, text=True)
        print("Next.js build completed successfully!")
        print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error building Next.js app: {e}")
        print(f"Error output: {e.stderr}")
        return False
    except FileNotFoundError:
        print("npm not found. Please make sure Node.js is installed.")
        return False

def export_nextjs():
    """Export the Next.js application as static files."""
    print("Exporting Next.js application...")
    try:
        # Change to the parent directory where the Next.js app is located
        os.chdir("..")
        result = subprocess.run(["npm", "run", "export"], check=True, capture_output=True, text=True)
        print("Next.js export completed successfully!")
        print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error exporting Next.js app: {e}")
        print(f"Error output: {e.stderr}")
        return False
    except FileNotFoundError:
        print("npm not found. Please make sure Node.js is installed.")
        return False

def start_fastapi():
    """Start the FastAPI server."""
    print("Starting FastAPI server...")
    try:
        # Change to the fastapi-server directory
        os.chdir(os.path.dirname(os.path.abspath(__file__)))
        subprocess.run([sys.executable, "main.py"], check=True)
    except subprocess.CalledProcessError as e:
        print(f"Error starting FastAPI server: {e}")
    except FileNotFoundError:
        print("Python not found. Please make sure Python is installed.")

def main():
    """Main function to build and serve the application."""
    print("Starting Adani Excel Server setup...")
    
    # First, let's check if we have the required dependencies
    try:
        import fastapi
        import uvicorn
    except ImportError as e:
        print(f"Missing Python dependencies: {e}")
        print("Please install dependencies using: pip install -r requirements.txt")
        return
    
    # Build and export the Next.js app
    if build_nextjs() and export_nextjs():
        print("Next.js app built and exported successfully!")
        print("Starting FastAPI server...")
        start_fastapi()
    else:
        print("Failed to build/export Next.js app. Starting FastAPI server with development support...")
        start_fastapi()

if __name__ == "__main__":
    main()