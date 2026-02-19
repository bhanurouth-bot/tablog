#!/usr/bin/env bash
# exit on error
set -o errexit

# 1. Install Python dependencies
pip install -r requirements.txt

# 2. Database migrations and static collection (for Admin panel)
python manage.py migrate
python manage.py collectstatic --no-input

# 3. Create Admin & Seed Data (Optional but recommended)
python manage.py seed_data
python manage.py shell <<EOF
from core.models import User
if not User.objects.filter(email='admin@example.com').exists():
    User.objects.create_superuser(email='admin@example.com', password='password123', employee_id='ADMIN01', name='Admin')
EOF