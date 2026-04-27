import {query} from '../config/db.js';

//CREATE
export const createDocument = async (data) => {
    const{
        doc_id,
        source_id,
        source_url,
        hash,
        full_text,
        published_at,
    } = data;

    const result = await query(
        `INSERT INTO documents 
        (doc_id, source_id, source_url, hash, full_text, published_at, status)
        VALUES ($1,$2,$3,$4,$5,$6,'ingesting')
        ON CONFLICT (hash) DO NOTHING
        RETURNING doc_id`,
        [doc_id, source_id, source_url, hash, full_text, published_at]
    );

    if (result.rows.length == 0) {
        return {duplicate: true};
    }
    return { success: true, doc_id: result.rows[0].doc_id };
};

//LIST - only metadata
export const getDocuments =  async ({ status, limit, offset }) => {
    let baseQuery = `
    SELECT doc_id, source_id, source_url, published_at, ingested_at, status
    FROM documents
    `;

    const params = [];
    if (status) {
        params.push(status);
        baseQuery += ` WHERE status = $${params.length}`;
    }

    params.push(limit , offset);

    baseQuery += `
        ORDER BY ingested_at DESC
        LIMIT $${params.length - 1}
        OFFSET $${params.length}
    `;

    const result = await query(baseQuery, params);
    return result.rows;
};

// get FULL - by id
export const getDocumentById = async (doc_id) => {
    const result = await query(
        `SELECT * FROM documents WHERE doc_id = $1`,
        [doc_id]
    );

    return result.rows[0] || null;
};

// UPDATE STATUS
export const updateStatus = async (doc_id, status) => {
    const result = await query(
        `UPDATE documents
         SET status = $1
         WHERE doc_id = $2
         RETURNING doc_id, status`,
        [status, doc_id]
    );

    return result.rows[0];
};

// HASH CHECK
export const checkHash = async (hash) => {
    const result = await query(
        `SELECT doc_id FROM documents WHERE hash = $1`,
        [hash]
    );

    return {
        exists: result.rows.length > 0,
        doc_id: result.rows[0]?.doc_id
    };
};

//context
export const upsertContext = async (doc_id, summary, keywords) => {
    const result = await query(
        `INSERT INTO document_context (doc_id, summary, keywords)
         VALUES ($1, $2, $3)
         ON CONFLICT (doc_id)
         DO UPDATE SET
            summary = EXCLUDED.summary,
            keywords = EXCLUDED.keywords,
            created_at = NOW()
         RETURNING *`,
        [doc_id, summary, keywords]
    );

    return result.rows[0];
};

//get context
export const getContext = async (doc_id) => {
    const result = await query(
        `SELECT * FROM document_context WHERE doc_id = $1`,
        [doc_id]
    );

    return result.rows[0] || null;
};