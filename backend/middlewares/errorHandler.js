class AppError extends Error {
    constructor(message, statusCode, details = null) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.details = details;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

class ValidationError extends AppError {
    constructor(details) {
        super('Validation Error', 400, details);
    }
}

class AuthenticationError extends AppError {
    constructor(message = 'Authentication failed') {
        super(message, 401);
    }
}

class AuthorizationError extends AppError {
    constructor(message = 'Access denied') {
        super(message, 403);
    }
}

class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, 404);
    }
}

export const errorHandler = (err, req, res, next) => {
    // Log error details
    console.error('Error occurred:', {
        name: err.name,
        message: err.message,
        statusCode: err.statusCode,
        path: req.path,
        method: req.method,
        userId: req.userId,
        userRoles: req.user?.roles,
        timestamp: new Date().toISOString(),
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });

    // Handle specific error types
    switch (err.name) {
        case 'ValidationError':
            return res.status(400).json({
                error: 'Validation failed',
                details: err.details || err.message,
                path: req.path
            });

        case 'AuthenticationError':
            return res.status(401).json({
                error: 'Authentication failed',
                details: err.message,
                path: req.path
            });

        case 'AuthorizationError':
            return res.status(403).json({
                error: 'Access denied',
                details: err.message,
                path: req.path
            });

        case 'SequelizeValidationError':
        case 'SequelizeUniqueConstraintError':
            return res.status(400).json({
                error: 'Database validation failed',
                details: err.errors.map(e => ({
                    field: e.path,
                    message: e.message
                })),
                path: req.path
            });

        case 'SequelizeForeignKeyConstraintError':
            return res.status(409).json({
                error: 'Database constraint error',
                details: 'Referenced record does not exist',
                path: req.path
            });
        
        case 'NotFoundError':
            return res.status(404).json({
                error: 'Resource not found',
                details: err.message,
                path: req.path
            });

        default:
            // Handle unexpected errors
            const statusCode = err.statusCode || 500;
            const message = statusCode === 500 ?
                'Internal server error' :
                err.message;

            return res.status(statusCode).json({
                error: message,
                details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
                path: req.path,
                requestId: req.id
            });
    }
};

// Export custom error classes
export const Errors = {
    AppError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError
};