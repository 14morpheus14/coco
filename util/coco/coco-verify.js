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
const generateSecureRandom = require("../randomGen.js");
const {MAX_ATTRIBUTES, SALT_N_PEPPER_LENGTH, VERIFIER_TOKEN_VALIDITY, AUTHENTICATOR_TOKEN_VALIDITY} = require("../../config.js");

class COCOVerifyState {
    constructor() {
        try {
            // Initialize a CoconutVerifier instance with the maximum allowed attributes
            this.coconutVerifier = new CoconutVerifier(MAX_ATTRIBUTES);
            this.coconutAuthenticator = new CoconutAuthenticator(MAX_ATTRIBUTES);
        } catch (error) {
            console.error("Failed to initialize CoconutVerifier:", error.message);
            // Continue operation even if initialization fails
        }
    }

    /**
     * Generate a random buffer of the given length.
     * This is used to produce a secure random salt/pepper value.
     * @private
     * @param {number} length - The length of the random string to generate in bytes.
     * @returns {string|null} - A securely generated random hex string, or null on error.
     */
    _generateRandom(length) {
        try {
            return generateSecureRandom(length);
        } catch (error) {
            console.error("Error generating secure random string:", error.message);
            return null; // Return a fallback value instead of throwing
        }
    }

    /**
     * Verify the client's credential proof.
     * This method aggregates and verifies the provided proof and attributes.
     * @private
     * @param {Array<string>|string} verificationKeys - The verification keys used to verify the proof.
     * @param {string} proof - The proof provided by the client.
     * @param {Array<Object>} clientPublicAttributes - The public attributes provided by the client.
     * @returns {boolean} - True if the proof is valid, false otherwise.
     */
    _verifyProof(verificationKeys, proof, clientPublicAttributes) {
        try {
            return this.coconutVerifier.aggregateAndVerify(verificationKeys, proof, clientPublicAttributes);
        } catch (error) {
            console.error("Proof verification failed:", error.message);
            return false; // Gracefully handle verification failure
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

    // -----------------------------------------------------------------------------------------------------
    // Public Methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Step 1 of the COCO verification process: Generate a random salt/pepper.
     * @returns {string|null} - A securely generated random hex string, or null on error.
     */
    coco_verifier_step_0() {
        try {
            return this._generateRandom(SALT_N_PEPPER_LENGTH);
        } catch (error) {
            console.error("Error in coco_verifier_step_1:", error.message);
            return null; // Return null instead of throwing
        }
    }

    /**
     * Perform the first step of the verifier process: Validate client attributes and generate a blind signature.
     * @param {string} blindSignRequest - The client's blind signature request.
     * @param {string} clientPublicKey - The client's public key.
     * @param {Array<Object>} clientPublicAttributes - The public attributes provided by the client.
     * @returns {Object} An object containing:
     * @property {string} blindSignature - The generated blind signature.
     * @property {string} verificationKey - The verification key for the signature.
     * @throws Will throw an error if `iat`, `exp`, or `scope` are invalid.
     */
    coco_verifier_step_1(blindSignRequest, clientPublicKey, clientPublicAttributes) {
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
            
            return this._generateBlindSignature(blindSignRequest, clientPublicKey, clientPublicAttributes);
        } catch (error) {
            console.error("Error in coco_authenticator_step_2:", error.message);
            return { error: "Failed to issue blind signature." };
        }
    }

    /**
     * Step 2 of the COCO verification process: Verify client credentials.
     * @param {Array<string>|string} verificationKeys - The verification keys, or a single verification key used to verify the proof.
     * @param {string} proof - The proof provided by the client.
     * @param {Array<Object>} clientPublicAttributes - The public attributes provided by the client.
     * @returns {boolean} - True if the proof is valid, false otherwise.
     */
    coco_verifier_step_2(verificationKeys, proof, clientPublicAttributes) {
        try {
            if (!Array.isArray(clientPublicAttributes) || !Array.isArray(verificationKeys)) {
                if (typeof verificationKeys !== 'string' || !verificationKeys.trim()) {
                    return {error: "Input verification key must be of the correct data type."};
                }else{
                    return {error: "Input parameters must be of the correct data type."};
                }
            }

            // Extract the `iat`, `exp`, and `scope` attributes dynamically
            const iatAttr = clientPublicAttributes.find(attr =>
                !attr.is_private &&
                attr.value !== undefined &&
                typeof attr.value === "string" &&
                !isNaN(Number(attr.value))
            );

            const expAttr = clientPublicAttributes.find(attr =>
                !attr.is_private &&
                attr.value !== undefined &&
                typeof attr.value === "string" &&
                !isNaN(Number(attr.value)) &&
                Number(attr.value) > (Number(iatAttr?.value) || 0)
            );

            const scopeAttr = clientPublicAttributes.find(attr =>
                !attr.is_private && attr.value === "access:uid"
            );

            const currentTime = Math.floor(Date.now() / 1000); // Get current time in seconds

            // Parse `iat` and `exp` values as numbers for validation
            const iatValue = iatAttr ? Number(iatAttr.value) : NaN;
            const expValue = expAttr ? Number(expAttr.value) : NaN;

            // Validate the `iat` (issued at) attribute
            if (isNaN(iatValue) || iatValue > currentTime) {
                return { error: "Invalid `iat` attribute." };
            }

            // Validate the `exp` (expiration) attribute
            if (isNaN(expValue) || currentTime >= expValue || expValue - iatValue > VERIFIER_TOKEN_VALIDITY) {
                return { error: "Invalid `exp` attribute." };
            }

            // Validate the `scope` attribute
            if (!scopeAttr) {
                return { error: "Invalid `scope` attribute." };
            }

            // All attribute checks passed; proceed to proof verification
            const isValid = this._verifyProof(verificationKeys, proof, clientPublicAttributes);

            if (isValid) {
                console.warn("Proof verification succesful!");
                return true;
            } else {
                console.warn("Proof verification failed.");
                return false;
            }
        } catch (error) {            
            console.error("Error in coco_verifier_step_2:", error.message);
            return { error: "Failed to verify access." };
        }
    }
}

// Export the COCOVerifyState class for external use
module.exports = COCOVerifyState;
