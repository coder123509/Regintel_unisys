import pool from '../config/db.js';

// BULK INSERT (replace strategy)
export const bulkInsertClauses = async (doc_id, clauses) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // delete old clauses
        await client.query(
            `DELETE FROM clauses WHERE doc_id = $1`,
            [doc_id]
        );

        for (const clause of clauses) {
            const {
                clause_id,
                text,
                type,
                deadline,
                extraction_confidence
            } = clause;

            await client.query(
                `INSERT INTO clauses
                (clause_id, doc_id, text, type, deadline, extraction_confidence)
                VALUES ($1,$2,$3,$4,$5,$6)`,
                [
                    clause_id,
                    doc_id,
                    text,
                    type,
                    deadline || null,
                    extraction_confidence
                ]
            );
        }

        await client.query('COMMIT');

        return {
            success: true,
            inserted: clauses.length
        };

    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};