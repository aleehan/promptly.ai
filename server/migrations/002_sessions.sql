CREATE TABLE sessions (
                          id_hash    text        PRIMARY KEY,
                          user_id    uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                          expires_at timestamptz NOT NULL,
                          created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX sessions_user_id_idx ON sessions (user_id);