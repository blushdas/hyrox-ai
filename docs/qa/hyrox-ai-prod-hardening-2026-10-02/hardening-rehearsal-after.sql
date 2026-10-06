-- Orphans are intentionally removed; provider secrets are intentionally cleared.
PRAGMA defer_foreign_keys = ON;
CREATE TABLE accounts_new (
 id TEXT PRIMARY KEY NOT NULL, userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 type TEXT NOT NULL, provider TEXT NOT NULL, providerAccountId TEXT NOT NULL,
 refresh_token TEXT, access_token TEXT, expires_at NUMBER, token_type TEXT, scope TEXT,
 id_token TEXT, session_state TEXT, oauth_token_secret TEXT, oauth_token TEXT
);
INSERT INTO accounts_new SELECT id, userId, type, provider, providerAccountId,
 NULL, NULL, expires_at, token_type, scope, NULL, NULL, NULL, NULL
 FROM accounts WHERE userId IN (SELECT id FROM users);
DROP TABLE accounts;
ALTER TABLE accounts_new RENAME TO accounts;
CREATE UNIQUE INDEX accounts_provider_identity ON accounts(provider, providerAccountId);
CREATE TABLE sessions_new (
 id TEXT NOT NULL, sessionToken TEXT PRIMARY KEY NOT NULL,
 userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires DATETIME NOT NULL
);
INSERT INTO sessions_new SELECT * FROM sessions WHERE userId IN (SELECT id FROM users);
DROP TABLE sessions;
ALTER TABLE sessions_new RENAME TO sessions;
CREATE TABLE native_auth_codes_new (
 codeHash TEXT PRIMARY KEY, userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 expiresAt INTEGER NOT NULL, usedAt INTEGER, codeChallenge TEXT
);
-- Existing codes lack PKCE and will be burned/rejected on exchange.
INSERT INTO native_auth_codes_new SELECT codeHash,userId,expiresAt,usedAt,NULL
 FROM native_auth_codes WHERE userId IN (SELECT id FROM users);
DROP TABLE native_auth_codes;
ALTER TABLE native_auth_codes_new RENAME TO native_auth_codes;
CREATE TABLE rate_limits (
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 bucket TEXT NOT NULL, window_start INTEGER NOT NULL, count INTEGER NOT NULL,
 PRIMARY KEY (user_id, bucket, window_start)
);
CREATE INDEX rate_limits_window ON rate_limits(window_start);
