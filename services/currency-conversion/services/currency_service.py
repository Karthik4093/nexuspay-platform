from datetime import datetime, timezone
from typing import Dict


# Static exchange rates relative to USD (production would use live API)
EXCHANGE_RATES: Dict[str, float] = {
    "USD": 1.0, "EUR": 0.92, "GBP": 0.79, "CAD": 1.35, "AUD": 1.53,
    "JPY": 148.5, "CHF": 0.88, "CNY": 7.18, "INR": 83.1, "SGD": 1.34,
    "HKD": 7.82, "NOK": 10.52, "SEK": 10.41, "DKK": 6.89, "NZD": 1.63,
    "MXN": 17.15, "BRL": 4.97, "ZAR": 18.63, "KRW": 1325.0, "THB": 35.1,
}


class CurrencyService:
    def convert(self, amount: float, from_currency: str, to_currency: str) -> dict:
        from_rate = EXCHANGE_RATES.get(from_currency.upper())
        to_rate = EXCHANGE_RATES.get(to_currency.upper())

        if not from_rate or not to_rate:
            raise ValueError(f"Unsupported currency pair: {from_currency}/{to_currency}")

        rate = to_rate / from_rate
        converted = round(amount * rate, 4)

        return {
            "convertedAmount": converted,
            "rate": round(rate, 6),
            "fromCurrency": from_currency.upper(),
            "toCurrency": to_currency.upper(),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    def get_rates(self, base: str) -> dict:
        base_rate = EXCHANGE_RATES.get(base, 1.0)
        rates = {currency: round(rate / base_rate, 6) for currency, rate in EXCHANGE_RATES.items()}
        return {
            "base": base,
            "rates": rates,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    def get_supported_currencies(self) -> list:
        return sorted(EXCHANGE_RATES.keys())
