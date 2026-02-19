from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import BranchStock, Tab, User, AdminAuditLog

# @receiver(post_save, sender=BranchStock)
# def log_stock_change(sender, instance, created, **kwargs):
#     action = "Initial Stock Set" if created else "Stock Adjusted"
#     AdminAuditLog.objects.create(
#         action_type=action,
#         description=f"Stock for {instance.tab.name} at {instance.branch.name} set to {instance.stock_remaining}."
#     )

@receiver(post_save, sender=Tab)
def log_limit_change(sender, instance, **kwargs):
    AdminAuditLog.objects.create(
        action_type="Limit Change",
        description=f"Daily limit for {instance.name} updated to {instance.daily_limit_per_user}."
    )