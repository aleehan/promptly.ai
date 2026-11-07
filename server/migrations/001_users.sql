CREATE TABLE users (
                       id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
                       email         text        NOT NULL,
                       password_hash text        NOT NULL,
                       created_at    timestamptz NOT NULL DEFAULT now()
);

-- Уникальность email без учёта регистра: Test@mail.com и test@mail.com это один человек
CREATE UNIQUE INDEX users_email_unique ON users (lower(email));