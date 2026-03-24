import os
import sys
import socket
from waitress import serve
from tab_audit_system.wsgi import application

def get_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # doesn't even have to be reachable
        s.connect(('10.255.255.255', 1))
        IP = s.getsockname()[0]
    except Exception:
        IP = '127.0.0.1'
    finally:
        s.close()
    return IP

if __name__ == '__main__':
    ip_address = get_ip()
    port = 8000
    
    print("="*60)
    print(f"   TAB AUDIT SYSTEM - PRODUCTION MODE (Waitress)")
    print(f"   STATUS: RUNNING")
    print("-" * 60)
    print(f"   >> Admin Panel:  http://{ip_address}:{port}/admin/")
    print(f"   >> For Tab return: http://{ip_address}:{port}/")
    print(f"   >> Admin otp dashboard: http://{ip_address}:{port}/admin/dashboard")
    print(f"   >> Check If running or not: http://{ip_address}:{port}/api/")
    print("="*60)
    print("\nLogs:")

    # This runs the server robustly (like Apache/Nginx)
    serve(application, host='0.0.0.0', port=port, threads=6)