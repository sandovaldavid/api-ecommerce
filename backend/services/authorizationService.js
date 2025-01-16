import User from '../models/user.js';
import { UserService } from './userService.js';

export class AuthorizationService {
    static async verifyResourceOwnership(userId, resourceId, resourceType, options = {}) {
        try {
            const {
                model,
                includeUser = true,
                attributes = ['id', 'userId'],
                userAttributes = ['id', 'firstName']
            } = options;

            if (!model) {
                throw new Error('Model is required for ownership verification');
            }

            // Get resource with user info
            const resource = await model.findOne({
                where: { id: resourceId },
                include: includeUser ? [{
                    model: User,
                    attributes: userAttributes,
                    required: true
                }] : [],
                attributes
            });

            if (!resource) {
                return {
                    isAuthorized: false,
                    error: `${resourceType} not found`,
                    statusCode: 404
                };
            }

            // Check ownership
            const isOwner = resource.userId === userId;
            const hasAdminRole = await UserService.hasRole(userId, "admin");

            if (!isOwner && !hasAdminRole) {
                return {
                    isAuthorized: false,
                    error: `Not authorized to access this ${resourceType}`,
                    statusCode: 403
                };
            }

            return {
                isAuthorized: true,
                resource,
                isOwner,
                isAdmin: hasAdminRole
            };
        } catch (error) {
            console.error(`Authorization check error for ${resourceType}:`, {
                error: error.message,
                stack: error.stack,
                userId,
                resourceId,
                resourceType
            });

            return {
                isAuthorized: false,
                error: `Error checking authorization`,
                statusCode: 500,
                details: error.message
            };
        }
    }
}