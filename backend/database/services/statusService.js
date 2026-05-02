import { query } from '../config/db.js';

export const createPipelineStatus = async (doc_id) => {
    await query(
        `INSERT INTO pipeline_status (doc_id)
         VALUES ($1)
         ON CONFLICT (doc_id) DO NOTHING`,
        [doc_id]
    );

    return {
        success: true,
        doc_id
    };
};

export const updatePipelineStatus = async (doc_id, pipeline, status) => {
    const allowedPipelines = ['p1', 'p2', 'p3'];
    const allowedStatus = ['pending', 'processing', 'completed', 'failed'];

    if (!allowedPipelines.includes(pipeline)) {
        throw new Error('Invalid pipeline');
    }

    if (!allowedStatus.includes(status)) {
        throw new Error('Invalid status');
    }

    const column = `${pipeline}_status`;
    const timeColumn = `${pipeline}_updated_at`;

    await query(
        `UPDATE pipeline_status
         SET ${column} = $1,
             ${timeColumn} = NOW()
         WHERE doc_id = $2`,
        [status, doc_id]
    );

    return { success: true };
};

export const getPipelineStatus = async (doc_id) => {
    const result = await query(
        `SELECT * FROM pipeline_status WHERE doc_id = $1`,
        [doc_id]
    );

    return result.rows[0] || null;
};

export const getAllPipelineStatus = async (filters) => {
    let queryText = `SELECT * FROM pipeline_status WHERE 1=1`;
    const params = [];
    let idx = 1;

    if (filters.p1_status) {
        queryText += ` AND p1_status = $${idx++}`;
        params.push(filters.p1_status);
    }

    if (filters.p2_status) {
        queryText += ` AND p2_status = $${idx++}`;
        params.push(filters.p2_status);
    }

    if (filters.p3_status) {
        queryText += ` AND p3_status = $${idx++}`;
        params.push(filters.p3_status);
    }

    const result = await query(queryText, params);
    return result.rows;
};