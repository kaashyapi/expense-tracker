from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime

DEFAULT_CATEGORIES = [
    {"name": "Groceries", "emoji": "🛒"},
    {"name": "Education", "emoji": "🎓"},
    {"name": "Bills & Rents", "emoji": "🧾"},
    {"name": "Insurances", "emoji": "🛡️"},
    {"name": "Transport", "emoji": "🚗"},
    {"name": "Product Shopping", "emoji": "🛍️"},
    {"name": "Hygiene & Health", "emoji": "🧴"},
    {"name": "Lend/Borrow", "emoji": "🤝"},
    {"name": "INR Transfer", "emoji": "💸"},
    {"name": "Fun & Eat-Out", "emoji": "🍕"},
    {"name": "Bad Habits", "emoji": "🚬"},
]

# Popular emojis pool for custom category creation (distinct from defaults)
AVAILABLE_EMOJIS_POOL = [
    "⚡", "🎮", "✈️", "☕", "🏋️", "💻", "🎬", "🎁", "🏥", "🐾",
    "📚", "💈", "🎧", "🛠️", "🍷", "🏠", "📱", "👔", "💊", "⚽",
    "🎨", "🎯", "🚲", "🏖️", "🏨", "⛽", "🎟️", "🥘", "🧘", "💼",
    "🧁", "🌿", "💎", "🚕", "📦", "🎳", "🏕️", "🍼", "🪙", "📺"
]

class CategoryItem(BaseModel):
    name: str
    emoji: str
    is_default: bool = False

class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    emoji: str = Field(..., min_length=1, max_length=10)

class ExpenseCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=150)
    category: str = Field(..., min_length=1)
    category_emoji: Optional[str] = "🏷️"
    amount: float = Field(..., gt=0)
    currency: str = Field(default="EUR")
    date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    notes: Optional[str] = ""

class ExpenseUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    category_emoji: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    date: Optional[str] = None
    notes: Optional[str] = None

class ExpenseResponse(BaseModel):
    id: str
    user_id: str
    title: str
    category: str
    category_emoji: str
    amount: float
    currency: str
    date: str
    notes: str
    created_at: str
    updated_at: Optional[str] = None

class GoogleAuthRequest(BaseModel):
    credential: Optional[str] = None
    # Support development / fallback direct login
    demo_mode: bool = False
    email: Optional[str] = None
    name: Optional[str] = None
    picture: Optional[str] = None

