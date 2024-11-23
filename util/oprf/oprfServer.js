/*
 * COCO Library
 *
 * Copyright (c) 2024 Yamya Reiki <reiki.yamya14@gmail.com>
 *
 * This file is part of the COCO library.
 *
 * This library is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This library includes components from the Coconut project, which is
 * licensed under the Apache License 2.0. Use of those components is
 * subject to the terms of the Apache License 2.0. See
 * <https://www.apache.org/licenses/LICENSE-2.0> for details.
 *
 * This library includes components from voprf-ts, which is licensed
 * under the BSD 3-Clause License. See <https://opensource.org/licenses/BSD-3-Clause> for details.
 *
 * This library includes components from argon2 and uuid, both of which are licensed
 * under the MIT License. See <https://opensource.org/licenses/MIT> for details.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this library. If not, see <https://www.gnu.org/licenses/>.
 */


const { EvaluationRequest, Oprf, OPRFServer: VoprfServer, randomPrivateKey } = require('@cloudflare/voprf-ts');
const { hexToUint8Array, uint8ArrayToHex } = require('../uint8Arrayutils.js'); 

// Define the OPRFServerHandler class, which handles OPRF server operations
class OPRFServerHandler {
    /**
     * Constructor to initialize the OPRF server handler.
     * @param {string} [existingPrivateKeyHex] - An optional existing private key in hex format.
     */
    constructor(existingPrivateKeyHex) {
        // Call the asynchronous init function with optional private key
        this.initPromise = this.init(existingPrivateKeyHex);
    }

    /**
     * Asynchronous initialization function to set up the OPRF server with the private key.
     * @param {string} [existingPrivateKeyHex] - An optional existing private key in hex format.
     */
    async init(existingPrivateKeyHex) {
        this.suite = Oprf.Suite.P256_SHA256; // Using P256_SHA256 for 256-bit security

        if (existingPrivateKeyHex) {
            // Convert the provided private key from hex to Uint8Array
            this.privateKey = hexToUint8Array(existingPrivateKeyHex);
        } else {
            // Generate a new random private key if no existing key is provided
            this.privateKey = await randomPrivateKey(this.suite);
        }

        // Initialize the server with the suite and the private key
        this.server = new VoprfServer(this.suite, this.privateKey);
    }

    /**
     * Ensure the server is initialized before running any server operations.
     */
    async ensureInitialized() {
        if (this.initPromise) {
            await this.initPromise;
            this.initPromise = null; // Ensure initialization only runs once
        }
    }

    /**
     * Get the private key in hex format.
     * @returns {Promise<string>} - The private key in hex format.
     */
    async getPrivateKey() {
        await this.ensureInitialized();
        return uint8ArrayToHex(this.privateKey);
    }

    /**
     * Deserialize the client's evaluation request.
     * Converts a serialized evaluation request (hex string) back into an `EvaluationRequest` object.
     * 
     * @param {string} serializedEvalReqHex - The serialized evaluation request from the client in hex format.
     * @returns {Promise<EvaluationRequest>} - The deserialized evaluation request object.
     */
    async deserializeEvaluationRequest(serializedEvalReqHex) {
        await this.ensureInitialized();
        const serializedEvalReq = hexToUint8Array(serializedEvalReqHex);
        return EvaluationRequest.deserialize(this.suite, serializedEvalReq);
    }

    /**
     * Serialize the evaluation response to be sent back to the client.
     * Converts an evaluation response object into a hex string format for transmission.
     * 
     * @param {Evaluation} evaluation - The evaluation object containing the result of the OPRF operation.
     * @returns {string} - The serialized evaluation response as a hex string.
     */
    serializeEvaluationResponse(evaluation) {
        const serializedResponse = evaluation.serialize();
        return uint8ArrayToHex(serializedResponse);
    }

    /**
     * Perform a blind evaluation of the client's request.
     * This evaluates the client's blinded input in a way that the server doesn't learn the input,
     * while still producing a valid response that the client can later unblind.
     * 
     * @param {EvaluationRequest} evalReq - The deserialized evaluation request from the client.
     * @returns {Promise<Evaluation>} - The evaluation result that the server generates.
     */
    async performBlindEvaluate(evalReq) {
        await this.ensureInitialized();
        return await this.server.blindEvaluate(evalReq);
    }
}

// Export the OPRFServerHandler class for use in other modules.
module.exports = OPRFServerHandler;
