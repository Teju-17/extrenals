from pydantic import BaseModel


class InfluencerAuditResult(BaseModel):
    influencer_name: str
    category: str
    insta_id: str
    total_followers: int
    genuine_count: int
    suspicious_count: int
    bot_count: int
    credibility_score: float
    status: str
    avg_profile_score: float
    avg_engagement_score: float
    avg_temporal_score: float
    reason: str
