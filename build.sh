#!/usr/bin/env bash
# exit on error
set -o errexit

# 1. Install Django dependencies
pip install -r requirements.txt

# 2. Go to the correct frontend subfolder and build
cd frontend/tab-audit-frontend
npm install
CI=false npm run build
cd ../..

# 3. Collect static files (including the new React build)
python manage.py collectstatic --no-input
python manage.py migrate