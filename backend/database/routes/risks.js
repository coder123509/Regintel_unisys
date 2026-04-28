import express from 'express';
import * as riskService from '../services/riskService.js';

const router = express.Router();

// POST /db/risk
router.post('/risk', async (req, res, next) => {
    try {
        const data = await riskService.upsertRisk(req.body);
        res.json(data);
    } catch (err) {
        next(err);
    }
});

// GET /db/risk/:doc_id (doc-level)
router.get('/risk/:doc_id', async (req, res, next) => {
    try {
        const data = await riskService.getDocumentRisk(req.params.doc_id);
        res.json(data);
    } catch (err) {
        next(err);
    }
});

// GET /db/risk/:doc_id/clauses
router.get('/risk/:doc_id/clauses', async (req, res, next) => {
    try {
        const data = await riskService.getClauseRisks(req.params.doc_id);
        res.json(data);
    } catch (err) {
        next(err);
    }
});

export default router;