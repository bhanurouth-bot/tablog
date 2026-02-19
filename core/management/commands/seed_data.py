from django.core.management.base import BaseCommand
from core.models import Branch, Tab, BranchStock, User
from django.db import transaction

class Command(BaseCommand):
    help = 'Populates the database with initial test branches, tabs, and stock'

    def handle(self, *args, **kwargs):
        self.stdout.write("Seeding data...")

        with transaction.atomic():
            # 1. Create a Test Branch [cite: 20, 88-93]
            branch, _ = Branch.objects.get_or_create(
                name="Main Downtown Branch",
                defaults={"location": "123 Innovation Drive"}
            )

            # 2. Create Tab Types [cite: 90-97]
            tab_types = [
                {"name": "Standard Blue Tab", "limit": 2},
                {"name": "Premium Red Tab", "limit": 1},
            ]

            for t_data in tab_types:
                tab, _ = Tab.objects.get_or_create(
                    name=t_data["name"],
                    defaults={"daily_limit_per_user": t_data["limit"]}
                )

                # 3. Initialize Branch Stock [cite: 22, 65, 98-103]
                # Setting 50 units for each tab at this branch
                BranchStock.objects.update_or_create(
                    branch=branch,
                    tab=tab,
                    defaults={"stock_remaining": 50}
                )

            # 4. Optional: Assign your superuser to this branch if they exist
            # This ensures your 'User restricted to assigned branch' logic passes [cite: 43]
            first_user = User.objects.filter(is_superuser=True).first()
            if first_user:
                first_user.branch = branch
                first_user.save()
                self.stdout.write(f"Assigned superuser {first_user.employee_id} to {branch.name}")

        self.stdout.write(self.style.SUCCESS("Database seeded successfully!"))