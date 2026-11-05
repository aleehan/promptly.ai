import crypto from "node:crypto";

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

export default hashToken;