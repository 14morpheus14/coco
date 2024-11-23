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
 * CoconutSelfSignState class wraps the functionality of CoconutClientState and CoconutDeterministivAuthState from the Coconut WASM wrapper.
 */
class CoconutSelfSigner {
    /**
     * Initializes CoconutSelfSignState with the specified maxattribute.
     * @param {number} maxattribute - The max number of attributes to handle.
     * @param {string} private_key - The private key used to self blind sign in hex.
     */
    constructor(maxattribute, private_key) {
        const { CoconutDeterministicAuthState } = require('@nymproject/coconut-wasm-wrapper');
        const { hexToUint8Array } = require('../uint8Arrayutils.js');
        this.authState = new CoconutDeterministicAuthState(maxattribute, hexToUint8Array(private_key));
        const { CoconutClientState } = require('@nymproject/coconut-wasm-wrapper');
        this.clientState = new CoconutClientState(maxattribute);
    }

    /**
     * Prepares a blind sign request, performs self-blind signing, unblinds the signature,
     * randomizes the credential, and generates a proof.
     * @param {Array<object>} rawAttributes - Attributes with `value` and `is_private` properties.
     * Example:
     * rawAttributes = [
     *   { value: "priv_attr", is_private: true },
     *   { value: "pub_attr", is_private: false }
     * ];
     * @returns {object} An object containing the randomized credential, public attributes, verification key and proof.
     */
    selfSignAndProve(rawAttributes) {
        // Step 1: Configure the client state and prepare the blind sign request
        this.clientState.raw_attributes = rawAttributes;
        const publicAttributes = rawAttributes.filter(attr => !attr.is_private);

        // Prepare the blind sign request
        const blindSignRequest = this.clientState.prepare_blind_sign();

        // Get the public key
        const publicKey = this.clientState.get_client_public_key;

        // Get the signing authority's verification key
        const verificationKey = this.authState.get_signing_authority_verification_key;

        // Perform the blind signature operation
        const blindSignature = this.authState.blind_sign(blindSignRequest, publicKey, publicAttributes);

        // Single blindSignature is provided, use it directly
        const issuedSignature = this.clientState.unblind([blindSignature]);
        const aggregatedCredential = issuedSignature[0].unblinded;

        // Randomize the credential
        const randomizedCredential = this.clientState.randomise_credential(aggregatedCredential);

        // Generate proof of possession of the credential
        const proof = this.clientState.prove_credential(verificationKey, randomizedCredential);

        // Step 5: Return the randomized credential and the proof
        return {
            randomizedCredential,
            publicAttributes,
            verificationKey,
            proof,
        };
    }

    /**
     * Frees the memory allocated for both the client and auth states.
     */
    free() {
        this.clientState.free();
        this.authState.free();
    }
}

module.exports = CoconutSelfSigner;
