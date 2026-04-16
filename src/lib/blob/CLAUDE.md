# Vercel Blob Upload/Delete Module

## Purpose
Provides a typed wrapper around `@vercel/blob` for uploading and deleting video files, with validation for file type and size.

## Public API

### `uploadVideo(file: File): Promise<{ url: string }>`
Uploads a video file to Vercel Blob storage. Validates file type and size before uploading.

### `deleteVideo(url: string): Promise<void>`
Deletes a blob object by its URL.

### Constants
- `ALLOWED_VIDEO_TYPES` — `['video/mp4', 'video/webm', 'video/quicktime']`
- `MAX_FILE_SIZE` — `500 * 1024 * 1024` (500 MB)

## Dependencies
- `@vercel/blob` — `put` and `del` functions

## Validation Rules
- File type must be one of `ALLOWED_VIDEO_TYPES`; otherwise throws `"Invalid file type: {type}. Allowed types: video/mp4, video/webm, video/quicktime"`
- File size must not exceed `MAX_FILE_SIZE`; otherwise throws `"File too large: {size} bytes. Maximum allowed: {MAX_FILE_SIZE} bytes"`

## Test Strategy
- Unit tests with `vi.mock('@vercel/blob')` to mock `put` and `del`
- Test cases: valid upload, invalid type rejection, oversized file rejection, delete delegation, correct `access: 'public'` option
