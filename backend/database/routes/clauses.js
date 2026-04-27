import express from 'express';
import * as clausesService from '../services/clausesService.js';

const router = express.Router();

// POST /db/documents/:doc_id/clauses
router.post('/documents/:doc_id/clauses', async (req, res, next) => {
    try {
        const clauses = req.body.clauses;
        const data = await clausesService.bulkInsertClauses(
            req.params.doc_id,
            clauses
        );
        res.json(data);
    } catch (err) {
        next(err);
    }
});

// GET /db/documents/:doc_id/clauses
router.get('/documents/:doc_id/clauses', async (req, res, next) => {
    try {
        const { type } = req.query;
        const data = await clausesService.getClausesByDoc(
            req.params.doc_id,
            type
        );
        res.json(data);
    } catch (err) {
        next(err);
    }
});

// GET /db/clauses/:clause_id
router.get('/:clause_id', async (req, res, next) => {
    try {
        const data = await clausesService.getClauseById(req.params.clause_id);
        res.json(data);
    } catch (err) {
        next(err);
    }
});

export default router;