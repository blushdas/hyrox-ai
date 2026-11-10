ALTER TABLE athlete_profiles ADD COLUMN onboarding_skipped INTEGER NOT NULL DEFAULT 0 CHECK(onboarding_skipped IN (0,1));
