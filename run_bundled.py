import os
import sys
import django
from django.core.wsgi import get_wsgi_application
from waitress import serve

# 1. Setup paths
# PyInstaller unpacks data into a temporary folder; we need to add it to path
if getattr(sys, 'frozen', False):
    base_dir = sys._MEIPASS
else:
    base_dir = os.path.dirname(os.path.abspath(__file__))

sys.path.append(base_dir)

# 2. Configure Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "tab_audit_system.settings")
django.setup()

# 3. Get the WSGI app
application = get_wsgi_application()

if __name__ == '__main__':
    print("=========================================")
    print("   STARTING TAB AUDIT SERVER (BUNDLED)   ")
    print("   Running on http://0.0.0.0:8000        ")
    print("=========================================")
    
    # 4. Start the Server (Waitress is robust for bundled apps)
    serve(application, host='0.0.0.0', port=8000, threads=6)