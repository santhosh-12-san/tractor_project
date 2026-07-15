# Base image
FROM python:3.13-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

# Install system packages required for compiling libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy and install dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . /app/

# Expose port
EXPOSE 8000

# Run migrations and start gunicorn server, waiting for PG to be ready
CMD ["sh", "-c", "until python -c 'import os, psycopg2; psycopg2.connect(dbname=os.environ[\"DB_NAME\"], user=os.environ[\"DB_USER\"], password=os.environ[\"DB_PASSWORD\"], host=os.environ[\"DB_HOST\"], port=os.environ[\"DB_PORT\"])' 2>/dev/null; do echo 'Waiting for PostgreSQL...'; sleep 1; done; python manage.py migrate && gunicorn backend.wsgi:application --bind 0.0.0.0:8000"]
