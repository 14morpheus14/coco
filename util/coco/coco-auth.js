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


'use strict';

const CoconutAuthenticator = require("../coconut/coconutAuthState.js");
const CoconutVerifier = require("../coconut/coconutVerifyState.js");
const OPRFServerHandler = require("../oprf/oprfServer.js");
const {MAX_ATTRIBUTES, AUTHENTICATOR_TOKEN_VALIDITY} = require("../../config.js");

class COCOAuthState {
    /**
     * Initializes the COCOAuthState instance.
     * @param {string|null} [authenticator_private_key=null] - The optional private key for the authenticator.
     */
    constructor(authenticator_private_key = null) {
        try {
            this.coconutAuthenticator = new CoconutAuthenticator(MAX_ATTRIBUTES);
            this.coconutVerifier = new CoconutVerifier(MAX_ATTRIBUTES);
            this.oprfServer = new OPRFServerHandler(authenticator_private_key);
        } catch (error) {
            console.error("Initialization Error:", error.message);
            this.coconutAuthenticator = null;
            this.coconutVerifier = null;
            this.oprfServer = null;
        }
    }

    /**
     * Retrieve the OPRF private key.
     * @private
     * @returns {Promise<string>} The private key as a hexadecimal string.
     */
    async _getOPRFPrivateKey() {
        if (!this.oprfServer) {
            console.error("OPRF Server is not initialized.");
            return { error: "OPRF Server not initialized." };
        }

        try {
            return await this.oprfServer.getPrivateKey();
        } catch (error) {
            console.error("Error retrieving OPRF private key:", error.message);
            return { error: "Failed to retrieve OPRF private key." };
        }
    }

    /**
     * Generate a blind signature using CoconutAuthenticator.
     * @private
     * @param {string} blindSignRequest - The client's blind signature request.
     * @param {string} clientPublicKey - The client's public key.
     * @param {Array<Object>} clientPublicAttributes - The public attributes provided by the client.
     * @returns {Object} An object containing:
     * @property {string} blindSignature - The generated blind signature.
     * @property {string} verificationKey - The corresponding verification key.
     */
    _generateBlindSignature(blindSignRequest, clientPublicKey, clientPublicAttributes) {
        if (!this.coconutAuthenticator) {
            console.error("Coconut Authenticator is not initialized.");
            return { error: "Coconut Authenticator not initialized." };
        }

        try {
            const { blindSignature, verificationKey } = this.coconutAuthenticator.signAndGetKey(
                blindSignRequest,
                clientPublicKey,
                clientPublicAttributes
            );
            return { blindSignature, verificationKey };
        } catch (error) {            
            console.error("Error generating blind signature:", error.message);
            return { error: "Failed to generate blind signature." };
        }
    }

    /**
     * Verify the client's credential proof.
     * @private
     * @param {Array<string>} verificationKeys - The verification keys used to verify the proof.
     * @param {string} proof - The proof provided by the client.
     * @param {Array<Object>} clientPublicAttributes - The public attributes provided by the client.
     * @returns {boolean} True if the proof is valid, false otherwise.
     */
    _verifyProof(verificationKeys, proof, clientPublicAttributes) {
        if (!this.coconutVerifier) {
            console.error("Coconut Verifier is not initialized.");
            return false;
        }

        try {
            return this.coconutVerifier.aggregateAndVerify(verificationKeys, proof, clientPublicAttributes);
        } catch (error) {
            console.error("Error verifying proof:", error.message);
            return false;
        }
    }

    /**
     * Perform an OPRF evaluation on the client's serialized evaluation request.
     * @private
     * @param {string} serializedEvalReq - The serialized evaluation request from the client.
     * @returns {Promise<string>} The serialized evaluation response as a hexadecimal string.
     */
    async _performOPRFEval(serializedEvalReq) {
        if (!this.oprfServer) {
            console.error("OPRF Server is not initialized.");
            return { error: "OPRF Server not initialized." };
        }

        try {
            const evalReq = await this.oprfServer.deserializeEvaluationRequest(serializedEvalReq);
            const evaluation = await this.oprfServer.performBlindEvaluate(evalReq);
            return this.oprfServer.serializeEvaluationResponse(evaluation);
        } catch (error) {
            console.error("Error performing OPRF evaluation:", error.message);
            return { error: "Failed to perform OPRF evaluation." };
        }
    }

