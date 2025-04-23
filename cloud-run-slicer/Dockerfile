# ./Dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt clipper_util.py slice_service.py ./

RUN pip install -r requirements.txt

# expose 8080 and start gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "slice_service:app"]
