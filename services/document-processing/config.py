from pydantic_settings import BaseSettings
class Settings(BaseSettings):
    PORT: int = 8009
    HOST: str = "0.0.0.0"
    SERVICE_NAME: str = "document-processing"
    MAX_FILE_SIZE: int = 10485760  # 10MB
    class Config:
        env_file = ".env"
        extra = "ignore"
settings = Settings()