    // -----------------------------------------------------------------------------------------------------
    // Public Methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Perform the zero-th step of the authenticator process: Validate registration access attributes and proof.
     * @param {Array<string>} verificationKeys - The verification keys used to verify the proof.
     * @param {string} proof - The proof provided by the client.
     * @param {Array<Object>} clientPublicAttributes - The public attributes provided by the client.
     * @returns {boolean} True if proof is valid.
     * @throws Will throw an error if attributes or proof are invalid.
     */
    async coco_authenticator_step_0(verificationKeys, proof, clientPublicAttributes, EvalReq) {
        try {
            if (typeof proof !== 'string' || !proof.trim()) {
                return {error: "Invalid proof."};
            }
            if (!Array.isArray(clientPublicAttributes) || !Array.isArray(verificationKeys)) {
                return {error: "Input parameters must be of the correct data type."};
            }

            const currentTime = Math.floor(Date.now() / 1000);
            const iatAttr = clientPublicAttributes.find(attr => typeof attr.value === "string" && !isNaN(Number(attr.value)));
            const expAttr = clientPublicAttributes.find(attr => Number(attr.value) > (Number(iatAttr?.value) || 0));
            const scopeAttr = clientPublicAttributes.find(attr => attr.value === "register:uid");

            if (!iatAttr || Number(iatAttr.value) > currentTime) {
                return { error: "Invalid `iat` attribute." };
            }
            if (!expAttr || Number(expAttr.value) - Number(iatAttr.value) > AUTHENTICATOR_TOKEN_VALIDITY) {
                return { error: "Invalid `exp` attribute." };
            }
            if (!scopeAttr) {
                return { error: "Invalid `scope` attribute." };
            }
            
            if (this._verifyProof(verificationKeys, proof, clientPublicAttributes)) {
                return true;
            } else {
                return { error: "Proof verification failed." };
            }

        } catch (error) {
            console.error("Error in coco_authenticator_step_0:", error.message);
            return { error: "Failed to verify registration access rights." };
        }
    }

    /**
     * Perform the first step of the authenticator process by retrieving the private key.
     * @returns {Promise<string>} The authenticator's private key as a hexadecimal string.
     */
    async coco_authenticator_step_1() {
        const result = await this._getOPRFPrivateKey();
        if (result.error) {
            console.error("Error in coco_authenticator_step_1:", result.error);
        }
        return result;
    }

    /**
     * Perform the second step of the authenticator process: Validate client attributes and generate a blind signature.
     * @param {string} blindSignRequest - The client's blind signature request.
     * @param {string} clientPublicKey - The client's public key.
     * @param {Array<Object>} clientPublicAttributes - The public attributes provided by the client.
     * @returns {Object} An object containing:
     * @property {string} blindSignature - The generated blind signature.
     * @property {string} verificationKey - The verification key for the signature.
     * @throws Will throw an error if `iat`, `exp`, or `scope` are invalid.
     */
    coco_authenticator_step_2(blindSignRequest, clientPublicKey, clientPublicAttributes) {
        try {
            if (typeof blindSignRequest !== 'string' || !blindSignRequest.trim()) {
                return { error: "Invalid blind signature request." };
            }
            if (typeof clientPublicKey !== 'string' || !clientPublicKey.trim()) {
                return { error: "Invalid client public key." };
            }
            if (!Array.isArray(clientPublicAttributes)) {
                return { error: "Invalid client public attributes." };
            }

            const currentTime = Math.floor(Date.now() / 1000);
            const iatAttr = clientPublicAttributes.find(attr => typeof attr.value === "string" && !isNaN(Number(attr.value)));
            const expAttr = clientPublicAttributes.find(attr => Number(attr.value) > (Number(iatAttr?.value) || 0));
            const scopeAttr = clientPublicAttributes.find(attr => attr.value === "evaluate:OPRF");

            if (!iatAttr || Number(iatAttr.value) > currentTime) {
                return { error: "Invalid `iat` attribute." };
            }
            if (!expAttr || Number(expAttr.value) - Number(iatAttr.value) > AUTHENTICATOR_TOKEN_VALIDITY) {
                return { error: "Invalid `exp` attribute." };
            }
            if (!scopeAttr) {
                return { error: "Invalid `scope` attribute." };
            }
            
            return this._generateBlindSignature(blindSignRequest, clientPublicKey, clientPublicAttributes);
        } catch (error) {
            console.error("Error in coco_authenticator_step_2:", error.message);
            return { error: "Failed to issue blind signature." };
        }
    }

