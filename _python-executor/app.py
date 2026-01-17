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


PYTHON_WRAPPER = """
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

_plot_counter = [0]
_original_show = plt.show

def _capture_show(*args, **kwargs):
    for fig_num in plt.get_fignums():
        fig = plt.figure(fig_num)
        _plot_counter[0] += 1
        fig.savefig(f'plot_{{_plot_counter[0]:03d}}.png', dpi=120, bbox_inches='tight')
        plt.close(fig)

plt.show = _capture_show

{code}

# Capture any remaining figures
for fig_num in plt.get_fignums():
    _plot_counter[0] += 1
    plt.figure(fig_num).savefig(f'plot_{{_plot_counter[0]:03d}}.png', dpi=120, bbox_inches='tight')
    plt.close(fig_num)
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

        # Write Python script
        script = os.path.join(work_dir, "script.py")
        with open(script, "w", encoding="utf-8") as f:
            f.write(PYTHON_WRAPPER.format(code=req.code))

        # Execute
        result = subprocess.run(
            ["python", script],
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
