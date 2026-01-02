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
    csv_files: list[CSVFile] | None = None


R_WRAPPER = """
png("plot_%03d.png", width=800, height=600, res=120)
{code}
while (dev.cur() > 1) dev.off()
"""


@app.get("/")
def health():
    return {"status": "ok"}


@app.post("/run")
async def run(req: CodeRequest):
    work_dir = tempfile.mkdtemp()
    try:
        # Write CSV files
        for f in req.csv_files or []:
            path = os.path.join(work_dir, f.filename)
            with open(path, "w", encoding="utf-8") as file:
                file.write(base64.b64decode(f.data_base64).decode())

        # Write R script
        script = os.path.join(work_dir, "script.R")
        with open(script, "w", encoding="utf-8") as f:
            f.write(R_WRAPPER.format(code=req.code))

        # Execute
        result = subprocess.run(
            ["Rscript", "--vanilla", script],
            capture_output=True,
            text=True,
            encoding="utf-8",
            cwd=work_dir,
            timeout=120,
        )

        # Collect plots
        plots = []
        for name in sorted(os.listdir(work_dir)):
            if name.startswith("plot_") and name.endswith(".png"):
                with open(os.path.join(work_dir, name), "rb") as img:
                    plots.append({"filename": name, "data": base64.b64encode(img.read()).decode()})

        return {
            "success": result.returncode == 0,
            "stdout": result.stdout,
            "stderr": result.stderr,
            "plot_base64": plots,
        }

    except subprocess.TimeoutExpired:
        return {"success": False, "error": "Timeout (120s)"}
    except Exception as e:
        return {"success": False, "error": str(e)}
    finally:
        shutil.rmtree(work_dir, ignore_errors=True)
