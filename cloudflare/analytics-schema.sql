CREATE TABLE IF NOT EXISTS page_reads (
  hour TEXT NOT NULL,
  path TEXT NOT NULL,
  agent TEXT NOT NULL DEFAULT '',
  reads INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (hour, path, agent)
);
