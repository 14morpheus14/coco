// Import the necessary modules
const DatabaseHandler = require('./db/DatabaseHandler');
const authenticator = require('./coco/authenticator');
const client = require('./coco/client');
const verifier = require('./coco/verifier');

// Export the modules
module.exports = {
    DatabaseHandler,
    authenticator,
    client,
    verifier,
};
