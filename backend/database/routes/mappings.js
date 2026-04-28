import express from 'express';
import * as mappingsService from '../services/mappingsService.js';

const router = express.Router();

// POST /db/mappings/clause (single upsert)
router.post('/mappings/clause', async (req, res, next) => {
    try {
        const data = await mappingsService.upsertClauseMapping(req.body);
        res.json(data);
    } catch (err) {
        next(err);
    }
});

// GET /db/mappings/clause/:clause_id
router.get('/mappings/clause/:clause_id', async (req, res, next) => {
    try {
        const data = await mappingsService.getClauseMapping(req.params.clause_id);
        res.json(data);
    } catch (err) {
        next(err);
    }
});

// GET /db/mappings/document/:doc_id
router.get('/mappings/document/:doc_id', async (req, res, next) => {
    try {
        const data = await mappingsService.getMappingsByDoc(req.params.doc_id);
        res.json(data);
    } catch (err) {
        next(err);
    }
});

router.post('/mappings/clause/bulk', async (req, res, next) => {
    try {
        const { doc_id, mappings } = req.body;

        const data = await mappingsService.bulkUpsertMappings(doc_id, mappings);
        res.json(data);
    } catch (err) {
        next(err);
    }
});

router.post('/mappings/document/:doc_id/summary', async (req, res, next) => {
    try {
        const data = await mappingsService.upsertMappingSummary(
            req.params.doc_id,
            req.body
        );
        res.json(data);
    } catch (err) {
        next(err);
    }
});

router.get('/mappings/document/:doc_id/summary', async (req, res, next) => {
    try {
        const data = await mappingsService.getMappingSummary(req.params.doc_id);
        res.json(data);
    } catch (err) {
        next(err);
    }
});

export default router;