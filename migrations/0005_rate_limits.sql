CREATE TABLE rate_limits (
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 bucket TEXT NOT NULL, window_start INTEGER NOT NULL, count INTEGER NOT NULL,
 PRIMARY KEY (user_id, bucket, window_start)
);
CREATE INDEX rate_limits_window ON rate_limits(window_start);