    /**
     * Perform the third step of the authenticator process: Validate client attributes, verify proof, and evaluate OPRF.
     * @param {Array<string>} verificationKeys - The verification keys used to verify the proof.
     * @param {string} proof - The proof provided by the client.
     * @param {Array<Object>} clientPublicAttributes - The public attributes provided by the client.
     * @param {string} EvalReq - The serialized evaluation request from the client.
     * @returns {Promise<Object>} An object containing:
     * @property {string} OPRFEvaluation - The serialized OPRF evaluation response.
     * @throws Will throw an error if attributes or proof are invalid.
     */
    async coco_authenticator_step_3(verificationKeys, proof, clientPublicAttributes, EvalReq) {
        try {
            if (typeof proof !== 'string' || !proof.trim()) {
                return {error: "Invalid proof."};
            }
            if (typeof EvalReq !== 'string' || !EvalReq.trim()) {
                return {error: "Invalid evaluation request."};
            }
            if (!Array.isArray(clientPublicAttributes) || !Array.isArray(verificationKeys)) {
                return {error: "Input parameters must be of the correct data type."};
            }

            const currentTime = Math.floor(Date.now() / 1000);
            const iatAttr = clientPublicAttributes.find(attr => typeof attr.value === "string" && !isNaN(Number(attr.value)));
            const expAttr = clientPublicAttributes.find(attr => Number(attr.value) > (Number(iatAttr?.value) || 0));
            const scopeAttr = clientPublicAttributes.find(attr => attr.value === "evaluate:OPRF");

            if (!iatAttr || Number(iatAttr.value) > currentTime) {
                return { error: "Invalid `iat` attribute." };
            }
            if (!expAttr || Number(expAttr.value) - Number(iatAttr.value) > AUTHENTICATOR_TOKEN_VALIDITY) {
                return { error: "Invalid `exp` attribute." };
            }
            if (!scopeAttr) {
                return { error: "Invalid `scope` attribute." };
            }
            
            if (this._verifyProof(verificationKeys, proof, clientPublicAttributes)) {
                return await this._performOPRFEval(EvalReq);
            } else {
                return { error: "Proof verification failed." };
            }

        } catch (error) {
            console.error("Error in coco_authenticator_step_3:", error.message);
            return { error: "Failed to OPRF evaluate." };
        }
    }

    /**
     * Perform the fourth step of the authenticator process: Validate attributes, verify proof, and issue resource access.
     * @param {string} verificationKey - The verification key for the proof.
     * @param {string} proof - The proof provided by the client.
     * @param {Array<Object>} clientPublicAttributes - The public attributes provided by the client.
     * @param {string} blindSignRequest - The client's blind signature request.
     * @param {string} clientPublicKey - The client's public key.
     * @param {Array<Object>} userPublicAttributes - The user's public attributes.
     * @returns {Object} An object containing:
     * @property {string} blindSignature - The generated blind signature for the resource.
     * @property {string} verificationKey - The corresponding verification key.
     * @throws Will throw an error if attributes or proof are invalid.
     */
    coco_authenticator_step_4(verificationKey, proof, clientPublicAttributes, blindSignRequest, clientPublicKey, userPublicAttributes) {
        try {
            if (typeof verificationKey !== 'string' || !verificationKey.trim()) {
                return {error: "Invalid verification key."};
            }
            if (typeof proof !== 'string' || !proof.trim()) {
                return {error: "Invalid proof."};
            }
            if (typeof blindSignRequest !== 'string' || !blindSignRequest.trim()) {
                return { error: "Invalid blind signature request." };
            }
            if (typeof clientPublicKey !== 'string' || !clientPublicKey.trim()) {
                return { error: "Invalid client public key." };
            }
            if (!Array.isArray(clientPublicAttributes) || !Array.isArray(userPublicAttributes)) {
                return {error: "Input parameters must be of the correct data type."};
            }

            const currentTime = Math.floor(Date.now() / 1000);
            const iatAttr = clientPublicAttributes.find(attr => typeof attr.value === "string" && !isNaN(Number(attr.value)));
            const expAttr = clientPublicAttributes.find(attr => Number(attr.value) > (Number(iatAttr?.value) || 0));
            const scopeAttr = clientPublicAttributes.find(attr => attr.value === "prove:identity");

            if (!iatAttr || Number(iatAttr.value) > currentTime) {
                return { error: "Invalid `iat` attribute." };
            }
            if (!expAttr || Number(expAttr.value) - Number(iatAttr.value) > AUTHENTICATOR_TOKEN_VALIDITY) {
                return { error: "Invalid `exp` attribute." };
            }
            if (!scopeAttr) {
                return { error: "Invalid `scope` attribute." };
            }

            if (this._verifyProof(verificationKey, proof, clientPublicAttributes)) {
                return this._generateBlindSignature(blindSignRequest, clientPublicKey, userPublicAttributes);
            } else {
                return { error: "Proof verification failed." };
            }
        } catch (error) {
            console.error("Error in coco_authenticator_step_4:", error.message);
            return { error: "Failed to issue resource access." };
        }
    }  
}

module.exports = COCOAuthState;