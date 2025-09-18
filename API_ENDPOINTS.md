# API Endpoints Documentation

Generated on: 2025-08-07T21:01:50.742Z

Total Endpoints: 58

## Table of Contents

- [Activity](#activity)
- [Analytics](#analytics)
- [Assets](#assets)
- [Auth](#auth)
- [Categories](#categories)
- [Collections](#collections)
- [Notifications](#notifications)
- [Placeholder](#placeholder)
- [Profile](#profile)
- [Reviews](#reviews)
- [Search](#search)
- [Share](#share)
- [System](#system)
- [Tags](#tags)
- [Users](#users)

---

## Activity

### `/api/activity`
- **Methods:** GET
- **Auth Required:** ✅ Yes
- **File:** `/src/app/api/activity/route.ts`
- **Description:** GET /api/activity - Get activity feed

### `/api/activity/export`
- **Methods:** GET
- **Auth Required:** ✅ Yes
- **File:** `/src/app/api/activity/export/route.ts`
- **Description:** GET /api/activity/export - Export activity log (admin only)

## Analytics

### `/api/analytics/file-types`
- **Methods:** GET
- **Auth Required:** ✅ Yes
- **File:** `/src/app/api/analytics/file-types/route.ts`
- **Description:** GET /api/analytics/file-types - Distribution by file type

### `/api/analytics/overview`
- **Methods:** GET
- **Auth Required:** ✅ Yes
- **File:** `/src/app/api/analytics/overview/route.ts`
- **Description:** GET /api/analytics/overview - Dashboard statistics

### `/api/analytics/top-content`
- **Methods:** GET
- **Auth Required:** ✅ Yes
- **File:** `/src/app/api/analytics/top-content/route.ts`
- **Description:** GET /api/analytics/top-content - Most popular assets

### `/api/analytics/trends`
- **Methods:** GET
- **Auth Required:** ✅ Yes
- **File:** `/src/app/api/analytics/trends/route.ts`
- **Description:** GET /api/analytics/trends - Time-based trends

## Assets

### `/api/assets`
- **Methods:** GET
- **Auth Required:** ❌ No
- **File:** `/src/app/api/assets/route.ts`
- **Description:** GET /api/assets - List assets with filters (public endpoint with optional auth)

### `/api/assets/:id`
- **Methods:** GET, DELETE, PATCH
- **Auth Required:** ✅ Yes
- **File:** `/src/app/api/assets/[id]/route.ts`
- **Description:** GET /api/assets/:id - Get single asset details

### `/api/assets/:id/activity`
- **Methods:** GET
- **Auth Required:** ✅ Yes
- **File:** `/src/app/api/assets/[id]/activity/route.ts`
- **Description:** GET /api/assets/:id/activity - Asset activity log

### `/api/assets/:id/analytics`
- **Methods:** GET
- **Auth Required:** ✅ Yes
- **File:** `/src/app/api/assets/[id]/analytics/route.ts`
- **Description:** GET /api/assets/:id/analytics - Individual asset analytics

### `/api/assets/:id/download`
- **Methods:** GET
- **Auth Required:** ✅ Yes
- **File:** `/src/app/api/assets/[id]/download/route.ts`
- **Description:** GET /api/assets/:id/download - Generate secure download URL

### `/api/assets/:id/share`
- **Methods:** GET, POST
- **Auth Required:** ✅ Yes
- **File:** `/src/app/api/assets/[id]/share/route.ts`
- **Description:** POST /api/assets/:id/share - Create shareable link

### `/api/assets/:id/submit-review`
- **Methods:** POST
- **Auth Required:** ✅ Yes
- **File:** `/src/app/api/assets/[id]/submit-review/route.ts`
- **Description:** POST /api/assets/:id/submit-review - Submit asset for review

### `/api/assets/:id/view`
- **Methods:** POST
- **Auth Required:** ❌ No
- **File:** `/src/app/api/assets/[id]/view/route.ts`
- **Description:** POST /api/assets/:id/view - Track asset view

### `/api/assets/batch-download`
- **Methods:** POST
- **Auth Required:** ✅ Yes
- **File:** `/src/app/api/assets/batch-download/route.ts`
- **Description:** Check auth before trying to parse body

### `/api/assets/upload/batch`
- **Methods:** POST
- **Auth Required:** ✅ Yes
- **File:** `/src/app/api/assets/upload/batch/route.ts`
- **Description:** Check authentication

### `/api/assets/upload/complete`
- **Methods:** POST
- **Auth Required:** ✅ Yes
- **File:** `/src/app/api/assets/upload/complete/route.ts`
- **Description:** Check authentication

### `/api/assets/upload/prepare`
- **Methods:** POST
- **Auth Required:** ✅ Yes
- **File:** `/src/app/api/assets/upload/prepare/route.ts`
- **Description:** Check authentication

## Auth

### `/api/auth/forgot-password`
- **Methods:** POST
- **Auth Required:** ❌ No
- **File:** `/src/app/api/auth/forgot-password/route.ts`
- **Description:** Apply rate limiting to prevent abuse

### `/api/auth/register`
- **Methods:** POST
- **Auth Required:** ❌ No
- **File:** `/src/app/api/auth/register/route.ts`
- **Description:** Apply rate limiting

### `/api/auth/reset-password`
- **Methods:** GET, POST
- **Auth Required:** ❌ No
- **File:** `/src/app/api/auth/reset-password/route.ts`
- **Description:** Validate password strength

## Categories

### `/api/categories/stats`
- **Methods:** GET
- **Auth Required:** ✅ Yes
- **File:** `/src/app/api/categories/stats/route.ts`
- **Description:** Require authentication for category stats

## Collections

### `/api/collections`
- **Methods:** GET, POST
- **Auth Required:** ✅ Yes
- **File:** `/src/app/api/collections/route.ts`
- **Description:** GET /api/collections - List user's collections

### `/api/collections/:id`
- **Methods:** GET, DELETE, PATCH
- **Auth Required:** ✅ Yes
- **File:** `/src/app/api/collections/[id]/route.ts`
- **Description:** GET /api/collections/:id - Get collection details with assets

### `/api/collections/:id/assets`
- **Methods:** POST, DELETE
- **Auth Required:** ✅ Yes
- **File:** `/src/app/api/collections/[id]/assets/route.ts`
- **Description:** POST /api/collections/:id/assets - Add assets to collection

### `/api/collections/:id/assets/:assetId`
- **Methods:** DELETE
- **Auth Required:** ✅ Yes
- **File:** `/src/app/api/collections/[id]/assets/[assetId]/route.ts`
- **Description:** DELETE /api/collections/:id/assets/:assetId - Remove single asset from collection

### `/api/collections/:id/pin`
- **Methods:** POST
- **Auth Required:** ✅ Yes
- **File:** `/src/app/api/collections/[id]/pin/route.ts`
- **Description:** POST /api/collections/:id/pin - Pin/unpin collection

## Notifications

### `/api/notifications`
- **Methods:** GET
- **Auth Required:** ✅ Yes
- **File:** `/src/app/api/notifications/route.ts`
- **Description:** GET /api/notifications - Get user notifications

### `/api/notifications/:id`
- **Methods:** DELETE
- **Auth Required:** ✅ Yes
- **File:** `/src/app/api/notifications/[id]/route.ts`
- **Description:** DELETE /api/notifications/:id - Delete notification

### `/api/notifications/:id/read`
- **Methods:** PATCH
- **Auth Required:** ✅ Yes
- **File:** `/src/app/api/notifications/[id]/read/route.ts`
- **Description:** PATCH /api/notifications/:id/read - Mark notification as read

### `/api/notifications/mark-all-read`
- **Methods:** POST
- **Auth Required:** ✅ Yes
- **File:** `/src/app/api/notifications/mark-all-read/route.ts`
- **Description:** POST /api/notifications/mark-all-read - Mark all notifications as read

### `/api/notifications/preferences`
- **Methods:** GET, PATCH
- **Auth Required:** ✅ Yes
- **File:** `/src/app/api/notifications/preferences/route.ts`
- **Description:** GET /api/notifications/preferences - Get notification settings

## Placeholder

### `/api/placeholder/:width/:height`
- **Methods:** GET
- **Auth Required:** ❌ No
- **File:** `/src/app/api/placeholder/[width]/[height]/route.ts`
- **Description:** Generate a simple SVG placeholder

## Profile

### `/api/profile`
- **Methods:** GET, PATCH
- **Auth Required:** ✅ Yes
- **File:** `/src/app/api/profile/route.ts`
- **Description:** GET /api/profile - Get current user profile

### `/api/profile/activity`
- **Methods:** GET
- **Auth Required:** ✅ Yes
- **File:** `/src/app/api/profile/activity/route.ts`
- **Description:** GET /api/profile/activity - Get user's activity history

### `/api/profile/avatar`
- **Methods:** POST, PUT, DELETE
- **Auth Required:** ✅ Yes
- **File:** `/src/app/api/profile/avatar/route.ts`
- **Description:** POST /api/profile/avatar - Upload profile picture

### `/api/profile/uploads`
- **Methods:** GET
- **Auth Required:** ✅ Yes
- **File:** `/src/app/api/profile/uploads/route.ts`
- **Description:** GET /api/profile/uploads - Get user's uploaded assets

## Reviews

### `/api/reviews/:id`
- **Methods:** GET
- **Auth Required:** ✅ Yes
- **File:** `/src/app/api/reviews/[id]/route.ts`
- **Description:** GET /api/reviews/:id - Get review details

### `/api/reviews/:id/approve`
- **Methods:** POST
- **Auth Required:** ✅ Yes
- **File:** `/src/app/api/reviews/[id]/approve/route.ts`
- **Description:** POST /api/reviews/:id/approve - Approve asset

### `/api/reviews/:id/reject`
- **Methods:** POST
- **Auth Required:** ✅ Yes
- **File:** `/src/app/api/reviews/[id]/reject/route.ts`
- **Description:** POST /api/reviews/:id/reject - Reject asset

### `/api/reviews/:id/request-changes`
- **Methods:** POST
- **Auth Required:** ✅ Yes
- **File:** `/src/app/api/reviews/[id]/request-changes/route.ts`
- **Description:** POST /api/reviews/:id/request-changes - Request changes for asset

### `/api/reviews/pending`
- **Methods:** GET
- **Auth Required:** ✅ Yes
- **File:** `/src/app/api/reviews/pending/route.ts`
- **Description:** GET /api/reviews/pending - Get pending reviews for current reviewer

## Search

### `/api/search`
- **Methods:** GET
- **Auth Required:** ❌ No
- **File:** `/src/app/api/search/route.ts`
- **Description:** GET /api/search - Global search endpoint (public with optional auth)

### `/api/search/advanced`
- **Methods:** POST
- **Auth Required:** ✅ Yes
- **File:** `/src/app/api/search/advanced/route.ts`
- **Description:** Basic filters

### `/api/search/suggestions`
- **Methods:** GET
- **Auth Required:** ✅ Yes
- **File:** `/src/app/api/search/suggestions/route.ts`
- **Description:** GET /api/search/suggestions - Search autocomplete

## Share

### `/api/share/:token`
- **Methods:** GET, DELETE
- **Auth Required:** ❌ No
- **File:** `/src/app/api/share/[token]/route.ts`
- **Description:** GET /api/share/:token - Access shared asset (public endpoint)

### `/api/share/:token/download`
- **Methods:** POST
- **Auth Required:** ❌ No
- **File:** `/src/app/api/share/[token]/download/route.ts`
- **Description:** POST /api/share/:token/download - Track download and get fresh URL

### `/api/share/:token/verify`
- **Methods:** POST
- **Auth Required:** ❌ No
- **File:** `/src/app/api/share/[token]/verify/route.ts`
- **Description:** POST /api/share/:token/verify - Verify share password

## System

### `/api/system/errors`
- **Methods:** GET
- **Auth Required:** ✅ Yes
- **File:** `/src/app/api/system/errors/route.ts`
- **Description:** GET /api/system/errors - Recent system errors (admin only)

### `/api/system/health`
- **Methods:** GET
- **Auth Required:** ❌ No
- **File:** `/src/app/api/system/health/route.ts`
- **Description:** GET /api/system/health - Public health check endpoint

### `/api/system/jobs`
- **Methods:** GET
- **Auth Required:** ✅ Yes
- **File:** `/src/app/api/system/jobs/route.ts`
- **Description:** GET /api/system/jobs - Job queue status (admin only)

### `/api/system/metrics`
- **Methods:** GET
- **Auth Required:** ✅ Yes
- **File:** `/src/app/api/system/metrics/route.ts`
- **Description:** GET /api/system/metrics - System metrics (admin only)

## Tags

### `/api/tags`
- **Methods:** GET, POST
- **Auth Required:** ✅ Yes
- **File:** `/src/app/api/tags/route.ts`
- **Description:** GET /api/tags - List all tags with categories

### `/api/tags/:id`
- **Methods:** PUT, DELETE
- **Auth Required:** ✅ Yes
- **File:** `/src/app/api/tags/[id]/route.ts`
- **Description:** PUT /api/tags/:id - Update tag

### `/api/tags/suggestions`
- **Methods:** GET, POST
- **Auth Required:** ✅ Yes
- **File:** `/src/app/api/tags/suggestions/route.ts`
- **Description:** GET /api/tags/suggestions - Get tag suggestions based on content

## Users

### `/api/users`
- **Methods:** GET
- **Auth Required:** ✅ Yes
- **File:** `/src/app/api/users/route.ts`
- **Description:** GET /api/users - List users (admin only)

### `/api/users/:id`
- **Methods:** GET, DELETE, PATCH
- **Auth Required:** ✅ Yes
- **File:** `/src/app/api/users/[id]/route.ts`
- **Description:** GET /api/users/:id - Get user details

### `/api/users/:id/activate`
- **Methods:** POST
- **Auth Required:** ✅ Yes
- **File:** `/src/app/api/users/[id]/activate/route.ts`
- **Description:** POST /api/users/:id/activate - Activate/deactivate user

