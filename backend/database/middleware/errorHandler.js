const errorHandler = (err, req, res, next) => {
    console.error('ERROR:', err);

    // default values
    let statusCode = 500;
    let message = 'Internal Server Error';
    let details = err.message;

    // Postgres errors
    if (err.code) {
        switch (err.code) {
            case '23505': // unique violation
                statusCode = 409;
                message = 'Duplicate resource';
                break;

            case '23503': // foreign key violation
                statusCode = 400;
                message = 'Invalid reference (foreign key constraint)';
                break;

            case '22P02': // invalid input syntax
                statusCode = 400;
                message = 'Invalid input format';
                break;

            default:
                statusCode = 400;
                message = 'Database error';
        }
    }

    res.status(statusCode).json({
        success: false,
        error: message,
        details
    });
};

export default errorHandler;