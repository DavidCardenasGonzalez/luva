#!/usr/bin/env python3
"""Replace a scheduled Post for Me post's thumbnail without rescheduling it."""

from __future__ import annotations

import argparse
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

from publish_microdrama import API_BASE, load_api_key, request_json, upload_media


def put_json(path: str, api_key: str, body: dict) -> dict:
    request = urllib.request.Request(
        API_BASE + path,
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Accept": "application/json",
            "Content-Type": "application/json",
        },
        method="PUT",
    )
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            payload = json.load(response)
    except urllib.error.HTTPError as error:
        raise RuntimeError(f"Post for Me update returned HTTP {error.code}") from None
    except urllib.error.URLError as error:
        raise RuntimeError(f"Could not reach Post for Me ({type(error.reason).__name__})") from None
    if not isinstance(payload, dict):
        raise RuntimeError("Unexpected Post for Me update response")
    return payload


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--post-id", required=True)
    parser.add_argument("--cover", required=True, type=Path)
    args = parser.parse_args()
    if not args.cover.is_file():
        raise RuntimeError(f"Cover file not found: {args.cover}")

    api_key = load_api_key()
    detail = request_json(f"/social-posts/{args.post_id}", api_key)
    post = detail.get("data", detail)
    status = str(post.get("status", "unknown"))
    if status != "scheduled":
        print(f"Post {args.post_id}: {status}; cover unchanged")
        return 0

    media = post.get("media")
    if not isinstance(media, list) or not media:
        raise RuntimeError("Scheduled post has no media to update")

    cover_url = upload_media(args.cover, api_key)
    updated_media = []
    for item in media:
        if not isinstance(item, dict):
            raise RuntimeError("Unexpected media structure")
        updated = dict(item)
        updated["thumbnail_url"] = cover_url
        updated_media.append(updated)

    accounts = post.get("social_accounts", [])
    if not isinstance(accounts, list):
        raise RuntimeError("Unexpected social account structure")
    account_ids = [account.get("id") if isinstance(account, dict) else account for account in accounts]
    if not all(isinstance(account_id, str) and account_id for account_id in account_ids):
        raise RuntimeError("Could not resolve social account IDs")

    body: dict = {
        "caption": post.get("caption", ""),
        "social_accounts": account_ids,
        "scheduled_at": post.get("scheduled_at"),
        "media": updated_media,
    }
    configurations = post.get("platform_configurations")
    if isinstance(configurations, dict):
        updated_configurations = {}
        for platform, configuration in configurations.items():
            if not isinstance(configuration, dict):
                raise RuntimeError("Unexpected platform configuration structure")
            updated_configuration = dict(configuration)
            if "media" in updated_configuration:
                updated_configuration["media"] = updated_media
            updated_configurations[platform] = updated_configuration
        body["platform_configurations"] = updated_configurations

    result = put_json(f"/social-posts/{args.post_id}", api_key, body)
    result_data = result.get("data", result)
    result_status = str(result_data.get("status", "updated"))
    print(f"Post {args.post_id}: {result_status}; official cover updated")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (RuntimeError, ValueError) as error:
        print(f"Error: {error}", file=sys.stderr)
        raise SystemExit(1)
