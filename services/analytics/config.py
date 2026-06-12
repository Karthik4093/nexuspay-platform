from pydantic_settings import BaseSettings
class Settings(BaseSettings):
    PORT: int = 8006
    HOST: str = "0.0.0.0"
    SERVICE_NAME: str = "analytics"
    class Config:
        env_file = ".env"
        extra = "ignore"
settings = Settings()
