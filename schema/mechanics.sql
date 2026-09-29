-- =================================================================================
-- AUTO TRIAGE: PRODUCTION DATABASE SCHEMA & INDEXING STRATEGY
-- =================================================================================
-- This schema represents the target Postgres database architecture designed for 
-- high-scale mechanic lookups, replacing the current localStorage MVP.

-- Enable PostGIS for geospatial queries (finding mechanics near a stranded user)
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE mechanics (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    specialization VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    area VARCHAR(255),
    phone VARCHAR(50) UNIQUE NOT NULL,
    whatsapp VARCHAR(50),
    rating DECIMAL(3, 2) DEFAULT 0.00,
    review_count INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    is_platform_user BOOLEAN DEFAULT FALSE,
    availability_status VARCHAR(20) DEFAULT 'open', -- 'open', 'busy', 'offline'
    emoji_avatar VARCHAR(10),
    
    -- Geospatial location (Longitude, Latitude)
    location GEOGRAPHY(POINT, 4326),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =================================================================================
-- 3. SCALING: FAST DATABASE QUERIES (INDEXES)
-- =================================================================================
-- The video emphasized adding proper indexes so the app doesn't slow down
-- as the table grows to thousands or millions of mechanics.

-- 1. Geospatial Index for Lightning-Fast "Near Me" Queries
-- Used when a user needs to find a mechanic within X miles of their breakdown location.
CREATE INDEX idx_mechanics_location ON mechanics USING GIST (location);

-- 2. Compound Index for City & Specialization Lookups
-- Used extensively on the main dashboard to filter mechanics.
-- Creating a compound index makes queries like "WHERE city = 'London' AND specialization = 'Brakes'" incredibly fast.
CREATE INDEX idx_mechanics_city_spec ON mechanics (city, specialization);

-- 3. Index for Verification & Availability Status
-- Ensures we can quickly filter out offline or unverified mechanics without scanning the whole table.
CREATE INDEX idx_mechanics_status ON mechanics (is_verified, availability_status);

-- 4. B-Tree Index for Phone Number Lookups (Fast Authentication / Deduplication)
CREATE UNIQUE INDEX idx_mechanics_phone ON mechanics (phone);

-- =================================================================================
-- Example High-Performance Query (Simulating User Breakdown Search):
-- =================================================================================
/*
SELECT name, phone, specialization, rating 
FROM mechanics 
WHERE is_verified = TRUE 
  AND availability_status = 'open'
  AND specialization = 'Engine Specialist'
  AND ST_DWithin(location, ST_MakePoint(-0.1276, 51.5074)::geography, 10000) -- Within 10km of London
ORDER BY rating DESC 
LIMIT 10;
*/
