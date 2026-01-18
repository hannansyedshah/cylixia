FROM python:3.11-slim

RUN pip install --no-cache-dir \
    fastapi uvicorn[standard] pydantic \
    pandas numpy

WORKDIR /app
COPY app.py /app/app.py

EXPOSE 7860
CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT:-7860}"]
