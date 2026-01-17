FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    build-essential libffi-dev \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir \
    fastapi uvicorn[standard] pydantic \
    pandas numpy scipy matplotlib seaborn \
    scikit-learn statsmodels plotly \
    openpyxl pyarrow xlrd

WORKDIR /app
COPY app.py /app/app.py

EXPOSE 7860
CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT:-7860}"]
