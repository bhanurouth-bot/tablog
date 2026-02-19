#!/usr/bin/env bash
# exit on error
set -o errexit

# 1. Install Python dependencies
pip install -r requirements.txt

# 2. Build Frontend (Replace 'frontend' with your folder name)
cd frontend
npm install
npm run build
cd ..

# 3. Collect all files (including the React build) into staticfiles/
python manage.py collectstatic --no-input
python manage.py migrate