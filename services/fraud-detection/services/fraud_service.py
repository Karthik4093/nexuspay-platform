import uuid
import math
from typing import Dict, Any, List


class FraudService:
    """Rule-based fraud detection with ML-style scoring."""

    VELOCITY_THRESHOLD = 5000.0
    HIGH_RISK_COUNTRIES = {"NG", "KP", "IR", "CU", "SY"}
    SUSPICIOUS_AMOUNTS = {999.99, 9999.99, 99.99}

    def check(self, request: Any) -> Dict[str, Any]:
        score = 0.0
        flags: List[str] = []

        # Rule 1: High amount
        if request.amount > self.VELOCITY_THRESHOLD:
            score += 30
            flags.append("HIGH_AMOUNT")

        # Rule 2: Round-number suspicious amounts
        if request.amount in self.SUSPICIOUS_AMOUNTS:
            score += 15
            flags.append("SUSPICIOUS_AMOUNT")

        # Rule 3: High-risk country
        if request.metadata and request.metadata.get("country") in self.HIGH_RISK_COUNTRIES:
            score += 40
            flags.append("HIGH_RISK_COUNTRY")

        # Rule 4: Large amount with no customer
        if request.amount > 1000 and not request.customerId:
            score += 20
            flags.append("ANONYMOUS_HIGH_VALUE")

        # Rule 5: IP-based velocity (simplified)
        if request.ipAddress and request.ipAddress.startswith("10."):
            score += 5

        # Normalize score to 0-100
        score = min(100.0, score)

        risk = self._get_risk_level(score)
        recommendation = self._get_recommendation(score)

        return {
            "score": round(score, 2),
            "risk": risk,
            "recommendation": recommendation,
            "flags": flags,
            "paymentId": request.paymentId,
            "analysisId": str(uuid.uuid4()),
        }

    def _get_risk_level(self, score: float) -> str:
        if score < 20:
            return "LOW"
        elif score < 50:
            return "MEDIUM"
        elif score < 80:
            return "HIGH"
        return "CRITICAL"

    def _get_recommendation(self, score: float) -> str:
        if score < 30:
            return "APPROVE"
        elif score < 70:
            return "REVIEW"
        return "REJECT"

    def get_rules(self) -> List[Dict[str, Any]]:
        return [
            {"name": "HIGH_AMOUNT", "threshold": self.VELOCITY_THRESHOLD, "score_impact": 30},
            {"name": "SUSPICIOUS_AMOUNT", "values": list(self.SUSPICIOUS_AMOUNTS), "score_impact": 15},
            {"name": "HIGH_RISK_COUNTRY", "countries": list(self.HIGH_RISK_COUNTRIES), "score_impact": 40},
            {"name": "ANONYMOUS_HIGH_VALUE", "threshold": 1000, "score_impact": 20},
        ]
