import os
from datetime import datetime, timezone
from typing import Optional, List
from bson import ObjectId
from fastapi import FastAPI, HTTPException, Depends, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.database import db, users_collection, expenses_collection, ping_database, init_indexes
from backend.models import (
    DEFAULT_CATEGORIES,
    AVAILABLE_EMOJIS_POOL,
    CategoryCreate,
    ExpenseCreate,
    ExpenseUpdate,
    GoogleAuthRequest,
)
from backend.auth import (
    verify_google_token,
    generate_session_token,
    get_current_user,
)

app = FastAPI(title="Expense Tracker API", version="1.0.0")

# Enable CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    await init_indexes()

# ----------------- Health & Online Status -----------------
@app.get("/api/health")
async def health_check():
    is_mongo_online = await ping_database()
    return {
        "status": "online" if is_mongo_online else "degraded",
        "mongodb_connected": is_mongo_online,
        "database": "expensetracker",
        "server_time": datetime.now(timezone.utc).isoformat()
    }

# ----------------- Authentication -----------------
@app.get("/api/auth/config")
async def get_auth_config():
    client_id = os.getenv("GOOGLE_CLIENT_ID", "") or os.getenv("VITE_GOOGLE_CLIENT_ID", "")
    return {
        "google_client_id": client_id,
        "is_configured": bool(client_id and "dummy" not in client_id)
    }

@app.post("/api/auth/google")
async def google_auth(payload: GoogleAuthRequest):
    # Verify live database is online first
    if not await ping_database():
        raise HTTPException(status_code=503, detail="Database is offline. Operation requires online connectivity.")

    if payload.demo_mode or not payload.credential:
        # Dev / Demo user
        email = payload.email or "kashyapi.user@gmail.com"
        name = payload.name or "Kashyapi"
        picture = payload.picture or "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
        google_id = f"demo_gid_{email}"
    else:
        google_info = verify_google_token(payload.credential)
        email = google_info.get("email")
        name = google_info.get("name", email.split("@")[0])
        picture = google_info.get("picture", "")
        google_id = google_info.get("sub") or f"gid_{email}"

    # Upsert user into MongoDB 'users' collection
    user = await users_collection.find_one({"email": email})
    now_iso = datetime.now(timezone.utc).isoformat()

    if not user:
        user_doc = {
            "google_id": google_id,
            "email": email,
            "name": name,
            "picture": picture,
            "custom_categories": [],
            "created_at": now_iso,
            "last_login": now_iso
        }
        result = await users_collection.insert_one(user_doc)
        user_id = str(result.inserted_id)
    else:
        user_id = str(user["_id"])
        await users_collection.update_one(
            {"_id": user["_id"]},
            {"$set": {"last_login": now_iso, "picture": picture or user.get("picture", "")}}
        )

    token = generate_session_token(user_id=user_id, email=email)
    return {
        "token": token,
        "user": {
            "id": user_id,
            "email": email,
            "name": name,
            "picture": picture
        }
    }

@app.get("/api/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    user = await users_collection.find_one({"_id": ObjectId(current_user["user_id"])})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": str(user["_id"]),
        "email": user["email"],
        "name": user["name"],
        "picture": user.get("picture", ""),
        "created_at": user.get("created_at")
    }

# ----------------- Categories -----------------
@app.get("/api/categories")
async def get_categories(current_user: dict = Depends(get_current_user)):
    user = await users_collection.find_one({"_id": ObjectId(current_user["user_id"])})
    custom_cats = user.get("custom_categories", []) if user else []

    all_categories = []
    for cat in DEFAULT_CATEGORIES:
        all_categories.append({
            "name": cat["name"],
            "emoji": cat["emoji"],
            "is_default": True
        })

    for cat in custom_cats:
        all_categories.append({
            "name": cat["name"],
            "emoji": cat["emoji"],
            "is_default": False
        })

    # Deduplicate emojis: Find emojis currently used
    used_emojis = {c["emoji"] for c in all_categories}
    remaining_emojis = [em for em in AVAILABLE_EMOJIS_POOL if em not in used_emojis]

    return {
        "categories": all_categories,
        "remaining_emojis": remaining_emojis
    }

