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


const argon2 = require('argon2');
const crypto = require('crypto'); // For deterministic salt generation
const {ARGON2_MEMORY_COST, ARGON2_TIME_COST, ARGON2_PARALLELISM, ARGON2_HASH_LENGTH} = require("../config");

/**
 * Argon2id Hashing Utility with Fixed or Deterministic Salt
 * @param {...(Buffer|string)} inputs - Any number of Buffers or strings to hash together
 * @returns {Promise<string>} - The Argon2id hash of the concatenated input, as a hex string
 */
async function H(...inputs) {
  const outputLength = 32;

  try {
    // Convert inputs to Buffers
    const buffers = inputs.map(input => {
      if (typeof input === 'string') {
        // Check if the input is a valid hex string
        if (/^[0-9a-fA-F]+$/.test(input)) {
          return Buffer.from(input, 'hex');
        }
        // Otherwise, treat as UTF-8 encoded string
        return Buffer.from(input, 'utf-8');
      }
      return input; // Assume input is already a Buffer
    });

    // Combine all inputs into a single Buffer
    const combinedInput = Buffer.concat(buffers);

    // Generate a deterministic salt from the combined input
    const saltBuffer = crypto.createHash('sha256').update(combinedInput).digest();

    // Hash the combined input using Argon2id with the deterministic salt
    const hash = await argon2.hash(combinedInput, {
      type: argon2.argon2id,
      memoryCost: ARGON2_MEMORY_COST, 
      timeCost: ARGON2_TIME_COST,      
      parallelism: ARGON2_PARALLELISM, 
      hashLength: ARGON2_HASH_LENGTH, 
      salt: saltBuffer // Deterministic salt (This really f'ed up my mind 'cause I didn't know Argon2 uses internal random salts!)
    });

    // Extract and return only the raw hash from Argon2's output
    const rawHash = Buffer.from(hash.split('$').pop(), 'base64');
    return rawHash.toString('hex');
  } catch (error) {
    console.error('Error generating Argon2id hash:', error);
    throw new Error('Hash generation failed');
  }
}

module.exports = H;
