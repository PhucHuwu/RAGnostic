import base64
import hashlib
import hmac
import json
import secrets
from datetime import UTC, datetime, timedelta
from enum import StrEnum
from typing import Any


class UserRole(StrEnum):
    ADMIN = "ADMIN"
    USER = "USER"


class AuthTokenType(StrEnum):
    ACCESS = "access"
    REFRESH = "refresh"


class UserStatus(StrEnum):
    ACTIVE = "ACTIVE"
    LOCKED = "LOCKED"
    DISABLED = "DISABLED"


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _b64url_decode(data: str) -> bytes:
    padding = "=" * ((4 - len(data) % 4) % 4)
    return base64.urlsafe_b64decode((data + padding).encode("ascii"))


def create_token(payload: dict[str, Any], secret: str, expires_in: timedelta) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    now = datetime.now(UTC)
    token_payload = {
        **payload,
        "iat": int(now.timestamp()),
        "exp": int((now + expires_in).timestamp()),
    }
    encoded_header = _b64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    encoded_payload = _b64url_encode(
        json.dumps(token_payload, separators=(",", ":")).encode("utf-8")
    )
    signature_input = f"{encoded_header}.{encoded_payload}".encode("ascii")
    signature = hmac.new(secret.encode("utf-8"), signature_input, hashlib.sha256).digest()
    return f"{encoded_header}.{encoded_payload}.{_b64url_encode(signature)}"


def decode_token(token: str, secret: str) -> dict[str, Any]:
    try:
        encoded_header, encoded_payload, encoded_signature = token.split(".")
    except ValueError as exc:
        raise ValueError("Malformed token") from exc

    signature_input = f"{encoded_header}.{encoded_payload}".encode("ascii")
    expected_signature = hmac.new(secret.encode("utf-8"), signature_input, hashlib.sha256).digest()
    actual_signature = _b64url_decode(encoded_signature)
    if not hmac.compare_digest(expected_signature, actual_signature):
        raise ValueError("Invalid token signature")

    payload = json.loads(_b64url_decode(encoded_payload).decode("utf-8"))
    exp = payload.get("exp")
    if not isinstance(exp, int) or datetime.now(UTC).timestamp() > exp:
        raise ValueError("Token expired")
    return payload


def hash_password(raw_password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256", raw_password.encode("utf-8"), salt.encode("utf-8"), 100_000
    )
    return f"{salt}${digest.hex()}"


def verify_password(raw_password: str, password_hash: str) -> bool:
    try:
        salt, digest_hex = password_hash.split("$", maxsplit=1)
    except ValueError:
        return False
    digest = hashlib.pbkdf2_hmac(
        "sha256", raw_password.encode("utf-8"), salt.encode("utf-8"), 100_000
    )
    return hmac.compare_digest(digest.hex(), digest_hex)
