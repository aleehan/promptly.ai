CREATE TABLE chats (
                       id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
                       user_id    uuid        REFERENCES users(id)  ON DELETE CASCADE,
                       guest_id   uuid        REFERENCES guests(id) ON DELETE CASCADE,
                       title      text        NOT NULL DEFAULT 'New Chat',
                       created_at timestamptz NOT NULL DEFAULT now(),
                       updated_at timestamptz NOT NULL DEFAULT now(),
    -- ровно один владелец
                       CONSTRAINT chats_one_owner CHECK ((user_id IS NOT NULL)::int + (guest_id IS NOT NULL)::int = 1)
    );

CREATE INDEX chats_user_idx  ON chats (user_id,  updated_at DESC);
CREATE INDEX chats_guest_idx ON chats (guest_id, updated_at DESC);

CREATE TABLE messages (
                          id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
                          seq        bigint      GENERATED ALWAYS AS IDENTITY,
                          chat_id    uuid        NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
                          role       text        NOT NULL CHECK (role IN ('user', 'assistant')),
                          content    text        NOT NULL,
                          status     text        NOT NULL DEFAULT 'sent',
                          created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX messages_chat_idx ON messages (chat_id, seq);