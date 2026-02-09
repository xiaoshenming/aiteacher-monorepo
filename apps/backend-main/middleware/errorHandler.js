const logger = require('../utils/logger');

// AppError class for operational errors
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        logger.error(`Error ${err.statusCode}: ${err.message}`, err);
        res.status(err.statusCode).json({
            code: err.statusCode,
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack
        });
    } else {
        // Production mode
        if (err.isOperational) {
            // Trusted error: send message to client
            res.status(err.statusCode).json({
                code: err.statusCode,
                status: err.status,
                message: err.message
            });
        } else {
            // Programming or other unknown error: don't leak details
            logger.error('ERROR 💥', err);
            res.status(500).json({
                code: 500,
                status: 'error',
                message: 'Something went wrong!'
            });
        }
    }
};

module.exports = {
    AppError,
    errorHandler
};
