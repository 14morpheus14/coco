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

// Defined constants
const MAX_ATTRIBUTES = 4; // Maximum number of attributes allowed (if you change this, you'll need to make changes to files in ./util/coco/)
const SALT_N_PEPPER_LENGTH = 32; // Length of the random salt/pepper (in bytes) 

// You can change these without much trouble, however:
const AUTHENTICATOR_TOKEN_VALIDITY = 60; // 1 minute
const VERIFIER_TOKEN_VALIDITY = 2592000; // Token validity period in seconds (30 days)

// Database collection names... (avoid editing GLOBAL_STORAGE_COLLECTION unless you are building the whole of coco in your own private network)
const CLIENT_STORAGE_COLLECTION = 'client_storage';
const AUTHENTICATOR_STORAGE_COLLECTION = 'auth_storage';
const GLOBAL_STORAGE_COLLECTION = 'global_storage';
const VERIFIER_METADATA_COLLECTION = 'meta';
const VERIFIER_PEPPER_COLLECTION = 'pepper';
const VERIFIER_USER2ID_COLLECTION = 'username_to_userid';
const VERIFIER_ID2DATA_COLLECTION = 'userid_to_userdata';

// Argon2id Fine Tuning...
const ARGON2_MEMORY_COST = 2 ** 17; // 128 MB for efficiency on most normal armv8 processors (For APT level resistance, use > 2 ** 18)
const ARGON2_TIME_COST = 3;         // Iterations
const ARGON2_PARALLELISM = 4;       // Threads
const ARGON2_HASH_LENGTH = 32;      // Length of the output hash


module.exports = {
    MAX_ATTRIBUTES, 
    SALT_N_PEPPER_LENGTH, 
    AUTHENTICATOR_TOKEN_VALIDITY, 
    VERIFIER_TOKEN_VALIDITY,
    CLIENT_STORAGE_COLLECTION,
    AUTHENTICATOR_STORAGE_COLLECTION,
    GLOBAL_STORAGE_COLLECTION,
    VERIFIER_METADATA_COLLECTION,
    VERIFIER_PEPPER_COLLECTION,
    VERIFIER_ID2DATA_COLLECTION,
    VERIFIER_USER2ID_COLLECTION,
    ARGON2_MEMORY_COST,
    ARGON2_TIME_COST,
    ARGON2_PARALLELISM,
    ARGON2_HASH_LENGTH
};
