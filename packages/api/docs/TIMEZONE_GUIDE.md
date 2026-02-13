# DB Timezone Handling Guide

This document describes how datetime fields are handled in the project after the Prisma migration.

## Overview

- **DB storage**: KST (Asia/Seoul, UTC+9) — MySQL stores datetimes without timezone info, values are in KST
- **Server runtime**: `TZ=UTC` — Node.js interprets `new Date()` as UTC
- **Prisma Proxy**: Automatically converts between UTC (app) and KST (DB)
- **API responses**: Standard UTC ISO 8601 strings (ending in `Z`)
- **Frontend**: Receives UTC dates, always displays in KST (`Asia/Seoul`) regardless of user's local timezone

## How It Works — Backend

The `PrismaService` (`src/prisma/prisma.service.ts`) implements a Proxy that intercepts all Prisma model delegate access and `$transaction`:

### Write operations (create, update, upsert)
- Date values are shifted **+9 hours** before being sent to the DB
- This converts UTC dates from the application to KST for DB storage

### Read operations (query results)
- Date values in results are shifted **-9 hours** after being read from the DB
- This converts KST dates from the DB back to UTC for the application

### Where clauses
- Date values in `where` conditions are shifted **+9 hours**
- This ensures date comparisons work correctly against KST-stored data

### Proxy implementation notes
- Uses `target[prop]` (not `Reflect.get(target, prop, receiver)`) — Prisma lazy getters break with `receiver`
- `$transaction` is also overridden to wrap the transaction client in the same Proxy

## Rules for Backend Developers

### Use `new Date()` for current time
```typescript
const now = new Date(); // UTC — Proxy handles conversion
```

### Do NOT use any manual timezone conversion
All of the following functions have been removed:
- ~~`getKSTDate()`~~ → Use `new Date()`
- ~~`makeObjectPropsToDBTimezone()`~~ → Handled by Proxy
- ~~`makeObjectPropsFromDBTimezone()`~~ → Handled by Proxy
- ~~`convertDateFieldsToISO()`~~ → No longer needed
- ~~`makeObjectPropsFromDBTimezoneAsISO()`~~ → No longer needed

### Repository pattern
```typescript
// Simple CRUD — use Prisma typed API
const result = await this.prisma.activity.findMany({
  where: { clubId, deletedAt: null },
});

// Complex queries — use raw SQL
const results = await this.prisma.$queryRaw`
  SELECT a.id, a.name FROM activity a
  WHERE a.club_id = ${clubId}
`;
```

### Transactions
```typescript
// Prisma transactions auto-rollback on throw
await this.prisma.$transaction(async tx => {
  const result = await tx.activity.create({ data: {...} });
  if (!result) {
    throw new Error("Creation failed"); // auto-rollback
  }
});
```

### Raw SQL and timezone
For `$queryRaw` / `$executeRaw`, the Proxy does NOT apply.
Date values in raw SQL results and parameters are NOT automatically converted.
If your raw query returns Date columns, be aware they will be in KST.

## How It Works — Frontend

The frontend always displays dates in **KST (Asia/Seoul)** regardless of the user's browser timezone. This is achieved through three layers:

### 1. Centralized format functions (`packages/web/src/utils/Date/formatDate.ts`)

All 13 format functions use `formatInTimeZone` from `date-fns-tz`:

```typescript
import { formatInTimeZone } from "date-fns-tz";
import { ko } from "date-fns/locale";

// Example: formatDate, formatDateTime, formatMonth, etc.
export const formatDate = (date: Date) =>
  formatInTimeZone(date, "Asia/Seoul", "yyyy년 M월 d일", { locale: ko });
```

~50 consumer files automatically get KST formatting through these utilities.

### 2. Date extraction utilities

- `getKSTDate.ts` — `getLocalDateOnly()` and `getLocalDateLastTime()` use `toZonedTime()` to extract KST date components
- `extractDate.ts` — `getActualYear()` and `getActualMonth()` use `toZonedTime()` for KST year/month

```typescript
import { toZonedTime } from "date-fns-tz";

const kstDate = toZonedTime(date, "Asia/Seoul");
const year = kstDate.getFullYear();
const month = kstDate.getMonth();
```

### 3. Axios date handling (`packages/web/src/lib/axios.ts`)

- **Response**: Parses ISO date strings (ending in `Z`) to `Date` objects
- **Request**: Serializes `Date` objects back to ISO strings

## Rules for Frontend Developers

### Use `formatInTimeZone` for new date formatting

```typescript
import { formatInTimeZone } from "date-fns-tz";
import { ko } from "date-fns/locale";

// Correct
formatInTimeZone(date, "Asia/Seoul", "yyyy-MM-dd (ccc)", { locale: ko });

// WRONG — uses browser's local timezone
import { format } from "date-fns";
format(date, "yyyy-MM-dd (ccc)", { locale: ko });
```

### Prefer the centralized formatDate utilities

```typescript
import { formatDate, formatDateTime } from "@sparcs-clubs/web/utils/Date/formatDate";

// These already use Asia/Seoul timezone internally
formatDate(someDate);      // "2026년 2월 14일"
formatDateTime(someDate);  // "2026년 2월 14일 15:30"
```

### Use `toZonedTime` when extracting date components

```typescript
import { toZonedTime } from "date-fns-tz";

// Correct — extracts KST date parts
const kst = toZonedTime(date, "Asia/Seoul");
const year = kst.getFullYear();
const month = kst.getMonth() + 1;
const day = kst.getDate();

// WRONG — uses browser's local timezone
const year = date.getFullYear();
```

### Use `timeZone` option with `toLocaleDateString` / `toLocaleTimeString`

```typescript
// Correct
date.toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" });
date.toLocaleTimeString("ko-KR", { timeZone: "Asia/Seoul" });

// WRONG — uses browser's local timezone
date.toLocaleDateString();
date.toLocaleTimeString();
```

### Do NOT use `format` or `formatDate` from `date-fns` directly

```typescript
// WRONG — these use browser local timezone
import { format, formatDate } from "date-fns";
format(date, "yyyy-MM-dd");
formatDate(date, "yyyy-MM-dd", { locale: ko });

// Correct — always specify Asia/Seoul
import { formatInTimeZone } from "date-fns-tz";
formatInTimeZone(date, "Asia/Seoul", "yyyy-MM-dd");
```

## Architecture

```
Frontend (always displays KST via date-fns-tz)
    ↕ ISO 8601 UTC strings
API Server (TZ=UTC)
    ↕ Prisma Proxy (+9h write, -9h read)
MySQL DB (KST datetimes, no TZ info)
```

## Key Files

### Backend
- `src/prisma/prisma.service.ts` — PrismaService with timezone Proxy
- `src/prisma/prisma.module.ts` — Global NestJS module
- `prisma/schema.prisma` — Complete database schema

### Frontend
- `packages/web/src/utils/Date/formatDate.ts` — 13 centralized format functions (all use `formatInTimeZone`)
- `packages/web/src/utils/Date/getKSTDate.ts` — `getLocalDateOnly`, `getLocalDateLastTime` (use `toZonedTime`)
- `packages/web/src/utils/Date/extractDate.ts` — `getActualYear`, `getActualMonth` (use `toZonedTime`)
- `packages/web/src/lib/axios.ts` — ISO string ↔ Date object conversion
- `packages/interface/src/common/util.ts` — Zod schema date preprocessor
