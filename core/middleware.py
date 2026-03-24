# core/middleware.py

class DisableCSRFForAPIMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # If the request is hitting our mobile/React API, bypass CSRF completely
        if request.path.startswith('/api/'):
            setattr(request, '_dont_enforce_csrf_checks', True)
            
        return self.get_response(request)