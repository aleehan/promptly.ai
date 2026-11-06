CREATE TABLE guests (
                        id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
                        used       integer     NOT NULL DEFAULT 0,
                        created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE users ADD COLUMN used integer NOT NULL DEFAULT 0;