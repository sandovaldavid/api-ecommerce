import User from "../models/user.js";
import { UserService } from "./userService.js";

export class AuthorizationService {
    static async verifyResourceOwnership(userId, resourceType, options = {}) {
        try {
            const {
                resourceId,
                userIdResource,
                model,
                includeUser = true,
                attributes = ["id", "userId"],
                userAttributes = ["id", "firstName", "lastNameFather"]  // Added lastName
            } = options;

            if (!model) {
                throw new Error("Model is required for ownership verification");
            }

            // Determine which ID to use
            const effectiveResourceId = resourceId || userIdResource;
            if (!effectiveResourceId) {
                return {
                    isAuthorized: false,
                    error: "No resource ID provided",
                    statusCode: 400,
                    details: {
                        resourceType,
                        providedIds: { resourceId, userIdResource }
                    }
                };
            }

            // Get resource with optimized query
            const queryOptions = {
                attributes,
                ...(includeUser && {
                    include: [{
                        model: User,
                        attributes: userAttributes,
                        required: true
                    }]
                })
            };

            // Find resource based on provided ID type
            const resource = await model.findOne({
                ...queryOptions,
                where: resourceId
                    ? { id: resourceId }
                    : { userId: userIdResource }
            });

            if (!resource) {
                return {
                    isAuthorized: false,
                    error: `${resourceType} not found`,
                    statusCode: 404,
                    details: {
                        resourceType,
                        searchCriteria: resourceId
                            ? { id: resourceId }
                            : { userId: userIdResource }
                    }
                };
            }

            // Check ownership and admin role in parallel
            const [isOwner, hasAdminRole] = await Promise.all([
                Promise.resolve(resource.userId === userId),
                UserService.hasRole(userId, "admin")
            ]);

            if (!isOwner && !hasAdminRole) {
                return {
                    isAuthorized: false,
                    error: `Not authorized to access this ${resourceType}`,
                    statusCode: 403,
                    details: {
                        resourceType,
                        userId,
                        isOwner,
                        isAdmin: hasAdminRole
                    }
                };
            }

            return {
                isAuthorized: true,
                resource,
                isOwner,
                isAdmin: hasAdminRole,
                effectiveId: effectiveResourceId
            };

        } catch (error) {
            console.error(`Authorization check error for ${resourceType}:`, {
                error: error.message,
                stack: error.stack,
                userId,
                resourceType,
                options
            });

            return {
                isAuthorized: false,
                error: "Error checking authorization",
                statusCode: 500,
                details: error.message
            };
        }
    }
}