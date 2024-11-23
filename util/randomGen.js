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



const crypto = require('crypto');

/**
 * Generates a random string with enhanced entropy.
 * @param {number} length - Desired length in bytes.
 * @returns {string} A hex-encoded random string.
 */
function generateSecureRandom(length) {
    if (typeof length !== 'number' || length <= 0) {
        throw new Error('Length must be a positive number.');
    }

    // Base randomness from system CSPRNG
    const randomBytes = crypto.randomBytes(length);

    // Add current timestamp as additional entropy
    const timestampEntropy = Buffer.from(Date.now().toString()); // Convert timestamp to Buffer

    // Combine randomness and timestamp
    const combinedEntropy = Buffer.concat([randomBytes, timestampEntropy]);

    // Hash the combined entropy to ensure uniform distribution
    const secureRandom = crypto.createHash('sha512').update(combinedEntropy).digest(); // hihihihi... I used sha512 for more even distribution
                                                                                       // you can tune it down if you want to.
    // Return the result in hex format, trimmed to the desired length
    return secureRandom.toString('hex').slice(0, length * 2); // Each byte = 2 hex chars
}

module.exports = generateSecureRandom;
