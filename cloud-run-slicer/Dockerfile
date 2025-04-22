FROM python:3.11-slim

# install ffmpeg
RUN apt-get update && apt-get install -y ffmpeg

# set working dir
WORKDIR /app

# install Python deps
COPY requirements.txt .
RUN pip install -r requirements.txt

# copy your app code into /app
COPY slice_service.py clipper_util.py ./

# expose port for Cloud Run
EXPOSE 8080

# launch
CMD ["gunicorn", "-b", "0.0.0.0:8080", "slice_service:app"]
