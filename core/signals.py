from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.core.exceptions import ValidationError
from .models import TabType, User, AdminAuditLog

# --- LICENSE ENFORCEMENT ---
@receiver(pre_save, sender=User)
def check_user_license_limit(sender, instance, **kwargs):
    """
    Enforces a strict limit of 50 'Active' users for the Free Tier.
    Superusers are excluded from this limit to prevent lockout.
    """
    # Check if this is a NEW user being created
    if instance._state.adding:
        # Count current active users (excluding the one being created)
        current_active_users = User.objects.filter(status='active').count()
        
        FREE_TIER_LIMIT = 50
        
        # If limit reached, block creation
        if current_active_users >= FREE_TIER_LIMIT:
            # Allow superusers (developers/owners) to bypass this check
            if not instance.is_superuser:
                raise ValidationError(
                    f"License Limit Reached: You have used all {FREE_TIER_LIMIT} free user seats. "
                    "Please contact support to upgrade your license for more users."
                )

# --- AUDIT LOGGING ---

@receiver(post_save, sender=TabType)
def log_limit_change(sender, instance, created, **kwargs):
    """
    Logs changes to Tab daily limits.
    """
    if not created: # Only log updates, not initial creation
        AdminAuditLog.objects.create(
            action_type="Limit Change",
            description=f"Daily limit for '{instance.name}' updated to {instance.daily_limit_per_user}."
        )