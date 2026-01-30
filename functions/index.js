const { onRequest } = require("firebase-functions/v2/https");
const app = require("../api/index");

// Export the existing Express app as a Firebase Cloud Function
exports.api = onRequest({
    memory: "512MiB",
    timeoutSeconds: 60,
    region: "us-central1" // Change if needed
}, app);
