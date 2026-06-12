from pydantic_settings import BaseSettings
class Settings(BaseSettings):
    PORT: int = 8005
    HOST: str = "0.0.0.0"
    SERVICE_NAME: str = "report-generation"
    class Config:
        env_file = ".env"
        extra = "ignore"
settings = Settings()
