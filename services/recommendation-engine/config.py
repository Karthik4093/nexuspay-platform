from pydantic_settings import BaseSettings
class Settings(BaseSettings):
    PORT: int = 8007
    HOST: str = "0.0.0.0"
    SERVICE_NAME: str = "recommendation-engine"
    class Config:
        env_file = ".env"
        extra = "ignore"
settings = Settings()
