# -------- Base image --------------------------------------------------------
     FROM python:3.11-slim

     # -------- 1) System packages needed by imageio-ffmpeg / ffmpeg -------------
     RUN apt-get update && \
         apt-get install -y --no-install-recommends ca-certificates && \
         rm -rf /var/lib/apt/lists/*
     
     # -------- 2) Working directory ---------------------------------------------
     WORKDIR /app
     
     # -------- 3) Python dependencies -------------------------------------------
     COPY requirements.txt .
     RUN pip install --no-cache-dir -r requirements.txt
     
     # -------- 4) Application code ----------------------------------------------
     # Destination must be a directory (note the trailing ./)
     COPY slice_service.py clipper_util.py ./
     
     # -------- 5) Expose ffmpeg binary downloaded by imageio-ffmpeg -------------
     ENV PATH="/root/.imageio_ffmpeg:${PATH}"
     
     # -------- 6) Start Gunicorn -------------------------------------------------
     CMD ["gunicorn", "--bind", "0.0.0.0:8080", "slice_service:app"]
     