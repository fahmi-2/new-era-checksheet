-- Database Schema for User Presence and Activity Tracking
-- Run this SQL to create the necessary tables in PostgreSQL

-- Table for tracking user online status (heartbeat)
CREATE TABLE IF NOT EXISTS user_presence (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL UNIQUE,
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_online BOOLEAN DEFAULT true,
    ip_address VARCHAR(255),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_presence_user_id ON user_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen ON user_presence(last_seen_at);

-- Table for tracking user activities
CREATE TABLE IF NOT EXISTS user_activities (
    id UUID PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    activity_type VARCHAR(100) NOT NULL,
    activity_category VARCHAR(100) DEFAULT 'general',
    description TEXT,
    ip_address VARCHAR(255),
    user_agent TEXT,
    device_type VARCHAR(50),
    browser_name VARCHAR(100),
    os_name VARCHAR(100),
    page_url TEXT,
    form_slug VARCHAR(255),
    record_id VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_activity_type ON user_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON user_activities(created_at);
CREATE INDEX IF NOT EXISTS idx_user_activities_user_created ON user_activities(user_id, created_at DESC);

-- Enable UUID extension if not exists
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
