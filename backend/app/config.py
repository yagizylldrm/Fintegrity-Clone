import os
from dotenv import load_dotenv

# Find and load the .env file in the backend root directory
backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
dotenv_path = os.path.join(backend_dir, ".env")
load_dotenv(dotenv_path=dotenv_path)

class Settings:
    JWT_SECRET: str = os.getenv("JWT_SECRET", "super-secret-key-change-it-in-production-12345")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440")) # 24 hours
    BLOCKCHAIN_RPC_URL: str = os.getenv("BLOCKCHAIN_RPC_URL", "http://127.0.0.1:8545")
    FINTEGRITY_CORE_ADDRESS: str = os.getenv("FINTEGRITY_CORE_ADDRESS", "0x5FbDB2315678afecb367f032d93F642f64180aa3")
    SMART_AGREEMENTS_ADDRESS: str = os.getenv("SMART_AGREEMENTS_ADDRESS", "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512")
    
settings = Settings()
