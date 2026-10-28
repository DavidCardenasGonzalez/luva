# Repository guidance

For Luba microdrama production or social publishing, read `docs/microdramas/PUBLISHING.md` first. Reuse the existing art and processing scripts, preserve English-only subtitle instructions unless the user changes them, and use the Post for Me API script for authorized publishing rather than the browser.

Never print or persist `POST_FOR_ME_API_KEY`, signed upload URLs, or raw Post for Me post-detail responses. The detail response may include social-account OAuth tokens. After creating a scheduled post, distinguish `scheduled` from successful publication and check each platform result before attempting a retry to avoid duplicate posts.
