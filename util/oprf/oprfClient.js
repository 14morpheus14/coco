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


const { Evaluation, Oprf, OPRFClient: VoprfClient, FinalizeData } = require('@cloudflare/voprf-ts');
const { hexToUint8Array, uint8ArrayToHex } = require('../uint8Arrayutils.js');

class OPRFClientHandler {
    constructor() {
        // Using a 256-bit suite (P256_SHA256)...
        this.suite = Oprf.Suite.P256_SHA256;
        this.client = new VoprfClient(this.suite);
    }

    /**
     * Perform a blind operation on input data, preparing it for server evaluation.
     * 
     * @param {string|Uint8Array} input - The input for which the blind evaluation will be performed.
     * @returns {Object} - Contains hex strings for `serializedFinalizeData` (the blinded data) and `serializedEvalRequest` (the serialized evaluation request).
     */
    async prepareBlindEvaluation(input) {
        // Convert input to Uint8Array if it's a hex string
        const inputBytes = (typeof input === 'string') ? hexToUint8Array(input) : input;

        // Perform blind operation
        const [finalizeData, evalRequest] = await this.client.blind([inputBytes]);

        // Serialize the evaluation request
        const serializedEvalRequest = evalRequest.serialize();
        const serializedFinalizeData = finalizeData.serialize();
        
        // Convert to hex
        const hexFinalizeData = uint8ArrayToHex(serializedFinalizeData);
        const hexEvalRequest = uint8ArrayToHex(serializedEvalRequest)
        
        return { hexFinalizeData, hexEvalRequest };
    }

    /**
     * Deserialize the evaluation response received from the server.
     * 
     * @param {string} responseData - The hex data received from the server.
     * @returns {Evaluation} - The deserialized evaluation object.
     */
    deserializeEvaluationResponse(responseData) {
        return Evaluation.deserialize(this.suite, hexToUint8Array(responseData));
    }

    /**
     * Deserialize the finalize data.
     * 
     * @param {string} finalizeData - The hex format serialized finalize data.
     * @returns {FinalizeData} - The deserialized evaluation object.
     */
    deserializeFinalizeData(finalizeData) {
        return FinalizeData.deserialize(this.suite, hexToUint8Array(finalizeData));;
    }

    /**
     * Complete the OPRF process by finalizing the evaluation with the blinded data and server response.
     * 
     * @param {FinalizeData} finalizeData - The blinded input data in hex.
     * @param {Evaluation} deserializedEvaluation - The evaluation object received from the server.
     * @returns {string} - The finalized output from the OPRF process, as a hex string.
     */
    async completeEvaluation(finalizeData, deserializedEvaluation) {
        const [finalOutput] = await this.client.finalize(finalizeData, deserializedEvaluation);
        return uint8ArrayToHex(finalOutput); // Return the result as a hex string
    }
}

module.exports = OPRFClientHandler;
