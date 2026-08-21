-- ==============================================================================
-- DATABASE SCHEMA: USERS & AUTHENTICATION TABLES (PostgreSQL)
-- Includes support for user roles, encrypted password (show password admin), 
-- reset password/username requests, and admin notifications.
-- ==============================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(100) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    username VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    nik VARCHAR(50) NOT NULL UNIQUE,
    department VARCHAR(50) NOT NULL DEFAULT 'general-affairs',
    role VARCHAR(50) NOT NULL DEFAULT 'inspector-ga',
    password_hash VARCHAR(255) NOT NULL,
    encrypted_password TEXT,
    encryption_iv VARCHAR(255),
    encryption_auth_tag VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    checksheets TEXT[] DEFAULT '{}', -- Array key checksheet yang boleh diakses user
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE,
    total_logins INTEGER DEFAULT 0
);

-- Indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_nik ON users(nik);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_checksheets ON users USING GIN(checksheets);

-- Migration script to add checksheets column to existing users table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'checksheets'
    ) THEN
        ALTER TABLE users ADD COLUMN checksheets TEXT[] DEFAULT '{}';
        CREATE INDEX idx_users_checksheets ON users USING GIN(checksheets);
    END IF;
END $$;


-- 2. PASSWORD & USERNAME RESET REQUESTS TABLE
CREATE TABLE IF NOT EXISTS password_reset_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_type VARCHAR(20) NOT NULL DEFAULT 'password' CHECK (request_type IN ('password', 'username')),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'REJECTED', 'COMPLETED')),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours'),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for password_reset_requests
CREATE INDEX IF NOT EXISTS idx_reset_req_user_id ON password_reset_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_reset_req_status ON password_reset_requests(status);


-- 3. ADMIN NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS admin_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE, -- NULL means for all admins
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    reference_id UUID,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for admin_notifications
CREATE INDEX IF NOT EXISTS idx_admin_notif_admin_id ON admin_notifications(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_notif_is_read ON admin_notifications(is_read);

