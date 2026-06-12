from pydantic_settings import BaseSettings
class Settings(BaseSettings):
    PORT: int = 8010
    HOST: str = "0.0.0.0"
    SERVICE_NAME: str = "ai-scoring"
    class Config:
        env_file = ".env"
        extra = "ignore"
settings = Settings()
