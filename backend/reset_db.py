"""
Database Reset & Re-seeding Script for SuperDocs Task 2.
Deletes the local SQLite database and freshly seeds all suppliers in clean initial states.
"""
import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from app.db.base import Base
from app.db.session import async_session_factory
from app.db.models import SupplierModel
from app.schemas.enums import SupplierTier, Region
from app.core.config import settings

INITIAL_SUPPLIERS = [
    {
        "id": "sup-001-acme",
        "name": "Acme Precision Components GmbH",
        "code": "SUP-ACME-01",
        "tier": SupplierTier.TIER_1_STRATEGIC.value,
        "region": Region.EU.value,
        "country": "Germany",
        "primary_contact_email": "compliance@acme-precision.de",
    },
    {
        "id": "sup-002-apex",
        "name": "Apex Electronics Manufacturing Ltd.",
        "code": "SUP-APEX-02",
        "tier": SupplierTier.TIER_2_MANUFACTURING.value,
        "region": Region.APAC.value,
        "country": "Taiwan",
        "primary_contact_email": "esg-office@apex-semi.tw",
    },
    {
        "id": "sup-003-zenith",
        "name": "Zenith Global Minerals & Logistics Corp.",
        "code": "SUP-ZENITH-03",
        "tier": SupplierTier.TIER_3_COMMODITY.value,
        "region": Region.NORTH_AMERICA.value,
        "country": "United States",
        "primary_contact_email": "sustainability@zenithminerals.com",
    },
    {
        "id": "sup-004-nordic",
        "name": "Nordic CleanTech Solutions AB",
        "code": "SUP-NORDIC-04",
        "tier": SupplierTier.TIER_1_STRATEGIC.value,
        "region": Region.EU.value,
        "country": "Sweden",
        "primary_contact_email": "audit@nordiccleantech.se",
    },
    {
        "id": "sup-005-pacific",
        "name": "Pacific Industrial Assemblies Co.",
        "code": "SUP-PACIFIC-05",
        "tier": SupplierTier.TIER_2_MANUFACTURING.value,
        "region": Region.APAC.value,
        "country": "Vietnam",
        "primary_contact_email": "esg@pacificassemblies.vn",
    },
]


async def reset_database():
    db_file = "task2_esg.db"
    if os.path.exists(db_file):
        os.remove(db_file)
        print(f"✓ Removed existing database: {db_file}")

    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        print("✓ Created database schema tables.")

    async with async_session_factory() as session:
        for s_data in INITIAL_SUPPLIERS:
            supplier = SupplierModel(**s_data)
            session.add(supplier)
        await session.commit()
        print(f"✓ Successfully seeded {len(INITIAL_SUPPLIERS)} clean base suppliers (All 'NOT ISSUED').")

    print("\n🎉 Database reset complete! You can now test the entire lifecycle from scratch:")
    print("  1. Click 'Issue Package' for Acme, Apex, or Nordic.")
    print("  2. Upload a sample file from sample_data/ (e.g. acme_industrial_tier1_eu.txt).")
    print("  3. Inspect the Review Gate & approve findings.")
    print("  4. Generate a Deficiency Notice citing exact supplier quotes.")
    print("  5. Open Executive Report & download the PDF!")


if __name__ == "__main__":
    asyncio.run(reset_database())
