from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable

import numpy as np
import pandas as pd

EPSILON = 1e-9
EXPECTED_COLUMNS = [
    "influencer_name",
    "category",
    "insta_id",
    "username",
    "followers_count",
    "following_count",
    "avg_likes",
    "avg_comments",
    "total_posts",
    "account_age_days",
    "profile_complete",
]


@dataclass
class ScoreWeights:
    profile: float
    engagement: float
    temporal: float


def _min_max(series: pd.Series) -> pd.Series:
    min_value = series.min()
    max_value = series.max()
    return (series - min_value) / (max_value - min_value + EPSILON)


def _entropy_weights(matrix: np.ndarray) -> ScoreWeights:
    if matrix.size == 0:
        return ScoreWeights(profile=1 / 3, engagement=1 / 3, temporal=1 / 3)

    sums = matrix.sum(axis=0) + EPSILON
    probabilities = matrix / sums
    probabilities = np.clip(probabilities, EPSILON, 1.0)
    n = matrix.shape[0]
    k = 1.0 / np.log(max(n, 2))
    entropy = -(k * (probabilities * np.log(probabilities)).sum(axis=0))
    diversification = 1 - entropy

    if np.isclose(diversification.sum(), 0):
        weights = np.array([1 / 3, 1 / 3, 1 / 3])
    else:
        weights = diversification / diversification.sum()

    return ScoreWeights(profile=float(weights[0]), engagement=float(weights[1]), temporal=float(weights[2]))


def _safe_numeric(df: pd.DataFrame, columns: Iterable[str]) -> pd.DataFrame:
    result = df.copy()
    for col in columns:
        result[col] = pd.to_numeric(result[col], errors="coerce").fillna(0)
    return result


def analyze_followers(raw_df: pd.DataFrame) -> list[dict]:
    missing_columns = [col for col in EXPECTED_COLUMNS if col not in raw_df.columns]
    if missing_columns:
        raise ValueError(f"Missing required columns: {', '.join(missing_columns)}")

    df = _safe_numeric(
        raw_df,
        [
            "followers_count",
            "following_count",
            "avg_likes",
            "avg_comments",
            "total_posts",
            "account_age_days",
            "profile_complete",
        ],
    )

    for col in ["influencer_name", "category", "insta_id", "username"]:
        df[col] = df[col].astype(str)

    grouped = df.groupby("insta_id", sort=False)
    results: list[dict] = []

    for insta_id, group in grouped:
        if group.empty:
            continue

        influencer_row = group.iloc[0]
        followers = group.iloc[1:].copy()
        if followers.empty:
            results.append(
                {
                    "influencer_name": influencer_row["influencer_name"],
                    "category": influencer_row["category"],
                    "insta_id": str(insta_id),
                    "total_followers": 0,
                    "genuine_count": 0,
                    "suspicious_count": 0,
                    "bot_count": 0,
                    "credibility_score": 0.0,
                    "status": "Fake",
                    "avg_profile_score": 0.0,
                    "avg_engagement_score": 0.0,
                    "avg_temporal_score": 0.0,
                    "reason": "No follower records found",
                }
            )
            continue

        followers["ratio"] = followers["followers_count"] / (followers["following_count"] + 1)
        followers["engagement_ratio"] = (followers["avg_likes"] + followers["avg_comments"]) / (
            followers["followers_count"] + 1
        )
        followers["activity_rate"] = followers["total_posts"] / (followers["account_age_days"] + 1)

        followers["ratio_norm"] = _min_max(followers["ratio"])
        followers["engagement_norm"] = _min_max(followers["engagement_ratio"])
        followers["age_norm"] = _min_max(followers["account_age_days"])
        followers["activity_norm"] = _min_max(followers["activity_rate"])
        followers["profile_complete_norm"] = _min_max(followers["profile_complete"])

        followers["ProfileScore"] = (
            (1 - followers["ratio_norm"])
            + (1 - followers["age_norm"])
            + (1 - followers["profile_complete_norm"])
        ) / 3
        followers["EngagementScore"] = 1 - followers["engagement_norm"]
        followers["TemporalScore"] = followers["activity_norm"]

        score_matrix = followers[["ProfileScore", "EngagementScore", "TemporalScore"]].to_numpy(dtype=float)
        weights = _entropy_weights(score_matrix)

        followers["RiskScore"] = (
            weights.profile * followers["ProfileScore"]
            + weights.engagement * followers["EngagementScore"]
            + weights.temporal * followers["TemporalScore"]
        )

        conditions = [followers["RiskScore"] < 0.4, followers["RiskScore"] <= 0.7]
        choices = ["Genuine", "Suspicious"]
        followers["class"] = np.select(conditions, choices, default="Bot")

        genuine_count = int((followers["class"] == "Genuine").sum())
        suspicious_count = int((followers["class"] == "Suspicious").sum())
        bot_count = int((followers["class"] == "Bot").sum())
        total_followers = len(followers)

        credibility_score = (genuine_count + 0.5 * suspicious_count) / max(total_followers, 1)
        status = "Genuine" if credibility_score >= 0.6 else "Fake"

        bot_pct = bot_count / total_followers
        avg_eng_score = float(followers["EngagementScore"].mean())
        avg_prof_score = float(followers["ProfileScore"].mean())

        reasons = []
        if avg_eng_score > 0.55:
            reasons.append("Low engagement")
        if bot_pct > 0.3:
            reasons.append("High bot percentage")
        if avg_prof_score > 0.55:
            reasons.append("Poor follower ratio/profile quality")

        reason = ", ".join(reasons) if reasons else "Follower quality appears healthy"

        results.append(
            {
                "influencer_name": influencer_row["influencer_name"],
                "category": influencer_row["category"],
                "insta_id": str(insta_id),
                "total_followers": total_followers,
                "genuine_count": genuine_count,
                "suspicious_count": suspicious_count,
                "bot_count": bot_count,
                "credibility_score": round(float(credibility_score), 4),
                "status": status,
                "avg_profile_score": round(avg_prof_score, 4),
                "avg_engagement_score": round(avg_eng_score, 4),
                "avg_temporal_score": round(float(followers["TemporalScore"].mean()), 4),
                "reason": reason,
            }
        )

    return results
