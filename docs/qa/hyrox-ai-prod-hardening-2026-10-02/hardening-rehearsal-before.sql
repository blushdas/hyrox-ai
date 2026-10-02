CREATE TABLE IF NOT EXISTS "accounts" (
    "id" text NOT NULL,
    "userId" text NOT NULL DEFAULT NULL,
    "type" text NOT NULL DEFAULT NULL,
    "provider" text NOT NULL DEFAULT NULL,
    "providerAccountId" text NOT NULL DEFAULT NULL,
    "refresh_token" text DEFAULT NULL,
    "access_token" text DEFAULT NULL,
    "expires_at" number DEFAULT NULL,
    "token_type" text DEFAULT NULL,
    "scope" text DEFAULT NULL,
    "id_token" text DEFAULT NULL,
    "session_state" text DEFAULT NULL,
    "oauth_token_secret" text DEFAULT NULL,
    "oauth_token" text DEFAULT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS "sessions" (
    "id" text NOT NULL,
    "sessionToken" text NOT NULL,
    "userId" text NOT NULL DEFAULT NULL,
    "expires" datetime NOT NULL DEFAULT NULL,
    PRIMARY KEY (sessionToken)
);

CREATE TABLE IF NOT EXISTS "users" (
    "id" text NOT NULL DEFAULT '',
    "name" text DEFAULT NULL,
    "email" text DEFAULT NULL,
    "emailVerified" datetime DEFAULT NULL,
    "image" text DEFAULT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS "verification_tokens" (
    "identifier" text NOT NULL,
    "token" text NOT NULL DEFAULT NULL,
    "expires" datetime NOT NULL DEFAULT NULL,
    PRIMARY KEY (token)
);

-- Enforce one account per provider identity (required by the handoff).
CREATE UNIQUE INDEX IF NOT EXISTS accounts_provider_identity ON accounts(provider, providerAccountId);
CREATE TABLE IF NOT EXISTS native_auth_codes (
    codeHash text PRIMARY KEY,
    userId text NOT NULL,
    expiresAt integer NOT NULL,
    usedAt integer
);
CREATE TABLE IF NOT EXISTS athlete_profiles (
 user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 race_date TEXT NOT NULL, location TEXT NOT NULL, category TEXT NOT NULL CHECK(category IN ('open','pro','doubles')),
 fitness_level TEXT NOT NULL CHECK(fitness_level IN ('beginner_low','beginner_mid','beginner_high')),
 five_k_sec INTEGER, ten_k_sec INTEGER, hyrox_sec INTEGER, age INTEGER, gender TEXT NOT NULL,
 weight_kg REAL, weight_unit TEXT NOT NULL CHECK(weight_unit IN ('kg','lbs')),
 days_per_week INTEGER NOT NULL CHECK(days_per_week IN (3,4,5)),
 session_length_min INTEGER NOT NULL CHECK(session_length_min IN (45,60,75,90)),
 onboarding_completed_at INTEGER, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS training_plans (
 id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 status TEXT NOT NULL CHECK(status IN ('active','archived')), source TEXT NOT NULL CHECK(source IN ('template','ai','pdf')),
 template_id TEXT, total_weeks INTEGER NOT NULL, race_date TEXT NOT NULL, start_date TEXT, created_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS one_active_plan ON training_plans(user_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS plans_user_created ON training_plans(user_id, created_at);
CREATE TABLE IF NOT EXISTS plan_sessions (
 id TEXT PRIMARY KEY, plan_id TEXT NOT NULL REFERENCES training_plans(id) ON DELETE CASCADE,
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, session_key TEXT NOT NULL,
 week INTEGER NOT NULL, day INTEGER NOT NULL,
 type TEXT NOT NULL CHECK(type IN ('engine_builder','threshold','stations','race_sim','recovery','rest')),
 phase TEXT NOT NULL CHECK(phase IN ('foundation','base','build','peak','taper')),
 title TEXT NOT NULL, duration TEXT NOT NULL, warmup TEXT NOT NULL, main_set TEXT NOT NULL, cooldown TEXT NOT NULL, coach_note TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','completed','skipped')), completed_at INTEGER,
 -- Required to round-trip WeekPlan metadata without guessing from sessions.
 phase_week INTEGER NOT NULL, total_phase_weeks INTEGER NOT NULL, UNIQUE(plan_id, session_key)
);
CREATE INDEX IF NOT EXISTS sessions_plan_week_day ON plan_sessions(plan_id, week, day);
CREATE TABLE IF NOT EXISTS coach_threads (
 id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 title TEXT NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, archived_at INTEGER
);
CREATE INDEX IF NOT EXISTS threads_user_updated ON coach_threads(user_id, updated_at);
CREATE TABLE IF NOT EXISTS coach_messages (
 id TEXT PRIMARY KEY, thread_id TEXT NOT NULL REFERENCES coach_threads(id) ON DELETE CASCADE,
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, role TEXT NOT NULL CHECK(role IN ('user','assistant')),
 content TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('complete','streaming','error')), error_message TEXT,
 web_search INTEGER NOT NULL CHECK(web_search IN (0,1)), citations TEXT NOT NULL, web_sources TEXT, created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS messages_thread_created ON coach_messages(thread_id, created_at);

INSERT INTO users(id,email) VALUES ('alice','alice@example.invalid'),('bob','bob@example.invalid');
INSERT INTO accounts VALUES ('alice','alice','oauth','google','alice','refresh','access',123,'bearer','openid','id','state','oauthsecret','oauth');
INSERT INTO sessions VALUES ('alice','alice','alice','2030-01-01');
INSERT INTO native_auth_codes VALUES ('alicelive','alice',999999,NULL);
INSERT INTO native_auth_codes VALUES ('aliceused','alice',999999,2);
INSERT INTO native_auth_codes VALUES ('aliceexpired','alice',1,NULL);
INSERT INTO accounts VALUES ('bob','bob','oauth','google','bob','refresh','access',123,'bearer','openid','id','state','oauthsecret','oauth');
INSERT INTO sessions VALUES ('bob','bob','bob','2030-01-01');
INSERT INTO native_auth_codes VALUES ('boblive','bob',999999,NULL);
INSERT INTO native_auth_codes VALUES ('bobused','bob',999999,2);
INSERT INTO native_auth_codes VALUES ('bobexpired','bob',1,NULL);
INSERT INTO accounts VALUES ('orphan','orphan','oauth','google','orphan','refresh','access',123,'bearer','openid','id','state','oauthsecret','oauth');
INSERT INTO sessions VALUES ('orphan','orphan','orphan','2030-01-01');
INSERT INTO native_auth_codes VALUES ('orphanlive','orphan',999999,NULL);
INSERT INTO native_auth_codes VALUES ('orphanused','orphan',999999,2);
INSERT INTO native_auth_codes VALUES ('orphanexpired','orphan',1,NULL);
INSERT INTO athlete_profiles VALUES ('alice','2027-01-01','Manila','open','beginner_mid',330,NULL,3730,30,'male',81.6,'lbs',4,60,NULL,1,1);
INSERT INTO training_plans VALUES ('alice','alice','active','template',NULL,1,'2027-01-01',NULL,1);
INSERT INTO plan_sessions VALUES ('alice','alice','alice','s',1,1,'engine_builder','foundation','Easy','60','{}','{}','{}','Note','pending',NULL,1,4);
INSERT INTO coach_threads VALUES ('alice','alice','T',1,1,NULL);
INSERT INTO coach_messages VALUES ('alice','alice','alice','user','Hi','complete',NULL,0,'[]',NULL,1);
INSERT INTO verification_tokens VALUES ('alice@example.invalid','alice','2030-01-01');
INSERT INTO athlete_profiles VALUES ('bob','2027-01-01','Manila','open','beginner_mid',330,NULL,3730,30,'male',81.6,'lbs',4,60,NULL,1,1);
INSERT INTO training_plans VALUES ('bob','bob','active','template',NULL,1,'2027-01-01',NULL,1);
INSERT INTO plan_sessions VALUES ('bob','bob','bob','s',1,1,'engine_builder','foundation','Easy','60','{}','{}','{}','Note','pending',NULL,1,4);
INSERT INTO coach_threads VALUES ('bob','bob','T',1,1,NULL);
INSERT INTO coach_messages VALUES ('bob','bob','bob','user','Hi','complete',NULL,0,'[]',NULL,1);
INSERT INTO verification_tokens VALUES ('bob@example.invalid','bob','2030-01-01');
