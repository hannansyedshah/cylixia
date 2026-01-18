import subprocess
import base64
import tempfile
import shutil
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class CSVFile(BaseModel):
    filename: str
    data_base64: str


class CodeRequest(BaseModel):
    code: str
    csv_file: CSVFile


@app.get("/")
def health():
    return {"status": "ok"}


@app.post("/run")
async def run(req: CodeRequest):
    work_dir = tempfile.mkdtemp()
    try:
        # Write input CSV file
        input_path = os.path.join(work_dir, req.csv_file.filename)
        with open(input_path, "w", encoding="utf-8") as f:
            f.write(base64.b64decode(req.csv_file.data_base64).decode())

        # Write Python script
        script_path = os.path.join(work_dir, "script.py")
        with open(script_path, "w", encoding="utf-8") as f:
            f.write(req.code)

        # Execute
        result = subprocess.run(
            ["python", script_path],
            capture_output=True,
            text=True,
            encoding="utf-8",
            cwd=work_dir,
            timeout=120,
        )

        # Read modified CSV (script should output to same filename)
        csv_output = None
        if os.path.exists(input_path):
            with open(input_path, "r", encoding="utf-8") as f:
                csv_data = f.read()
                csv_output = {
                    "filename": req.csv_file.filename,
                    "data_base64": base64.b64encode(csv_data.encode()).decode()
                }

        return {
            "success": result.returncode == 0,
            "stdout": result.stdout,
            "stderr": result.stderr,
            "csv_output": csv_output,
        }

    except subprocess.TimeoutExpired:
        return {"success": False, "stdout": "", "stderr": "Timeout (120s)", "csv_output": None}
    except Exception as e:
        return {"success": False, "stdout": "", "stderr": str(e), "csv_output": None}
    finally:
        shutil.rmtree(work_dir, ignore_errors=True)
