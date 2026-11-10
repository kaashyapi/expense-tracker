@echo off
echo ===================================================
echo   Minimalist Expense Tracker (FastAPI + MongoDB)
echo   Open in browser: http://localhost:8000
echo ===================================================
call .\venv\Scripts\activate.bat
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
pause

