export const errorHandler = (err, req, res, next) => {
    if (err.name === "UnauthorizedError") {
        return res.status(401).json({ error: "Invalid token" });
    }

    if (err.name === "ForbiddenError") {
        return res.status(403).json({ error: "Insufficient permissions" });
    }

    return res.status(500).json({ error: "Internal server error" });
};