import express from 'express';
import * as statusService from '../services/statusService.js';

const router = express.Router();

router.post('/pipeline-status', async (req, res, next) => {
    try {
        const { doc_id } = req.body;
        const data = await statusService.createPipelineStatus(doc_id);
        res.json(data);
    } catch (err) {
        next(err);
    }
});

router.patch('/pipeline-status/:doc_id', async (req, res, next) => {
    try {
        const { pipeline, status } = req.body;

        const data = await statusService.updatePipelineStatus(
            req.params.doc_id,
            pipeline,
            status
        );

        res.json(data);
    } catch (err) {
        next(err);
    }
});

router.get('/pipeline-status', async (req, res, next) => {
    try {
        const data = await statusService.getAllPipelineStatus(req.query);
        res.json(data);
    } catch (err) {
        next(err);
    }
});

router.get('/pipeline-status/:doc_id', async (req, res, next) => {
    try {
        const data = await statusService.getPipelineStatus(req.params.doc_id);
        res.json(data);
    } catch (err) {
        next(err);
    }
});

export default router;