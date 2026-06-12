from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PORT: int = 8001
    HOST: str = "0.0.0.0"
    LOG_LEVEL: str = "info"
    SERVICE_NAME: str = "fraud-detection"
    OTEL_ENABLED: bool = False
    OTEL_EXPORTER_OTLP_ENDPOINT: str = "http://localhost:4318"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
