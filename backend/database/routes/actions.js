import express from 'express';
import * as actionsService from '../services/actionsService.js';

const router = express.Router();

// POST /db/actions/bulk
router.post('/actions/bulk', async (req, res, next) => {
    try {
        const { doc_id, actions } = req.body;
        const data = await actionsService.bulkInsertActions(doc_id, actions);
        res.json(data);
    } catch (err) {
        next(err);
    }
});

// GET /db/actions/:doc_id
router.get('/actions/:doc_id', async (req, res, next) => {
    try {
        const { status, department, action_type } = req.query;

        const data = await actionsService.getActions(
            req.params.doc_id,
            { status, department, action_type }
        );

        res.json(data);
    } catch (err) {
        next(err);
    }
});

// PATCH /db/actions/:action_id/status
router.patch('/actions/:action_id/status', async (req, res, next) => {
    try {
        const { status } = req.body;

        const data = await actionsService.updateActionStatus(
            req.params.action_id,
            status
        );

        res.json(data);
    } catch (err) {
        next(err);
    }
});

export default router;