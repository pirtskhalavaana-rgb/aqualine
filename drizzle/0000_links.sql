CREATE TABLE links(code TEXT PRIMARY KEY, label TEXT NOT NULL);
--> statement-breakpoint
CREATE TABLE visits(id TEXT PRIMARY KEY, visitor TEXT NOT NULL, code TEXT NOT NULL, day TEXT NOT NULL);
--> statement-breakpoint
CREATE INDEX visits_code_day ON visits(code,day);
