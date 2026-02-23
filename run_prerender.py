import subprocess
import time
import os
import sys

def main():
    # Start Preview Server
    print("Starting preview server on port 4173...")
    preview_process = subprocess.Popen(["npx", "vite", "preview", "--port", "4173"],
                                      stdout=subprocess.PIPE,
                                      stderr=subprocess.PIPE)

    # Wait for server to be ready
    time.sleep(5)

    try:
        # Run Prerender
        print("Running prerender.py...")
        result = subprocess.run(["python", "prerender.py"], capture_output=True, text=True)
        print(result.stdout)
        if result.returncode != 0:
             print(f"Prerender FAILED: {result.stderr}")
             sys.exit(1)
        print("Prerendering complete.")
    finally:
        # Kill Preview Server
        print("Stopping preview server...")
        preview_process.terminate()
        preview_process.wait()

if __name__ == "__main__":
    main()
