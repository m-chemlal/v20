from slowapi import Limiter
from slowapi.util import get_remote_address
from functools import wraps
from fastapi import Request
from config import settings
import redis
from typing import Optional

# Initialize Redis for rate limiting
redis_client: Optional[redis.Redis] = None

try:
    if settings.redis_url:
        redis_client = redis.from_url(settings.redis_url, decode_responses=True)
except Exception:
    redis_client = None

# Fallback to in-memory limiter if Redis is not available
limiter = Limiter(key_func=get_remote_address, storage_uri=settings.redis_url if redis_client else "memory://")


def get_user_id_from_request(request: Request) -> str:
    """Get user ID from request for user-based rate limiting"""
    # Try to get user from request state (set by auth middleware)
    if hasattr(request.state, "user_id"):
        return str(request.state.user_id)
    return get_remote_address(request)

