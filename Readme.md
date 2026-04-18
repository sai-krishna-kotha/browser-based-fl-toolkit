# Federated Learning Platform

A real-time federated learning system with multi-model support using FastAPI, Redis, PostgreSQL, and React.

---

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd browser-fl-toolkit
```

---

## Backend Setup

### 2. Create Virtual Environment

```bash
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

---

## Start Services (Redis + Postgres)

Ensure Docker is running at /backend directory

```bash
docker-compose up -d
```

---

## Environment Variables

Create a `.env` file inside `backend/`:

```env
DATABASE_URL=postgresql+asyncpg://fluser:flpassword@localhost:5433/fldb
REDIS_URL=redis://localhost:6379
```

---

## Run Backend

```bash
uvicorn app.main:app --reload
```

Backend will run at:

```
http://127.0.0.1:8000
```

---

## Frontend Setup

```bash
cd ../frontend
npm install
npm run dev
```

Frontend will run at:

```
http://localhost:5173
```

---

## Usage

1. Open the frontend in the browser
2. Register a client
3. Select a model
4. Upload a CSV dataset
5. Train and send updates
6. View the dashboard for model progress

---

## Troubleshooting

### Database connection error

* Ensure Postgres container is running on port 5433
* Verify using:

```bash
docker ps
```

### Redis issues

```bash
docker-compose restart redis
```

### Reset Redis (optional)

```bash
redis-cli FLUSHALL
```

---

## Notes

* Checkpoints are stored in `backend/checkpoints/`
* Redis stores real-time training data
* Each model runs independently (multi-model support)

---

## Done

The system should now be running locally.
