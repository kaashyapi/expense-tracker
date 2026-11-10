import os
import certifi
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
DB_NAME = "expensetracker"

# Async client for FastAPI operations
client = AsyncIOMotorClient(
    MONGODB_URI,
    tlsCAFile=certifi.where(),
    serverSelectionTimeoutMS=5000
)
db = client[DB_NAME]

users_collection = db["users"]
expenses_collection = db["expenses"]

async def ping_database() -> bool:
    """Verifies live connectivity to MongoDB Atlas for online-only enforcement."""
    try:
        await client.admin.command('ping')
        return True
    except Exception:
        return False

async def init_indexes():
    """Initializes indexes for fast querying."""
    try:
        await users_collection.create_index("google_id", unique=True, sparse=True)
        await users_collection.create_index("email", unique=True)
        await expenses_collection.create_index([("user_id", 1), ("created_at", -1)])
        await expenses_collection.create_index([("user_id", 1), ("date", -1)])
        await expenses_collection.create_index([("user_id", 1), ("category", 1)])
    except Exception as e:
        print(f"Index initialization warning: {e}")

