import jwt from "jsonwebtoken";
import config from "../config/config.js";

export class TokenService {
    static validate(token) {
        try {
            if (!token) {
                return {
                    isValid: false,
                    error: "No token provided"
                };
            }

            // Remove 'Bearer ' if present
            const cleanToken = token.replace(/^Bearer\s+/, '');

            // Verify token
            const decoded = jwt.verify(cleanToken, config.development.secret);

            return {
                isValid: true,
                decoded
            };
        } catch (error) {
            console.error('Token validation error:', {
                error: error.message,
                stack: error.stack
            });

            return {
                isValid: false,
                error: error.message
            };
        }
    }

    static decode(token) {
        try {
            if (!token) {
                return {
                    success: false,
                    error: "No token provided"
                };
            }

            // Remove 'Bearer ' if present
            const cleanToken = token.replace(/^Bearer\s+/, '');

            // Decode token without verification
            const decoded = jwt.decode(cleanToken);

            if (!decoded) {
                return {
                    success: false,
                    error: "Invalid token format"
                };
            }

            return {
                success: true,
                data: {
                    id: decoded.id,
                    exp: decoded.exp,
                    iat: decoded.iat
                }
            };
        } catch (error) {
            console.error('Token decode error:', {
                error: error.message,
                stack: error.stack
            });

            return {
                success: false,
                error: error.message
            };
        }
    }

    static generate(userId, expiresIn = "1h") {
        try {
            const token = jwt.sign(
                { id: userId },
                config.development.secret,
                { expiresIn }
            );

            return {
                success: true,
                token,
                expiresIn
            };
        } catch (error) {
            console.error('Token generation error:', {
                error: error.message,
                stack: error.stack
            });

            return {
                success: false,
                error: error.message
            };
        }
    }

    static extractFromHeaders(req) {
        try {
            const token = req.headers["x-access-token"] || req.headers["authorization"];
            if (!token) {
                return {
                    success: false,
                    error: "No token in headers"
                };
            }

            // Remove 'Bearer ' if present
            const cleanToken = token.replace(/^Bearer\s+/, '');

            return {
                success: true,
                token: cleanToken
            };
        } catch (error) {
            console.error('Token extraction error:', {
                error: error.message,
                stack: error.stack
            });

            return {
                success: false,
                error: error.message
            };
        }
    }
}