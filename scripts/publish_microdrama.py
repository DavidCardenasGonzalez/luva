#!/usr/bin/env python3
"""Upload a finished microdrama and schedule it through the Post for Me API."""

from __future__ import annotations

import argparse
import json
import mimetypes
import os
import sys
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo


ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / "scripts" / "environment.local.json"
API_BASE = "https://api.postforme.dev/v1"
LOCAL_TZ = ZoneInfo("America/Cancun")
TARGETS = {
    "instagram": "luva.ingles",
    "tiktok": "luva",
    "youtube": "luva ingles",
}


class PublishError(Exception):
    pass


def request_json(path: str, api_key: str, body: dict | None = None) -> dict:
    headers = {"Authorization": f"Bearer {api_key}", "Accept": "application/json"}
    data = None
    method = "GET"
    if body is not None:
        headers["Content-Type"] = "application/json"
        data = json.dumps(body).encode("utf-8")
        method = "POST"
    request = urllib.request.Request(API_BASE + path, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            payload = json.load(response)
    except urllib.error.HTTPError as error:
        # Do not print response bodies: API responses may contain credentials.
        raise PublishError(f"Post for Me API returned HTTP {error.code} for {method} {path}") from None
    except urllib.error.URLError as error:
        raise PublishError(f"Could not reach Post for Me ({type(error.reason).__name__})") from None
    if not isinstance(payload, dict):
        raise PublishError(f"Unexpected response from Post for Me for {path}")
    return payload


def load_api_key() -> str:
    if not CONFIG.is_file():
        raise PublishError(f"Missing {CONFIG.relative_to(ROOT)}")
    try:
        config = json.loads(CONFIG.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        raise PublishError("Could not read scripts/environment.local.json") from None
    api_key = config.get("POST_FOR_ME_API_KEY")
    if not isinstance(api_key, str) or not api_key.strip():
        raise PublishError("POST_FOR_ME_API_KEY is missing from scripts/environment.local.json")
    return api_key.strip()


def resolve_accounts(api_key: str, platforms: list[str]) -> tuple[list[str], list[str]]:
    response = request_json("/social-accounts", api_key)
    items = response.get("data", [])
    if not isinstance(items, list):
        raise PublishError("Unexpected social account list from Post for Me")
    by_platform: dict[str, dict] = {}
    for item in items:
        platform = str(item.get("platform", "")).lower()
        username = str(item.get("username", "")).strip().lower()
        status = str(item.get("status", "connected")).lower()
        if platform in platforms and username == TARGETS[platform] and status == "connected":
            by_platform[platform] = item

    missing = [platform for platform in platforms if platform not in by_platform]
    if missing:
        raise PublishError(
            "Missing connected Luba account(s): " + ", ".join(missing)
            + ". Reconnect the account in Post for Me, then retry."
        )
    ordered = [by_platform[name]["id"] for name in platforms]
    names = [f"{name} ({TARGETS[name]})" for name in platforms]
    return ordered, names


def upload_media(path: Path, api_key: str) -> str:
    content_type = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
    response = request_json("/media/create-upload-url", api_key, {"content_type": content_type})
    response = response.get("data", response)
    upload_url = response.get("upload_url")
    media_url = response.get("media_url")
    if not upload_url or not media_url:
        raise PublishError("Post for Me did not return a media upload URL")
    request = urllib.request.Request(
        upload_url,
        data=path.read_bytes(),
        headers={"Content-Type": content_type},
        method="PUT",
    )
    try:
        with urllib.request.urlopen(request, timeout=240) as response:
            if response.status not in (200, 201, 204):
                raise PublishError(f"Media upload returned HTTP {response.status}")
    except urllib.error.HTTPError as error:
        raise PublishError(f"Media upload returned HTTP {error.code}") from None
    except urllib.error.URLError as error:
        raise PublishError(f"Media upload failed ({type(error.reason).__name__})") from None
    return media_url


def scheduled_time(args: argparse.Namespace) -> datetime | None:
    if args.now:
        return None
    if args.in_minutes is not None:
        if args.in_minutes < 2:
            raise PublishError("Schedule at least 2 minutes in the future")
        return (datetime.now(LOCAL_TZ) + timedelta(minutes=args.in_minutes)).replace(microsecond=0)
    try:
        value = datetime.fromisoformat(args.at)
    except ValueError:
        raise PublishError("--at must be ISO 8601, for example 2026-10-26T08:00:00-05:00") from None
    if value.tzinfo is None:
        raise PublishError("--at needs a timezone offset; use the America/Cancun offset, normally -05:00")
    if value.astimezone(timezone.utc) < datetime.now(timezone.utc) + timedelta(minutes=2):
        raise PublishError("--at must be at least 2 minutes in the future")
    return value


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--video", required=True, type=Path, help="Finished MP4 to post")
    parser.add_argument("--cover", required=True, type=Path, help="Chapter cover image")
    parser.add_argument("--chapter", required=True, type=int)
    parser.add_argument(
        "--platforms", nargs="+", choices=tuple(TARGETS), default=list(TARGETS),
        help="Connected Luba destinations (default: instagram tiktok youtube)",
    )
    timing = parser.add_mutually_exclusive_group(required=True)
    timing.add_argument("--in-minutes", type=int, help="Schedule this many minutes from now")
    timing.add_argument("--at", help="Schedule at an ISO 8601 date-time with timezone")
    timing.add_argument("--now", action="store_true", help="Publish as soon as processing permits")
    parser.add_argument("--caption", help="Override the standard It's a Date caption")
    args = parser.parse_args()

    video = args.video if args.video.is_absolute() else ROOT / args.video
    cover = args.cover if args.cover.is_absolute() else ROOT / args.cover
    for asset in (video, cover):
        if not asset.is_file():
            raise PublishError(f"File not found: {asset}")
    if args.chapter < 1:
        raise PublishError("Chapter number must be a positive integer")
    when = scheduled_time(args)
    caption = args.caption or f"It's a Date! — Chapter {args.chapter} 💕 A love story in two languages."

    api_key = load_api_key()
    account_ids, account_names = resolve_accounts(api_key, args.platforms)
    print("Connected targets: " + ", ".join(account_names), flush=True)
    print("Uploading video and chapter cover…", flush=True)
    video_url = upload_media(video, api_key)
    cover_url = upload_media(cover, api_key)
    media = [{"url": video_url, "thumbnail_url": cover_url}]

    configurations = {
        platform: {"caption": None, "media": media}
        for platform in args.platforms
    }
    if "instagram" in configurations:
        configurations["instagram"]["placement"] = "reels"
    payload: dict = {
        "caption": caption,
        "social_accounts": account_ids,
        "media": media,
        "platform_configurations": configurations,
    }
    if when is not None:
        payload["scheduled_at"] = when.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")

    result = request_json("/social-posts", api_key, payload)
    result = result.get("data", result)
    post_id = result.get("id")
    status = result.get("status", "unknown")
    if when is None:
        print(f"Post {post_id}: {status} (publish now)")
    else:
        local = when.astimezone(LOCAL_TZ).strftime("%Y-%m-%d %H:%M %Z")
        print(f"Post {post_id}: {status}; scheduled for {local}")
    print("Caption: " + caption)
    print("Check each platform's result in Post for Me after the scheduled time.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except PublishError as error:
        print(f"Error: {error}", file=sys.stderr)
        raise SystemExit(1)
