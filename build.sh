#!/usr/bin/env bash
set -o errexit

# 1. Install Python dependencies
pip install -r requirements.txt

# 2. Go to the correct subfolder and build the React app
cd frontend/tab-audit-frontend
npm install
CI=false npm run build  # CI=false prevents warnings from failing the build
cd ../..

# 3. Collect files and migrate database
python manage.py collectstatic --no-input
python manage.py migrate