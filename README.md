# Influencer Credibility Auditor (AI/ML End-to-End Web App)

Production-ready full-stack project for detecting fake followers and auditing influencer credibility from grouped Instagram CSV data.

## Folder Structure

```text
.
├── backend/
│   ├── app/
│   │   ├── analyzer.py
│   │   ├── main.py
│   │   └── schemas.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── CredibilityGauge.jsx
│   │   │   ├── DistributionPie.jsx
│   │   │   └── ExplainabilityBar.jsx
│   │   ├── lib/api.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js
└── data/sample_influencer_followers.csv
```

## ML / Scoring Pipeline

Per follower:

1. Feature engineering:
   - `ratio = followers_count / (following_count + 1)`
   - `engagement_ratio = (avg_likes + avg_comments) / (followers_count + 1)`
   - `activity_rate = total_posts / (account_age_days + 1)`
2. Min-max normalization.
3. Score computation:
   - `ProfileScore = avg(1-ratio_norm, 1-age_norm, 1-profile_complete_norm)`
   - `EngagementScore = 1-engagement_norm`
   - `TemporalScore = activity_norm`
4. Entropy weights across Profile/Engagement/Temporal scores.
5. `RiskScore = wp*Profile + we*Engagement + wt*Temporal`
6. Classification:
   - `< 0.4` => Genuine
   - `0.4 - 0.7` => Suspicious
   - `> 0.7` => Bot

Per influencer:

- Skip first row (influencer row), process followers only.
- Compute totals and credibility:
  - `Credibility = (Ng + 0.5*Ns) / N`
- Final status:
  - `Credibility >= 0.6` => Genuine
  - else Fake

Explainability reason strings include:

- Low engagement
- High bot percentage
- Poor follower ratio/profile quality

## Backend (FastAPI)

### Install & Run

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### API

- `GET /health`
- `POST /analyze` (multipart form upload with `file=.csv`)

Response (summary only):

```json
[
  {
    "influencer_name": "AvaFit",
    "category": "Fitness",
    "insta_id": "INF001",
    "total_followers": 10,
    "genuine_count": 4,
    "suspicious_count": 3,
    "bot_count": 3,
    "credibility_score": 0.55,
    "status": "Fake",
    "avg_profile_score": 0.56,
    "avg_engagement_score": 0.61,
    "avg_temporal_score": 0.41,
    "reason": "Low engagement, High bot percentage"
  }
]
```

## Frontend (React + Vite + Tailwind + Recharts)

### Install & Run

```bash
cd frontend
npm install
npm run dev
```

If backend is not on default URL, set:

```bash
VITE_API_BASE=http://localhost:8000 npm run dev
```

## Dashboard Features

- CSV upload
- Audit table for all influencers
- Search/filter (name/category/id)
- Pagination
- Download filtered report as CSV
- Visualizations:
  - Credibility gauge
  - Follower distribution pie chart
  - Explainability contribution bar chart

## Scalability Notes

- Backend returns only aggregated influencer-level output.
- Vectorized pandas/numpy operations are used for speed.
- Works with large files (200k+ records), with low-memory CSV read settings.
- You can add async task queue + Redis caching for heavier production traffic.
