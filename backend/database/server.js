import express from 'express';
import cors from 'cors';
import { query } from './config/db.js';

import documentsRoutes from './routes/documents.js';
import clausesRoutes from './routes/clauses.js';
import mappingsRoutes from './routes/mappings.js';
import riskRoutes from './routes/risks.js';
import actionsRoutes from './routes/actions.js';
import statusRoutes from './routes/status.js';
import errorHandler from './middleware/errorHandler.js';


const app = express(); 

app.use(cors());
app.use(express.json());

app.use('/db/documents', documentsRoutes);
app.use('/db', clausesRoutes);
app.use('/db', mappingsRoutes);
app.use('/db', riskRoutes);
app.use('/db', actionsRoutes);
app.use('/db', statusRoutes);

app.use(errorHandler);

app.get('/test-db', async (req, res) => {
    try {
        const result = await query('SELECT NOW()');
        res.json({
            success: true,
            time: result.rows[0]
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

export default app;