@app.post("/api/categories")
async def add_category(payload: CategoryCreate, current_user: dict = Depends(get_current_user)):
    if not await ping_database():
        raise HTTPException(status_code=503, detail="Database is offline.")

    user = await users_collection.find_one({"_id": ObjectId(current_user["user_id"])})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    custom_cats = user.get("custom_categories", [])
    
    # Check uniqueness of name and emoji against default + custom
    existing_names = {c["name"].strip().lower() for c in DEFAULT_CATEGORIES} | {c["name"].strip().lower() for c in custom_cats}
    existing_emojis = {c["emoji"] for c in DEFAULT_CATEGORIES} | {c["emoji"] for c in custom_cats}

    clean_name = payload.name.strip()
    clean_emoji = payload.emoji.strip()

    if clean_name.lower() in existing_names:
        raise HTTPException(status_code=400, detail=f"Category '{clean_name}' already exists.")

    if clean_emoji in existing_emojis:
        raise HTTPException(status_code=400, detail=f"Emoji '{clean_emoji}' is already used by another category.")

    new_cat = {
        "name": clean_name,
        "emoji": clean_emoji,
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    await users_collection.update_one(
        {"_id": ObjectId(current_user["user_id"])},
        {"$push": {"custom_categories": new_cat}}
    )

    return {"message": "Category created successfully", "category": new_cat}

# ----------------- Expenses -----------------
@app.get("/api/expenses/recent")
async def get_recent_expenses(
    current_user: dict = Depends(get_current_user),
    currency: Optional[str] = None
):
    """Returns top 7 recent logged expenses for the authenticated user."""
    query = {"user_id": current_user["user_id"]}
    if currency and currency != "ALL":
        query["currency"] = currency

    cursor = expenses_collection.find(query).sort("created_at", -1).limit(7)

    items = []
    async for doc in cursor:
        items.append({
            "id": str(doc["_id"]),
            "user_id": doc["user_id"],
            "title": doc["title"],
            "category": doc["category"],
            "category_emoji": doc.get("category_emoji", "🏷️"),
            "amount": float(doc["amount"]),
            "currency": doc.get("currency", "EUR"),
            "date": doc["date"],
            "notes": doc.get("notes", ""),
            "created_at": doc.get("created_at", "")
        })
    return items

@app.get("/api/expenses")
async def list_expenses(
    current_user: dict = Depends(get_current_user),
    month: Optional[str] = Query(None, description="Format: YYYY-MM"),
    year: Optional[str] = Query(None, description="Format: YYYY"),
    category: Optional[str] = None,
    currency: Optional[str] = None,
    search: Optional[str] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    sort_by: str = Query("date"),
    sort_order: str = Query("desc")
):
    query = {"user_id": current_user["user_id"]}

    if currency and currency != "ALL":
        query["currency"] = currency

    if month:
        query["date"] = {"$regex": f"^{month}"}
    elif year:
        query["date"] = {"$regex": f"^{year}"}

    if category and category != "ALL":
        query["category"] = category

    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"notes": {"$regex": search, "$options": "i"}}
        ]

    if min_amount is not None or max_amount is not None:
        amount_query = {}
        if min_amount is not None:
            amount_query["$gte"] = min_amount
        if max_amount is not None:
            amount_query["$lte"] = max_amount
        query["amount"] = amount_query

    if start_date or end_date:
        date_query = query.get("date", {})
        if not isinstance(date_query, dict):
            date_query = {}
        if start_date:
            date_query["$gte"] = start_date
        if end_date:
            date_query["$lte"] = end_date
        query["date"] = date_query

    # Sorting
    direction = -1 if sort_order.lower() == "desc" else 1
    sort_field = sort_by if sort_by in ["date", "amount", "title", "created_at"] else "date"

    # Aggregation for total count & sum
    total_count = await expenses_collection.count_documents(query)
    
    # Calculate sum
    pipeline = [
        {"$match": query},
        {"$group": {"_id": None, "total_sum": {"$sum": "$amount"}}}
    ]
    agg_res = await expenses_collection.aggregate(pipeline).to_list(length=1)
    total_amount = float(agg_res[0]["total_sum"]) if agg_res else 0.0

    # Pagination
    skip = (page - 1) * page_size
    cursor = expenses_collection.find(query).sort(sort_field, direction).skip(skip).limit(page_size)

    items = []
    async for doc in cursor:
        items.append({
            "id": str(doc["_id"]),
            "user_id": doc["user_id"],
            "title": doc["title"],
            "category": doc["category"],
            "category_emoji": doc.get("category_emoji", "🏷️"),
            "amount": float(doc["amount"]),
            "currency": doc.get("currency", "EUR"),
            "date": doc["date"],
            "notes": doc.get("notes", ""),
            "created_at": doc.get("created_at", "")
        })

    total_pages = max(1, (total_count + page_size - 1) // page_size)

    return {
        "items": items,
        "total_count": total_count,
        "total_amount": round(total_amount, 2),
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }

@app.get("/api/expenses/monthly-summary")
async def get_monthly_summary(
    current_user: dict = Depends(get_current_user),
    year: Optional[int] = Query(None),
    currency: Optional[str] = Query(None)
):
    """
    Returns monthly summary up to 12 months starting from current month downwards.
    Each month has total spent, category-wise breakdown with totals.
    """
    now = datetime.now()
    target_year = year or now.year

    # Generate 12 months sequence (from current month backwards within the year or across 12 months)
    months_list = []
    # If target_year is current year, start from current month down to 1
    # or list all 12 months descending
    start_month = now.month if target_year == now.year else 12
    for m in range(start_month, 0, -1):
        m_str = f"{target_year}-{m:02d}"
        month_dt = datetime(target_year, m, 1)
        months_list.append({
            "key": m_str,
            "name": month_dt.strftime("%b %Y"),
            "is_current": (target_year == now.year and m == now.month)
        })

    # Fetch expenses for this user and this year
    query = {
        "user_id": current_user["user_id"],
        "date": {"$regex": f"^{target_year}-"}
    }
    if currency and currency != "ALL":
        query["currency"] = currency
    expenses = await expenses_collection.find(query).to_list(length=10000)

    # Group by month and category
    summaries = []
    for m_meta in months_list:
        m_key = m_meta["key"]
        month_expenses = [e for e in expenses if e["date"].startswith(m_key)]
        total_spent = sum(e["amount"] for e in month_expenses)

        # Category breakdown
        cat_map = {}
        for e in month_expenses:
            cat = e["category"]
            emoji = e.get("category_emoji", "🏷️")
            if cat not in cat_map:
                cat_map[cat] = {"category": cat, "emoji": emoji, "total": 0.0, "count": 0}
            cat_map[cat]["total"] += e["amount"]
            cat_map[cat]["count"] += 1

        cat_breakdown = sorted(
            [{"category": k, "emoji": v["emoji"], "total": round(v["total"], 2), "count": v["count"]} for k, v in cat_map.items()],
            key=lambda x: x["total"],
            reverse=True
        )

        summaries.append({
            "month": m_key,
            "month_name": m_meta["name"],
            "is_current": m_meta["is_current"],
            "total_amount": round(total_spent, 2),
            "expense_count": len(month_expenses),
            "categories": cat_breakdown
        })

    return summaries

@app.post("/api/expenses", status_code=status.HTTP_201_CREATED)
async def create_expense(payload: ExpenseCreate, current_user: dict = Depends(get_current_user)):
    if not await ping_database():
        raise HTTPException(status_code=503, detail="Database is offline. Operation requires online connectivity.")

    now_iso = datetime.now(timezone.utc).isoformat()
    doc = {
        "user_id": current_user["user_id"],
        "title": payload.title.strip(),
        "category": payload.category.strip(),
        "category_emoji": payload.category_emoji or "🏷️",
        "amount": round(float(payload.amount), 2),
        "currency": payload.currency or "EUR",
        "date": payload.date,
        "notes": (payload.notes or "").strip(),
        "created_at": now_iso,
        "updated_at": now_iso
    }

    result = await expenses_collection.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    return doc

@app.get("/api/expenses/{expense_id}")
async def get_expense(expense_id: str, current_user: dict = Depends(get_current_user)):
    if not ObjectId.is_valid(expense_id):
        raise HTTPException(status_code=400, detail="Invalid expense ID")
    doc = await expenses_collection.find_one({"_id": ObjectId(expense_id), "user_id": current_user["user_id"]})
    if not doc:
        raise HTTPException(status_code=404, detail="Expense not found")
    return {
        "id": str(doc["_id"]),
        "user_id": doc["user_id"],
        "title": doc["title"],
        "category": doc["category"],
        "category_emoji": doc.get("category_emoji", "🏷️"),
        "amount": float(doc["amount"]),
        "currency": doc.get("currency", "EUR"),
        "date": doc["date"],
        "notes": doc.get("notes", ""),
        "created_at": doc.get("created_at", ""),
        "updated_at": doc.get("updated_at")
    }

@app.put("/api/expenses/{expense_id}")
async def update_expense(expense_id: str, payload: ExpenseUpdate, current_user: dict = Depends(get_current_user)):
    if not await ping_database():
        raise HTTPException(status_code=503, detail="Database is offline.")

    if not ObjectId.is_valid(expense_id):
        raise HTTPException(status_code=400, detail="Invalid expense ID")

    update_fields = {}
    if payload.title is not None:
        update_fields["title"] = payload.title.strip()
    if payload.category is not None:
        update_fields["category"] = payload.category.strip()
    if payload.category_emoji is not None:
        update_fields["category_emoji"] = payload.category_emoji.strip()
    if payload.amount is not None:
        update_fields["amount"] = round(float(payload.amount), 2)
    if payload.currency is not None:
        update_fields["currency"] = payload.currency.strip()
    if payload.date is not None:
        update_fields["date"] = payload.date
    if payload.notes is not None:
        update_fields["notes"] = payload.notes.strip()

    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields provided for update")

    update_fields["updated_at"] = datetime.now(timezone.utc).isoformat()

    result = await expenses_collection.update_one(
        {"_id": ObjectId(expense_id), "user_id": current_user["user_id"]},
        {"$set": update_fields}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Expense not found")

    updated = await expenses_collection.find_one({"_id": ObjectId(expense_id)})
    return {
        "id": str(updated["_id"]),
        "user_id": updated["user_id"],
        "title": updated["title"],
        "category": updated["category"],
        "category_emoji": updated.get("category_emoji", "🏷️"),
        "amount": float(updated["amount"]),
        "currency": updated.get("currency", "EUR"),
        "date": updated["date"],
        "notes": updated.get("notes", ""),
        "created_at": updated.get("created_at", ""),
        "updated_at": updated.get("updated_at")
    }

@app.delete("/api/expenses/{expense_id}")
async def delete_expense(expense_id: str, current_user: dict = Depends(get_current_user)):
    if not await ping_database():
        raise HTTPException(status_code=503, detail="Database is offline.")

    if not ObjectId.is_valid(expense_id):
        raise HTTPException(status_code=400, detail="Invalid expense ID")

    result = await expenses_collection.delete_one({"_id": ObjectId(expense_id), "user_id": current_user["user_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Expense not found")

    return {"message": "Expense deleted successfully", "id": expense_id}

# ----------------- Frontend Static Serving -----------------
FRONTEND_DIST = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "client", "dist")
if os.path.exists(FRONTEND_DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="API endpoint not found")
        file_path = os.path.join(FRONTEND_DIST, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))

