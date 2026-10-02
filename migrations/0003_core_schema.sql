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
