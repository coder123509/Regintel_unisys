import {query} from '../config/db.js';

export const upsertRisk = async (data) => {
    const {
        doc_id,
        clause_id,
        risk_score,
        severity,
        impact,
        urgency,
        priority
    } = data;

    const existing = await query(`
        SELECT risk_id FROM risk_scores
        WHERE doc_id = $1 AND clause_id = $2
    `, [doc_id, clause_id || null]
    );

        if (existing.rows.length > 0) {
        const result = await query(
            `UPDATE risk_scores
             SET risk_score=$1, severity=$2, impact=$3, urgency=$4, priority=$5, scored_at=NOW()
             WHERE risk_id = $6
             RETURNING *`,
            [
                risk_score,
                severity,
                impact,
                urgency,
                priority,
                existing.rows[0].risk_id
            ]
        );
        return result.rows[0];
        } else {
            // insert
            const result = await query(
                `INSERT INTO risk_scores
                (doc_id, clause_id, risk_score, severity, impact, urgency, priority, scored_at)
                VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
                RETURNING *`,
                [
                    doc_id,
                    clause_id || null,
                    risk_score,
                    severity,
                    impact,
                    urgency,
                    priority
                ]
            );

            return result.rows[0];
        }
};

export const getDocumentRisk = async (doc_id) => {
    const result = await query(
        `SELECT * FROM risk_scores
         WHERE doc_id = $1 AND clause_id IS NULL`,
        [doc_id]
    );

    return result.rows[0] || null;
};

export const getClauseRisks = async (doc_id) => {
    const result = await query(
        `SELECT * FROM risk_scores
         WHERE doc_id = $1 AND clause_id IS NOT NULL`,
        [doc_id]
    );

    return result.rows;
};