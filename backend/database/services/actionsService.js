import pool from '../config/db.js';

/**
 * Inserts actions in bulk inside a database transaction block
 */
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

/**
 * Retrieves actions associated with a document ID based on optional status, department, or type filters
 */
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

/**
 * ── HUMAN-IN-THE-LOOP (HITL) GOVERNANCE GATE ENGINE ──
 * Updates the validation status of a specific action item recommendation following a user decision.
 */
export const updateActionStatus = async (action_id, status) => {
    let dbStatus = status?.toLowerCase();

    // Mapping fallback options based on common schema naming patterns
    if (dbStatus === 'completed') {
        dbStatus = 'done';
    } else if (dbStatus === 'failed') {
        dbStatus = 'rejected'; 
    }

    try {
        const result = await pool.query(
            `UPDATE actions
             SET status = $1
             WHERE action_id = $2
             RETURNING *`,
            [dbStatus, action_id]
        );

        if (result.rows.length === 0) {
            throw new Error(`Target remediation action footprint identity hash '${action_id}' was not found in database logs.`);
        }

        return result.rows[0];
    } catch (err) {
        // Broadened Diagnostic Block: Intercept data input syntax errors (22P02)
        if (err.code === '22P02') {
            console.log("\n❌ DATABASE ENUM MISMATCH DETECTED!");
            try {
                // Find the exact enum values by tracing the column definition of your actions table directly
                const enumLookup = await pool.query(`
                    SELECT e.enumlabel
                    FROM pg_enum e
                    JOIN pg_type t ON e.enumtypid = t.oid
                    JOIN pg_attribute a ON a.atttypid = t.oid
                    JOIN pg_class c ON c.oid = a.attrelid
                    WHERE c.relname = 'actions' AND a.attname = 'status';
                `);
                
                const allowedValues = enumLookup.rows.map(r => r.enumlabel);
                console.log("ℹ️ YOUR NEON POSTGRES DATABASE ONLY ACCEPTS THESE EXACT VALUES:", allowedValues);
                
                // Adaptive lookups against the live definitions returned from the query
                let dynamicFallback = null;
                if (status?.toLowerCase() === 'failed') {
                    // Search for standard operational alternatives like 'failed', 'dismissed', 'rejected', 'inactive', 'canceled'
                    dynamicFallback = allowedValues.find(v => 
                        v.includes('fail') || v.includes('reject') || v.includes('dismiss') || v.includes('inact') || v.includes('cancel')
                    );
                }

                if (dynamicFallback) {
                    console.log(`💡 Automatically resolving transaction using discovered valid value: "${dynamicFallback}"`);
                    const recoveryResult = await pool.query(
                        `UPDATE actions SET status = $1 WHERE action_id = $2 RETURNING *`,
                        [dynamicFallback, action_id]
                    );
                    return recoveryResult.rows[0];
                } else {
                    console.log(`⚠️ Mapping match not found for status choice. Please view the array printout above and hardcode the match value directly.\n`);
                }

            } catch (schemaErr) {
                console.log("Failed to inspect table metadata layout:", schemaErr.message);
            }
        }
        
        throw err; 
    }
};