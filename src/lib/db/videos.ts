import { getDb } from "./client";
import {
  CreateVideoSchema,
  InternalUpdateVideoSchema,
  CREATE_TABLE_SQL,
  mapRowToVideo,
  type Video,
  type CreateVideoInput,
  type InternalUpdateVideoInput,
} from "./schema";

export async function initializeDatabase(): Promise<void> {
  const sql = getDb();
  await sql.query(CREATE_TABLE_SQL);
}

export async function createVideo(data: CreateVideoInput): Promise<Video> {
  const parsed = CreateVideoSchema.parse(data);
  const sql = getDb();

  const rows = await sql.query(
    `INSERT INTO videos (title, blob_url, duration_ms)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [parsed.title, parsed.blobUrl, parsed.durationMs ?? null]
  );

  return mapRowToVideo(rows[0] as Record<string, unknown>);
}

export async function listVideos(): Promise<Video[]> {
  const sql = getDb();
  const rows = await sql.query(`SELECT * FROM videos ORDER BY created_at DESC`);
  return rows.map((row) => mapRowToVideo(row as Record<string, unknown>));
}

export async function getVideoById(id: string): Promise<Video | null> {
  const sql = getDb();
  const rows = await sql.query(`SELECT * FROM videos WHERE id = $1`, [id]);

  if (rows.length === 0) {
    return null;
  }

  return mapRowToVideo(rows[0] as Record<string, unknown>);
}

export async function updateVideo(
  id: string,
  data: InternalUpdateVideoInput
): Promise<Video | null> {
  const parsed = InternalUpdateVideoSchema.parse(data);
  const sql = getDb();

  const setClauses: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (parsed.status !== undefined) {
    setClauses.push(`status = $${paramIndex++}`);
    values.push(parsed.status);
  }
  if (parsed.transcriptId !== undefined) {
    setClauses.push(`transcript_id = $${paramIndex++}`);
    values.push(parsed.transcriptId);
  }
  if (parsed.subtitles !== undefined) {
    setClauses.push(`subtitles = $${paramIndex++}`);
    values.push(JSON.stringify(parsed.subtitles));
  }
  if (parsed.subtitleStyle !== undefined) {
    setClauses.push(`subtitle_style = $${paramIndex++}`);
    values.push(JSON.stringify(parsed.subtitleStyle));
  }
  if (parsed.errorMessage !== undefined) {
    setClauses.push(`error_message = $${paramIndex++}`);
    values.push(parsed.errorMessage);
  }
  if (parsed.thumbnailUrl !== undefined) {
    setClauses.push(`thumbnail_url = $${paramIndex++}`);
    values.push(parsed.thumbnailUrl);
  }
  if (parsed.durationMs !== undefined) {
    setClauses.push(`duration_ms = $${paramIndex++}`);
    values.push(parsed.durationMs);
  }

  if (setClauses.length === 0) {
    return getVideoById(id);
  }

  setClauses.push(`updated_at = now()`);
  values.push(id);

  const rows = await sql.query(
    `UPDATE videos SET ${setClauses.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  if (rows.length === 0) {
    return null;
  }

  return mapRowToVideo(rows[0] as Record<string, unknown>);
}

export async function deleteVideo(id: string): Promise<boolean> {
  const sql = getDb();
  const rows = await sql.query(
    `DELETE FROM videos WHERE id = $1 RETURNING id`,
    [id]
  );
  return rows.length > 0;
}
