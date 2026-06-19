-- BeyondCom QR Event Platform - initial schema
-- Enums
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN');

-- users
CREATE TABLE "users" (
  "id"        SERIAL PRIMARY KEY,
  "name"      TEXT NOT NULL,
  "email"     TEXT NOT NULL UNIQUE,
  "password"  TEXT NOT NULL,
  "role"      "UserRole" NOT NULL DEFAULT 'ADMIN',
  "isActive"  BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

-- events
CREATE TABLE "events" (
  "id"           SERIAL PRIMARY KEY,
  "name"         TEXT NOT NULL,
  "slug"         TEXT NOT NULL UNIQUE,
  "description"  TEXT,
  "location"     TEXT,
  "city"         TEXT,
  "startDate"    TIMESTAMP(3),
  "endDate"      TIMESTAMP(3),
  "logo"         TEXT,
  "banner"       TEXT,
  "primaryColor" TEXT,
  "isActive"     BOOLEAN NOT NULL DEFAULT TRUE,
  "createdById"  INTEGER,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL,
  CONSTRAINT "events_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL
);

-- event_links
CREATE TABLE "event_links" (
  "id"        SERIAL PRIMARY KEY,
  "eventId"   INTEGER NOT NULL,
  "title"     TEXT NOT NULL,
  "type"      TEXT NOT NULL,
  "url"       TEXT NOT NULL,
  "icon"      TEXT,
  "color"     TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive"  BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "event_links_eventId_fkey"
    FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE
);

-- scan_logs
CREATE TABLE "scan_logs" (
  "id"         SERIAL PRIMARY KEY,
  "eventId"    INTEGER NOT NULL,
  "ipAddress"  TEXT,
  "userAgent"  TEXT,
  "deviceType" TEXT,
  "browser"    TEXT,
  "os"         TEXT,
  "scannedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "scan_logs_eventId_fkey"
    FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE
);
CREATE INDEX "scan_logs_eventId_idx" ON "scan_logs"("eventId");
CREATE INDEX "scan_logs_scannedAt_idx" ON "scan_logs"("scannedAt");

-- click_logs
CREATE TABLE "click_logs" (
  "id"          SERIAL PRIMARY KEY,
  "eventId"     INTEGER NOT NULL,
  "eventLinkId" INTEGER NOT NULL,
  "ipAddress"   TEXT,
  "userAgent"   TEXT,
  "clickedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "click_logs_eventId_fkey"
    FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE,
  CONSTRAINT "click_logs_eventLinkId_fkey"
    FOREIGN KEY ("eventLinkId") REFERENCES "event_links"("id") ON DELETE CASCADE
);
CREATE INDEX "click_logs_eventId_idx" ON "click_logs"("eventId");
CREATE INDEX "click_logs_eventLinkId_idx" ON "click_logs"("eventLinkId");
CREATE INDEX "click_logs_clickedAt_idx" ON "click_logs"("clickedAt");
