import express from 'express';
import * as documentsService from '../services/documentsService.js';

const router = express.Router();

// POST /db/documents
router.post('/', async (req, res, next) => {
    try {
        const data = await documentsService.createDocument(req.body);
        res.json(data);
    } catch (err) {
        next(err);
    }
});

// GET /db/documents (metadata only)
router.get('/', async (req, res, next) => {
    try {
        const { status, limit = 10, offset = 0 } = req.query;
        const data = await documentsService.getDocuments({ status, limit, offset });
        res.json(data);
    } catch (err) {
        next(err);
    }
});

// GET /db/documents/:doc_id (full)
router.get('/:doc_id', async (req, res, next) => {
    try {
        const data = await documentsService.getDocumentById(req.params.doc_id);
        res.json(data);
    } catch (err) {
        next(err);
    }
});

// PATCH /db/documents/:doc_id/status
router.patch('/:doc_id/status', async (req, res, next) => {
    try {
        const { status } = req.body;
        const data = await documentsService.updateStatus(req.params.doc_id, status);
        res.json(data);
    } catch (err) {
        next(err);
    }
});

router.post('/:doc_id/context', async (req, res, next) => {
    try {
        const { summary, keywords } = req.body;
        const data = await documentsService.upsertContext(
            req.params.doc_id,
            summary,
            keywords
        );
        res.json(data);
    } catch (err) {
        next(err);
    }
});

router.get('/:doc_id/context', async (req, res, next) => {
    try {
        const data = await documentsService.getContext(req.params.doc_id);
        res.json(data);
    } catch (err) {
        next(err);
    }
});

// GET /db/documents/hash/:hash
router.get('/hash/:hash', async (req, res, next) => {
    try {
        const data = await documentsService.checkHash(req.params.hash);
        res.json(data);
    } catch (err) {
        next(err);
    }
});

export default router;