import pool from '../config/db.js';

export const bulkInsertActions = async (doc_id, actions) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // clear old actions
        await client.query(
            `DELETE FROM actions WHERE doc_id = $1`,
            [doc_id]
        );

        for (const a of actions) {
            const {
                clause_id,
                action_text,
                action_type,
                department,
                status
            } = a;

            await client.query(
                `INSERT INTO actions
                (doc_id, clause_id, action_text, action_type, department, status, generated_at)
                VALUES ($1,$2,$3,$4,$5,$6,NOW())`,
                [
                    doc_id,
                    clause_id || null,
                    action_text,
                    action_type,
                    department,
                    status || 'pending'
                ]
            );
        }

        await client.query('COMMIT');

        return {
            success: true,
            inserted: actions.length
        };

    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

export const getActions = async (doc_id, filters) => {
    let queryText = `SELECT * FROM actions WHERE doc_id = $1`;
    const params = [doc_id];

    let idx = 2;

    if (filters.status) {
        queryText += ` AND status = $${idx++}`;
        params.push(filters.status);
    }

    if (filters.department) {
        queryText += ` AND department = $${idx++}`;
        params.push(filters.department);
    }

    if (filters.action_type) {
        queryText += ` AND action_type = $${idx++}`;
        params.push(filters.action_type);
    }

    const result = await pool.query(queryText, params);
    return result.rows;
};

export const updateActionStatus = async (action_id, status) => {
    const result = await pool.query(
        `UPDATE actions
         SET status = $1
         WHERE action_id = $2
         RETURNING *`,
        [status, action_id]
    );

    return result.rows[0];
};