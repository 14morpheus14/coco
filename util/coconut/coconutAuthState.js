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
 * CoconutAuthState class wraps the functionality of CoconutAuthState from the Coconut WASM wrapper.
 */
class CoconutAuthenticator {
    /**
     * Initializes the CoconutAuthState with a specified maxattribute.
     * @param {number} maxattribute - The max number of attributes to initialize for.
     */
    constructor(maxattribute) {
        const { CoconutAuthState } = require('@nymproject/coconut-wasm-wrapper');
        this.authState = new CoconutAuthState(maxattribute);
    }

    /**
     * Performs a blind signature operation and retrieves the verification key.
     * @param {string} blindSignRequest - The blind sign request object from the client.
     * @param {string} publicKey - The public key of the client.
     * @param {Array<object>} publicattributes - List of public attributes in rawAttribute.  
     * Example:
     * publicattributes = [
     *   { value: "priv_attr", is_private: false },
     *   { value: "pub_attr", is_private: false }
     * ];
     * @returns {object} An object containing the blind signature and verification key in hex.
     */
    signAndGetKey(blindSignRequest, publicKey, publicattributes) {
        // Get the signing authority's verification key
        const verificationKey = this.authState.get_signing_authority_verification_key;

        // Perform the blind signature operation
        const blindSignature = this.authState.blind_sign(blindSignRequest, publicKey, publicattributes);

        // Return both the blind signature and the verification key
        return {
            blindSignature,
            verificationKey,
        };
    }

    /**
     * Frees the memory allocated for the CoconutAuthState instance.
     */
    free() {
        this.authState.free();
    }
}

module.exports = CoconutAuthenticator;

