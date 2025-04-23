FROM python:3.11-slim

# install ffmpeg and other deps
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      ffmpeg \
 && rm -rf /var/lib/apt/lists/*

# copy in your code
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY slice_service.py clipper_util.py .
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "slice_service:app"]
