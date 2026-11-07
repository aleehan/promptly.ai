import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pool from './db.js';

const migrationsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'migrations');

async function migrate() {
    // Таблица-журнал: какие миграции уже применены
    await pool.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            name       text        PRIMARY KEY,
            applied_at timestamptz NOT NULL DEFAULT now()
        )
    `);

    const { rows } = await pool.query('SELECT name FROM schema_migrations');
    const applied = new Set(rows.map((r) => r.name));

    const files = (await fs.readdir(migrationsDir))
        .filter((f) => f.endsWith('.sql'))
        .sort();

    for (const file of files) {
        if (applied.has(file)) continue;

        const sql = await fs.readFile(path.join(migrationsDir, file), 'utf8');
        const client = await pool.connect();

        try {
            await client.query('BEGIN');
            await client.query(sql);
            await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
            await client.query('COMMIT');
            console.log('applied:', file);
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('failed:', file, error.message);
            process.exitCode = 1;
            break;
        } finally {
            client.release();
        }
    }

    await pool.end();
}

migrate();