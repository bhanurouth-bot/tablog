from django.core.management.base import BaseCommand
from core.models import TabType, TabletDevice, User
from django.db import transaction
import random

class Command(BaseCommand):
    help = 'Populates the database with Tab Types and actual Device Stock'

    def handle(self, *args, **kwargs):
        self.stdout.write("Seeding data...")

        with transaction.atomic():
            # 1. Create Tab Types (The "Models" of tablets)
            tab_types_data = [
                {"name": "Samsung Galaxy Tab A8", "limit": 2},
                {"name": "iPad 9th Gen", "limit": 1},
                {"name": "Lenovo Tab M10", "limit": 2},
            ]

            for t_data in tab_types_data:
                tab_type, created = TabType.objects.get_or_create(
                    name=t_data["name"],
                    defaults={"daily_limit_per_user": t_data["limit"]}
                )
                
                if created:
                    self.stdout.write(f"Created Tab Type: {tab_type.name}")

                # 2. Create Physical Devices (Stock) for this Type
                # Let's create 5 devices for each type for testing
                for i in range(1, 6): 
                    serial_num = f"{t_data['name'][:3].upper()}-{random.randint(1000, 9999)}"
                    
                    device, dev_created = TabletDevice.objects.get_or_create(
                        serial_number=serial_num,
                        defaults={
                            "tab_type": tab_type,
                            "qr_code": f"QR-{serial_num}",
                            "status": "available",
                            "condition": "Good"
                        }
                    )
                    if dev_created:
                        self.stdout.write(f"  -> Added Device: {serial_num}")

        self.stdout.write(self.style.SUCCESS("Database seeded successfully with Tab Types and Devices!"))