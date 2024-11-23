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

/**
 * CoconutClientState class wraps the functionality of CoconutClientState from the Coconut WASM wrapper.
 */
class CoconutClient {
    /**
     * Initializes the CoconutClientState with a specified maxattribute.
     * @param {number} maxattribute - The max number of attributes to initiate for.
     */
    constructor(maxattribute) {
        const { CoconutClientState } = require('@nymproject/coconut-wasm-wrapper');
        this.clientState = new CoconutClientState(maxattribute);
    }

    /**
     * Sets raw attributes for the client and prepares the blind sign request.
     * Returns the client's public key and the blind sign request in hex.
     * @param {Array<object>} rawAttributes - List of attributes with `value` and `is_private` properties:
     * Example:
     * rawAttributes = [
     *   { value: "priv_attr", is_private: true },
     *   { value: "pub_attr", is_private: false }
     * ];
     * @returns {object} Contains the public key, the public attributes and the blind sign request in hex.
     */
    configureAndPrepareSign(rawAttributes) {
        // Set the raw attributes
        this.clientState.raw_attributes = rawAttributes;
        const publicAttributes = rawAttributes.filter(attr => !attr.is_private);

        // Prepare the blind sign request
        const blindSignRequest = this.clientState.prepare_blind_sign();

        // Get the public key
        const publicKey = this.clientState.get_client_public_key;
        // Return all the required information in an object
        return {
            publicKey,
            publicAttributes,
            blindSignRequest,
        };
    }

    /**
     * Combines unblinding, signature aggregation, verification key aggregation, credential randomization, and proof generation.
     * @param {Array<string>|string} blindSignatures - List of blind signatures or a single blinded signature.
     * @param {Array<string>|string} verificationKeys - List of verification keys or a single verification key.
     * @returns {object} An object containing the proof, the randomized credential and aggregated verification key.
     */
    processAndProveCredential(blindSignatures, verificationKeys) {
        // Step 1: Unblind the signatures and aggregate them
        let aggregatedCredential;
        if (Array.isArray(blindSignatures)) {
            // If it's an array, aggregate the signatures
            const issuedSignatures = this.clientState.unblind(blindSignatures);
            aggregatedCredential = this.clientState.aggregate_signature_shares(issuedSignatures);
        }else {
            // If a single blindSignature is provided, use it directly
            const issuedSignature = this.clientState.unblind([blindSignatures]);
            aggregatedCredential = issuedSignature[0].unblinded;
        }

        // Step 2: Aggregate the verification keys
        let aggregatedVerificationKey;
        if (Array.isArray(verificationKeys)) {
            // If it's an array, aggregate the keys
            aggregatedVerificationKey = this.clientState.aggregate_verification_keys(verificationKeys);
        } else {
            // If a single key is provided, use it directly
            aggregatedVerificationKey = verificationKeys;
        }

        // Step 3: Randomize the credential
        const randomizedCredential = this.clientState.randomise_credential(aggregatedCredential);

        // Step 4: Generate proof of possession of the credential
        const proof = this.clientState.prove_credential(aggregatedVerificationKey, randomizedCredential);

        // Return both proof and randomized credential
        return {
            proof,
            randomizedCredential,
            aggregatedVerificationKey,
        };
    }

        /**
     * Combines unblinding, signature aggregation, verification key aggregation, credential randomization, and proof generation.
     * @param {string} aggregatedCredential - a single aggregated signature.
     * @param {string} aggregatedVerificationKey - a single aggregated verification key.
     * @returns {object} An object containing the proof, the randomized credential and aggregated verification key.
     */
    generateNewProofOfCredential(aggregatedCredential, aggregatedVerificationKey) {

        // Step 3: Randomize the credential
        const randomizedCredential = this.clientState.randomise_credential(aggregatedCredential);

        // Step 4: Generate proof of possession of the credential
        const proof = this.clientState.prove_credential(aggregatedVerificationKey, randomizedCredential);

        // Return both proof and randomized credential
        return {
            proof,
            randomizedCredential,
            aggregatedVerificationKey,
        };
    }

    /**
     * Frees the memory allocated for the CoconutClientState instance.
     */
    free() {
        this.clientState.free();
    }
}

module.exports = CoconutClient;
