# auth/rate_limit.py
from flask import request, abort
from collections import defaultdict
from datetime import datetime, timedelta

_ATTEMPTS: dict[str, list[datetime]] = defaultdict(list)
MAX_ATTEMPTS = 5
WINDOW = timedelta(minutes=10)


def too_many_failures() -> None:
    ip = request.remote_addr or "unknown"
    now = datetime.utcnow()

    # drop old timestamps
    _ATTEMPTS[ip] = [t for t in _ATTEMPTS[ip] if now - t < WINDOW]

    if len(_ATTEMPTS[ip]) >= MAX_ATTEMPTS:
        abort(429, "too many failed admin log‑ins")


def note_failure() -> None:
    ip = request.remote_addr or "unknown"
    _ATTEMPTS[ip].append(datetime.utcnow())
