CREATE TABLE IF NOT EXISTS native_auth_codes (
    codeHash text PRIMARY KEY,
    userId text NOT NULL,
    expiresAt integer NOT NULL,
    usedAt integer
);
