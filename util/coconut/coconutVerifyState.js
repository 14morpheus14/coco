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
 * CoconutVerifyState class wraps the functionality of CoconutVerifyState from the Coconut WASM wrapper.
 */
class CoconutVerifier {
    /**
     * Initializes the CoconutVerifyState with a specified maxattribute.
     * @param {number} maxattribute - The max number of attributes to initialize for.
     */
    constructor(maxattribute) {
        const { CoconutVerifyState } = require('@nymproject/coconut-wasm-wrapper');
        this.verifyState = new CoconutVerifyState(maxattribute);
    }

    /**
     * Verifies the validity of a credential using an aggregated or single verification key.
     * If multiple verification keys are provided, they are aggregated first.
     * @param {Array<string>|string} verificationKeys - List of verification keys to aggregate or a single verification key.
     * @param {string} proof - The NIZK proof of credential (can be/should be randomized).
     * @param {Array<object>} publicattributes - Public attributes for verification (e.g., timestamp).
     * Example:
     * publicattributes = [
     *   { value: "pub_attr1", is_private: false },
     *   { value: "pub_attr2", is_private: false }
     * ];
     * @returns {boolean} True if the credential is valid; otherwise, false.
     */
    aggregateAndVerify(verificationKeys, proof, publicattributes) {
        let aggregatedKey;

        if (Array.isArray(verificationKeys)) {
            // If it's an array, aggregate the keys
            aggregatedKey = this.verifyState.aggregate_verification_keys(verificationKeys);
        } else {
            // If a single key is provided, use it directly
            aggregatedKey = verificationKeys;
        }

        // Verify the credential
        return this.verifyState.verify_credential(aggregatedKey, proof, publicattributes);
    }

    /**
     * Frees the memory allocated for the CoconutVerifyState instance.
     */
    free() {
        this.verifyState.free();
    }
}

module.exports = CoconutVerifier;
