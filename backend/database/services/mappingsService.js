import { query } from '../config/db.js';
import pool from '../config/db.js';

// UPSERT SINGLE CLAUSE MAPPING
export const upsertClauseMapping = async (data) => {
    const {
        clause_id,
        doc_id,
        mapped_policy,
        department,
        gap_detected,
        mapping_confidence,
        reasoning,
        graph_policies,
        semantic_policies,
        mapping_status
    } = data;

    const result = await query(
        `INSERT INTO clause_mappings
        (clause_id, doc_id, mapped_policy, department, gap_detected,
         mapping_confidence, reasoning, graph_policies, semantic_policies,
         mapping_status, mapped_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())
        ON CONFLICT (clause_id)
        DO UPDATE SET
            mapped_policy = EXCLUDED.mapped_policy,
            department = EXCLUDED.department,
            gap_detected = EXCLUDED.gap_detected,
            mapping_confidence = EXCLUDED.mapping_confidence,
            reasoning = EXCLUDED.reasoning,
            graph_policies = EXCLUDED.graph_policies,
            semantic_policies = EXCLUDED.semantic_policies,
            mapping_status = EXCLUDED.mapping_status,
            mapped_at = NOW()
        RETURNING *`,
        [
            clause_id,
            doc_id,
            mapped_policy,
            department,
            gap_detected,
            mapping_confidence,
            reasoning,
            graph_policies,
            semantic_policies,
            mapping_status
        ]
    );

    return result.rows[0];
};

export const getClauseMapping = async (clause_id) => {
    const result = await query(
        `SELECT * FROM clause_mappings WHERE clause_id = $1`,
        [clause_id]
    );

    return result.rows[0] || null;
};

export const getMappingsByDoc = async (doc_id) => {
    const result = await query(
        `SELECT * FROM clause_mappings WHERE doc_id = $1`,
        [doc_id]
    );

    return result.rows;
};

export const bulkUpsertMappings = async (doc_id, mappings) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        for (const m of mappings) {
            const {
                clause_id,
                mapped_policy,
                department,
                gap_detected,
                mapping_confidence,
                reasoning,
                graph_policies,
                semantic_policies,
                mapping_status
            } = m;

            await client.query(
                `INSERT INTO clause_mappings
                (clause_id, doc_id, mapped_policy, department, gap_detected,
                 mapping_confidence, reasoning, graph_policies, semantic_policies,
                 mapping_status, mapped_at)
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())
                ON CONFLICT (clause_id)
                DO UPDATE SET
                    mapped_policy = EXCLUDED.mapped_policy,
                    department = EXCLUDED.department,
                    gap_detected = EXCLUDED.gap_detected,
                    mapping_confidence = EXCLUDED.mapping_confidence,
                    reasoning = EXCLUDED.reasoning,
                    graph_policies = EXCLUDED.graph_policies,
                    semantic_policies = EXCLUDED.semantic_policies,
                    mapping_status = EXCLUDED.mapping_status,
                    mapped_at = NOW()`,
                [
                    clause_id,
                    doc_id,
                    mapped_policy,
                    department,
                    gap_detected,
                    mapping_confidence,
                    reasoning,
                    graph_policies,
                    semantic_policies,
                    mapping_status
                ]
            );
        }

        await client.query('COMMIT');

        return {
            success: true,
            processed: mappings.length
        };

    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

export const upsertMappingSummary = async (doc_id, data) => {
    const {
        total_clauses,
        mapped_clauses,
        total_gaps,
        status
    } = data;

    const result = await query(
        `INSERT INTO document_mapping_summary
        (doc_id, total_clauses, mapped_clauses, total_gaps, status, completed_at)
        VALUES ($1,$2,$3,$4,$5,NOW())
        ON CONFLICT (doc_id)
        DO UPDATE SET
            total_clauses = EXCLUDED.total_clauses,
            mapped_clauses = EXCLUDED.mapped_clauses,
            total_gaps = EXCLUDED.total_gaps,
            status = EXCLUDED.status,
            completed_at = NOW()
        RETURNING *`,
        [doc_id, total_clauses, mapped_clauses, total_gaps, status]
    );

    return result.rows[0];
};

export const getMappingSummary = async (doc_id) => {
    const result = await query(
        `SELECT * FROM document_mapping_summary WHERE doc_id = $1`,
        [doc_id]
    );

    return result.rows[0] || null;
};