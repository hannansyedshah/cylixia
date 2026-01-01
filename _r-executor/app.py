import subprocess
import base64
import tempfile
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CSVFile(BaseModel):
    filename: str
    data_base64: str

class CodeRequest(BaseModel):
    code: str
    csv_files: list[CSVFile] = None

@app.get("/")
def root():
    return {"status": "✅ R exec API is running and ready"}

@app.post("/run")
async def run_r_code(request: CodeRequest):
    try:
        # === 1️⃣ Create a temporary working directory
        work_dir = tempfile.mkdtemp()
        os.chdir(work_dir)

        # === 2️⃣ Write all uploaded CSVs (if any)
        if request.csv_files:
            for file in request.csv_files:
                file_path = os.path.join(work_dir, file.filename)
                csv_data = base64.b64decode(file.data_base64).decode("utf-8")
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(csv_data)
                print(f"✅ Wrote CSV file: {file.filename}")

        # === 3️⃣ Wrap user code to capture plots automatically
        # Open PNG device BEFORE user code runs, so all print() calls save to files
        wrapper = f"""
# ========== OPEN PNG DEVICE TO CAPTURE ALL PLOTS ==========
png("plot_%03d.png", width=800, height=600, res=120)
# ========== USER CODE ==========
{request.code}
# ========== CLOSE ALL DEVICES ==========
while (dev.cur() > 1) dev.off()
# Count and report plots
plot_files <- list.files(pattern = "^plot_.*\\\\.png$")
cat(sprintf("\\n�u2705 Total plots saved: %d\\n", length(plot_files)))
"""

        # === 4️⃣ Write wrapped R code to temp file
        script_path = os.path.join(work_dir, "user_script.R")
        with open(script_path, "w", encoding="utf-8") as f:
            f.write(wrapper)

        # === 5️⃣ Run Rscript via subprocess
        result = subprocess.run(
            ["Rscript", "--vanilla", script_path],
            capture_output=True,
            text=True,
            cwd=work_dir,
            timeout=120
        )

        # === 6️⃣ Collect PNG outputs (look for plot_*.png pattern)
        plot_base64 = []
        for fname in sorted(os.listdir(work_dir)):
            if fname.lower().startswith("plot_") and fname.lower().endswith(".png"):
                with open(os.path.join(work_dir, fname), "rb") as img:
                    encoded = base64.b64encode(img.read()).decode("utf-8")
                    plot_base64.append({
                        "filename": fname,
                        "data": encoded
                    })

        # === 7️⃣ Error / diagnostics handling
        if result.returncode != 0:
            return {
                "success": False,
                "error": f"Rscript exited with code {result.returncode}",
                "stdout": result.stdout,
                "stderr": result.stderr,
                "plot_base64": plot_base64
            }

        # === 8️⃣ Success response (even if no plots - some code doesn't generate plots)
        return {
            "success": True,
            "stdout": result.stdout,
            "stderr": result.stderr,
            "plot_base64": plot_base64
        }

    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "error": "R execution timed out (120s)."
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Backend exception: {str(e)}"
        }