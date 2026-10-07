import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# Provisional business limits (requirement.md section 13; OQ-01, OQ-02, OQ-11) – keep in sync with the frontend constants.
SUBJECT_MAX = 150
DESCRIPTION_MIN = 10
DESCRIPTION_MAX = 5000
COMMENT_MAX = 2000
ATTACHMENT_MAX_BYTES = 5 * 1024 * 1024
ATTACHMENT_EXTENSIONS = {"png", "jpg", "jpeg", "pdf", "txt"}
DEFAULT_PAGE_SIZE = 10
MAX_PAGE_SIZE = 100
RECENT_TICKETS = 5

STATUSES = ["Open", "Assigned", "In Progress", "Resolved", "Closed"]
PRIORITIES = ["Low", "Medium", "High", "Critical"]
FIRST_TICKET_NUMBER = 1001


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me-use-32-plus-characters")
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'helpdesk.db'}")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    TOKEN_TTL_MINUTES = int(os.getenv("TOKEN_TTL_MINUTES", "60"))
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173").split(",")
    UPLOAD_DIR = os.getenv("UPLOAD_DIR", str(BASE_DIR / "uploads"))
    MAX_CONTENT_LENGTH = ATTACHMENT_MAX_BYTES + 512 * 1024  # request overhead; exact file limit checked separately
    JSON_SORT_KEYS = False


class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    SECRET_KEY = "test-secret-key-that-is-long-enough-for-hs256"
