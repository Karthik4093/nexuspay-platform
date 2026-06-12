from typing import Dict, List

TAX_RATES: Dict[str, Dict[str, float]] = {
    "US": {"GENERAL": 0.08, "DIGITAL": 0.06, "FOOD": 0.0, "LUXURY": 0.12},
    "GB": {"GENERAL": 0.20, "DIGITAL": 0.20, "FOOD": 0.0, "LUXURY": 0.20},
    "DE": {"GENERAL": 0.19, "DIGITAL": 0.19, "FOOD": 0.07, "LUXURY": 0.19},
    "FR": {"GENERAL": 0.20, "DIGITAL": 0.20, "FOOD": 0.055, "LUXURY": 0.20},
    "CA": {"GENERAL": 0.13, "DIGITAL": 0.13, "FOOD": 0.05, "LUXURY": 0.13},
    "AU": {"GENERAL": 0.10, "DIGITAL": 0.10, "FOOD": 0.0, "LUXURY": 0.10},
    "IN": {"GENERAL": 0.18, "DIGITAL": 0.18, "FOOD": 0.05, "LUXURY": 0.28},
    "JP": {"GENERAL": 0.10, "DIGITAL": 0.10, "FOOD": 0.08, "LUXURY": 0.10},
}
DEFAULT_RATE = 0.10


class TaxService:
    def calculate(self, amount: float, country: str, product_type: str = "GENERAL") -> dict:
        country_rates = TAX_RATES.get(country.upper(), {})
        rate = country_rates.get(product_type.upper(), DEFAULT_RATE)
        tax_amount = round(amount * rate, 4)
        net_amount = round(amount - tax_amount, 4)

        return {
            "taxAmount": tax_amount,
            "taxRate": rate,
            "netAmount": net_amount,
            "breakdown": [{"type": product_type.upper(), "rate": rate, "amount": tax_amount}],
        }

    def get_rates(self, country: str) -> dict:
        return {"country": country, "rates": TAX_RATES.get(country, {"GENERAL": DEFAULT_RATE})}
