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


const { v4: uuidv4 } = require('uuid'); // For generating unique user IDs
const COCOVerifyState = require("../util/coco/coco-verify");
const {
    GLOBAL_STORAGE_COLLECTION, 
    VERIFIER_METADATA_COLLECTION, 
    VERIFIER_PEPPER_COLLECTION, 
    VERIFIER_USER2ID_COLLECTION, 
    VERIFIER_ID2DATA_COLLECTION
} = require("../config");

function verifier(localDB, globalDB) {
    const verifier = new COCOVerifyState();

    // Database interaction helpers
    const getFromStorage = async (collection, key) => {
        try {
            const [data] = await new Promise((resolve, reject) => {
                localDB.retrieve(collection, { key }, (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });
            return data?.value || null;
        } catch (error) {
            console.error("Error retrieving from storage:", error);
            return null;
        }
    };

    const updateInStorage = async (collection, key, updates) => {
        try {
            const updateResult = await new Promise((resolve, reject) => {
                localDB.update(collection, { key }, updates, (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });
            return updateResult;
        } catch (error) {
            console.error("Error updating in storage:", error);
            return null;
        }
    };
    const setInStorage = async (collection, key, value) => {
        try {
            await new Promise((resolve, reject) => {
                localDB.save(collection, { key, value }, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            return { success: true };
        } catch (error) {
            console.error("Error setting in storage:", error);
            return { error };
        }
    };

    const deleteFromStorage = async (collection, key) => {
        try {
            await new Promise((resolve, reject) => {
                localDB.delete(collection, { key }, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            return { success: true };
        } catch (error) {
            console.error("Error deleting from storage:", error);
            return { error };
        }
    };

    const getFromGlobalStorage = async (key) => {
        try {
            const [data] = await new Promise((resolve, reject) => {
                globalDB.retrieve(GLOBAL_STORAGE_COLLECTION, { key }, (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });
            return data?.value || null;
        } catch (error) {
            console.error("Error retrieving from global storage:", error);
            return null;
        }
    };

    const setInGlobalStorage = async (key, value) => {
        try {
            await new Promise((resolve, reject) => {
                globalDB.save(GLOBAL_STORAGE_COLLECTION, { key, value }, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            return { success: true };
        } catch (error) {
            console.error("Error setting in global storage:", error);
            return { error };
        }
    };

    const initPepper = async () => {
        const existingPepper = await getFromStorage(VERIFIER_METADATA_COLLECTION, VERIFIER_PEPPER_COLLECTION);
        if (!existingPepper) {
            const newPepper = verifier.coco_verifier_step_0();
            await setInStorage(VERIFIER_METADATA_COLLECTION, VERIFIER_PEPPER_COLLECTION, newPepper);
        }
    };

    const isVerificationSuccessful = (result) => {
        if (result && typeof result === 'object' && result.error) {
            console.warn("Verification failed with error:", result.error);
            return false;
        }
        return result === true;
    };

    // Initialize the pepper
    initPepper();

    return {
        handleRegistrationRequest: async (username, blindSignRequest, publicKey, publicAttributes) => {
            const userMapping = await getFromStorage(VERIFIER_USER2ID_COLLECTION, username);
            const pepper = await getFromStorage(VERIFIER_METADATA_COLLECTION, VERIFIER_PEPPER_COLLECTION);

            if (userMapping) {
                return { exists: true, userId: userMapping.userId };
            }

            const userId = uuidv4();
            const result = verifier.coco_verifier_step_1(blindSignRequest, publicKey, publicAttributes);

            if (result.error) {
                console.error("Blind Signature Request Failed:", result.error);
                return { error: true };
            }

            await setInGlobalStorage(result.verificationKey, result.verificationKey);

            return {
                exists: false,
                userId,
                pepper,
                Signature: result.blindSignature,
                VK: result.verificationKey,
            };
        },

        handleLoginRequest: async (username) => {
            const userMapping = await getFromStorage(VERIFIER_USER2ID_COLLECTION, username);

            if (!userMapping) {
                return { exists: false };
            }

            const userId = userMapping.userId;
            const userData = await getFromStorage(VERIFIER_ID2DATA_COLLECTION, userId);
            const pepper = await getFromStorage(VERIFIER_METADATA_COLLECTION, VERIFIER_PEPPER_COLLECTION);

            return {
                exists: true,
                userId,
                salts: userData?.Salts,
                pepper,
            };
        },

        completeRegistration: async (username, userId, salts, VerificationKeys, AccessTokenProof, PublicAttributes) => {
            const userMapping = await getFromStorage(VERIFIER_USER2ID_COLLECTION, username);

            if (userMapping) {
                return { exists: true, userId: userMapping.userId };
            }

            const ValidatedVerificationKeys = [];
            for (const key of VerificationKeys) {
                const fetchedKey = await getFromGlobalStorage(key);
                if (!fetchedKey) {
                    return { error: `Verification key ${key} invalid or missing` };
                }
                ValidatedVerificationKeys.push(fetchedKey);
            }

            const verificationResult = verifier.coco_verifier_step_2(
                ValidatedVerificationKeys,
                AccessTokenProof,
                PublicAttributes
            );

            if (isVerificationSuccessful(verificationResult)) {
               
                await setInStorage(VERIFIER_USER2ID_COLLECTION, username, { userId });
                await setInStorage(VERIFIER_ID2DATA_COLLECTION, userId, { Salts: salts, VerificationKeys: ValidatedVerificationKeys });
                return { registered: true };
            }
            return { registered: false };
        },

        completeLogin: async (username, VerificationKeys, AccessTokenProof, PublicAttributes) => {
            const userMapping = await getFromStorage(VERIFIER_USER2ID_COLLECTION, username);

            if (!userMapping) {
                return { exists: false };
            }

            const ValidatedVerificationKeys = [];
            for (const key of VerificationKeys) {
                const fetchedKey = await getFromGlobalStorage(key);
                if (!fetchedKey) {
                    return { error: `Verification key ${key} invalid or missing` };
                }
                ValidatedVerificationKeys.push(fetchedKey);
            }

            const verificationResult = verifier.coco_verifier_step_2(
                ValidatedVerificationKeys,
                AccessTokenProof,
                PublicAttributes
            );

            if (isVerificationSuccessful(verificationResult)) {
                const userId = userMapping.userId;
                await updateInStorage(VERIFIER_ID2DATA_COLLECTION, userId, {VerificationKeys: ValidatedVerificationKeys});
        
                return { logged: true };
            }
            return { logged: false };
        },

        credentialLogin: async (username, VerificationKeys, AccessTokenProof, PublicAttributes) => {
            const userMapping = await getFromStorage(VERIFIER_USER2ID_COLLECTION, username);

            if (!userMapping) {
                console.log("username not found");
                return { exists: false };
            }

            const userId = userMapping.userId;
            const userData = await getFromStorage(VERIFIER_ID2DATA_COLLECTION, userId);
            const verificationKeys = userData.VerificationKeys;
            //console.log("user data", userData);
            //console.log("Verification Keys:", verificationKeys);
            for (let i = 0; i < verificationKeys.length; i++) {
                if (verificationKeys[i] !== VerificationKeys[i]) {
                    return {error: "Verification Keys Mismatch"}; // Mismatch found
                }
            }
            
            const verificationResult = verifier.coco_verifier_step_2(
                verificationKeys,
                AccessTokenProof,
                PublicAttributes
            );

            if (isVerificationSuccessful(verificationResult)) { // prolly verification keys expired, login again
                return { logged: true };
            }
            return { logged: false };
        },

        handleUpdateSaltsRequest: async (username, new_salts, VerificationKeys, AccessTokenProof, PublicAttributes) => {
            const userMapping = await getFromStorage(VERIFIER_USER2ID_COLLECTION, username);

            if (!userMapping) {
                return { error: "User not found" };
            }

            const userId = userMapping.userId;

            const ValidatedVerificationKeys = [];
            for (const key of VerificationKeys) {
                const fetchedKey = await getFromGlobalStorage(key);
                if (!fetchedKey) {
                    return { error: `Verification key ${key} invalid or missing` };
                }
                ValidatedVerificationKeys.push(fetchedKey);
            }

            const verificationResult = verifier.coco_verifier_step_2(
                ValidatedVerificationKeys,
                AccessTokenProof,
                PublicAttributes
            );

            if (isVerificationSuccessful(verificationResult)) {
                const userData = await getFromStorage(VERIFIER_ID2DATA_COLLECTION, userId);
                if (userData) {
                    userData.Salts = new_salts;
                    await setInStorage(VERIFIER_ID2DATA_COLLECTION, userId, userData);
                    return { updated: true };
                }
            }
            return { updated: false };
        },

        handleDeleteUserRequest: async (username, VerificationKeys, AccessTokenProof, PublicAttributes) => {
            const userMapping = await getFromStorage(VERIFIER_USER2ID_COLLECTION, username);

            if (!userMapping) {
                return { error: "User not found" };
            }

            const userId = userMapping.userId;

            const ValidatedVerificationKeys = [];
            for (const key of VerificationKeys) {
                const fetchedKey = await getFromGlobalStorage(key);
                if (!fetchedKey) {
                    return { error: `Verification key ${key} invalid or missing` };
                }
                ValidatedVerificationKeys.push(fetchedKey);
            }

            const verificationResult = verifier.coco_verifier_step_2(
                ValidatedVerificationKeys,
                AccessTokenProof,
                PublicAttributes
            );

            if (isVerificationSuccessful(verificationResult)) {
                await deleteFromStorage(VERIFIER_USER2ID_COLLECTION, username);
                await deleteFromStorage(VERIFIER_ID2DATA_COLLECTION, userId);
                return { deleted: true };
            }
            return { deleted: false };
        },

        handleUsernameUpdateRequest: async (username, new_username, VerificationKeys, AccessTokenProof, PublicAttributes) => {
            const userMapping = await getFromStorage(VERIFIER_USER2ID_COLLECTION, username);
            
            if (!userMapping) {
                return { error: "User not found" };
            }

            const userId = userMapping.userId;

            const newUserMapping = await getFromStorage(VERIFIER_USER2ID_COLLECTION, new_username);

            if (newUserMapping) {
                return { exists: true, userId: newUserMapping.userId };
            }

            const ValidatedVerificationKeys = [];
            for (const key of VerificationKeys) {
                const fetchedKey = await getFromGlobalStorage(key);
                if (!fetchedKey) {
                    return { error: `Verification key ${key} invalid or missing` };
                }
                ValidatedVerificationKeys.push(fetchedKey);
            }

            const verificationResult = verifier.coco_verifier_step_2(
                ValidatedVerificationKeys,
                AccessTokenProof,
                PublicAttributes
            );

            if (isVerificationSuccessful(verificationResult)) {
                await setInStorage(VERIFIER_USER2ID_COLLECTION, new_username, { userId });
                await deleteFromStorage(VERIFIER_USER2ID_COLLECTION, username);
                return { updated: true };
            }
            return { updated: false };
        }
    };
}

module.exports = verifier;
