FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg wget && \
    rm -rf /var/lib/apt/lists/* && \
    adduser --disabled-password --gecos "" --uid 1001 appuser

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY --chown=appuser:appuser . .

USER appuser

EXPOSE 8000

CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port 8000 --ssl-keyfile /etc/ssl/certs/app/${DOMAIN_NAME}.key --ssl-certfile /etc/ssl/certs/app/${DOMAIN_NAME}.crt"]