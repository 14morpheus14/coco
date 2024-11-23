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

const COCOAuthState = require("../util/coco/coco-auth");
const {AUTHENTICATOR_STORAGE_COLLECTION, GLOBAL_STORAGE_COLLECTION} = require("../config");
function authenticator(localDB, globalDB, OPRFPrivateKey = null) {
    const authenticatorInstance = new COCOAuthState(OPRFPrivateKey);

    // Helper functions for database interactions
    const getFromStorage = async (key) => {
        try {
            const [data] = await new Promise((resolve, reject) => {
                localDB.retrieve(AUTHENTICATOR_STORAGE_COLLECTION, { key }, (err, result) => {
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

    const setInStorage = async (key, value) => {
        try {
            await new Promise((resolve, reject) => {
                localDB.save(AUTHENTICATOR_STORAGE_COLLECTION, { key, value }, (err) => {
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

    const deleteFromStorage = async (key) => {
        try {
            await new Promise((resolve, reject) => {
                localDB.delete(AUTHENTICATOR_STORAGE_COLLECTION, { key }, (err) => {
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

    return {

        getOPRFPrivateKey: async () => {
            const result = await authenticatorInstance.coco_authenticator_step_1();
            if (result.error) {
                console.error("Failed to retrieve OPRF private key:", result.error);
                return { error: result.error };
            }
            return result;
        },
        
        handleBlindSignatureRequest: async (blindSignRequest, publicKey, publicAttributes) => {
            const result = authenticatorInstance.coco_authenticator_step_2(
                blindSignRequest,
                publicKey,
                publicAttributes
            );

            if (result.error) {
                console.error("Blind Signature Request Failed:", result.error);
                return { error: result.error };
            }

            const setGlobalStatus = await setInGlobalStorage(result.verificationKey, result.verificationKey);
            if (setGlobalStatus.error) {
                return { error: setGlobalStatus.error };
            }

            return {
                Signature: result.blindSignature,
                VK: result.verificationKey,
            };
        },

        handleOPRFEvaluation: async (verificationKeys, proof, publicAttributes, evalRequest) => {
           
            const value = await getFromGlobalStorage(verificationKeys);
            if (value === undefined) {
                return { error: "Undefined verification key" };
            }

            const result = await authenticatorInstance.coco_authenticator_step_3(
                verificationKeys,
                proof,
                publicAttributes,
                evalRequest
            );

            if (result.error) {
                console.error("OPRF Evaluation Failed:", result.error);
                return { error: result.error };
            }

            return { Evaluation: result };
        },

        handleRegisterRequest: async (id, currentVerificationKey, proof, publicAttributes, blindSignRequest, publicKey, publicAttributesToken, registrationTokenProof, registrationTokenPublicAttribute, registrationTokenVerificationKey) => {
            if (await getFromStorage(id)) {
                console.error("ID already exists. Registration failed.");
                return { error: "ID already exists." };
            }

            const value = await getFromGlobalStorage(registrationTokenVerificationKey);
            if (value === undefined) {
                return { error: "Undefined verification key" };
            }

            const accessrights = authenticatorInstance.coco_authenticator_step_0(
                value,
                registrationTokenProof,
                registrationTokenPublicAttribute
            );

            if (accessrights.error) {
                return { error: accessrights.error };
            }

            const result = authenticatorInstance.coco_authenticator_step_4(
                currentVerificationKey,
                proof,
                publicAttributes,
                blindSignRequest,
                publicKey,
                publicAttributesToken
            );

            if (result.error) {
                console.error("Registration Failed:", result.error);
                return { error: result.error };
            }

            const setStatus = await setInStorage(id, { VerificationKey: currentVerificationKey });
            if (setStatus.error) {
                return { error: setStatus.error };
            }

            const setGlobalStatus = await setInGlobalStorage(result.verificationKey, result.verificationKey);
            if (setGlobalStatus.error) {
                return { error: setGlobalStatus.error };
            }

            return {
                Signature: result.blindSignature,
                VK: result.verificationKey,
            };
        },

        handleLoginRequest: async (id, proof, publicAttributes, blindSignRequest, publicKey, publicAttributesToken) => {
            const storedData = await getFromStorage(id);

            if (!storedData) {
                console.error("ID not found. Login failed.");
                return { error: "ID not found." };
            }

            const result = authenticatorInstance.coco_authenticator_step_4(
                storedData.VerificationKey,
                proof,
                publicAttributes,
                blindSignRequest,
                publicKey,
                publicAttributesToken
            );

            if (result.error) {
                console.error("Login Failed:", result.error);
                return { error: result.error };
            }

            const setGlobalStatus = await setInGlobalStorage(result.verificationKey, result.verificationKey);
            if (setGlobalStatus.error) {
                return { error: setGlobalStatus.error };
            }

            return {
                Signature: result.blindSignature,
                VK: result.verificationKey,
            };
        },

        handleChangeAuthenticationDataRequest: async (oldId, oldProof, oldPublicAttributes, newId, newVerificationKey, proof, publicAttributes, blindSignRequest, publicKey, publicAttributesToken) => {
            const oldData = await getFromStorage(oldId);

            if (!oldData) {
                console.error("Old ID not found. Change authentication data failed.");
                return { error: "Old ID not found." };
            }

            const firstStepResult = authenticatorInstance.coco_authenticator_step_4(
                oldData.VerificationKey,
                oldProof,
                oldPublicAttributes,
                blindSignRequest,
                publicKey,
                publicAttributesToken
            );

            if (firstStepResult.error) {
                console.error("First Step Verification Failed:", firstStepResult.error);
                return { error: firstStepResult.error };
            }

            const secondStepResult = authenticatorInstance.coco_authenticator_step_4(
                newVerificationKey,
                proof,
                publicAttributes,
                blindSignRequest,
                publicKey,
                publicAttributesToken
            );

            if (secondStepResult.error) {
                console.error("Second Step Verification Failed:", secondStepResult.error);
                return { error: secondStepResult.error };
            }

            const status = await setInStorage(newId, { VerificationKey: newVerificationKey });
            if (status.error) {
                return { error: status.error };
            }

            const deleted = await deleteFromStorage(oldId);
            if (deleted.error) {
                return { error: deleted.error };
            }

            const setGlobalStatus = await setInGlobalStorage(secondStepResult.verificationKey, secondStepResult.verificationKey);
            if (setGlobalStatus.error) {
                return { error: setGlobalStatus.error };
            }

            return {
                Signature: secondStepResult.blindSignature,
                VK: secondStepResult.verificationKey,
            };
        },

        handleNFACredentialCreationRequest: async (id, proof, publicAttributes, recoveryID, recoveryVerificationKey, recoveryProof, recoveryPublicAttributes, blindSignRequest, publicKey, publicAttributesToken) => {
            const idData = await getFromStorage(id);

            if (!idData) {
                console.error("ID not found. Recovery creation related authentication data failed.");
                return { error: "ID not found." };
            }

            const firstStepResult = authenticatorInstance.coco_authenticator_step_4(
                idData.VerificationKey,
                proof,
                publicAttributes,
                blindSignRequest,
                publicKey,
                publicAttributesToken
            );

            if (firstStepResult.error) {
                console.error("First Step Verification Failed:", firstStepResult.error);
                return { error: firstStepResult.error };
            }

            const secondStepResult = authenticatorInstance.coco_authenticator_step_4(
                recoveryVerificationKey,
                recoveryProof,
                recoveryPublicAttributes,
                blindSignRequest,
                publicKey,
                publicAttributesToken
            );

            if (secondStepResult.error) {
                console.error("Second Step Verification Failed:", secondStepResult.error);
                return { error: secondStepResult.error };
            }

            if (await getFromStorage(recoveryID)) {
                console.error("Recovery ID already exists. Recovery Registration failed.");
                return { error: "Recovery ID already exists." };
            }

            const status = await setInStorage(recoveryID, { VerificationKey: recoveryVerificationKey });
            if (status.error) {
                return { error: status.error };
            }

            const setGlobalStatus = await setInGlobalStorage(secondStepResult.verificationKey, secondStepResult.verificationKey);
            if (setGlobalStatus.error) {
                return { error: setGlobalStatus.error };
            }

            return {
                Signature: secondStepResult.blindSignature,
                VK: secondStepResult.verificationKey,
            };
        },

        handleDeleteCredentialRequest: async (id, proof, publicAttributes, recoveryID, recoveryProof, recoveryPublicAttributes, blindSignRequest, publicKey, publicAttributesToken) => {
            
            const idData = await getFromStorage(id);

            if (!idData) {
                console.error("ID not found. Recovery creation related authentication data failed.");
                return { error: "ID not found." };
            }

            const firstStepResult = authenticatorInstance.coco_authenticator_step_4(
                idData.VerificationKey,
                proof,
                publicAttributes,
                blindSignRequest,
                publicKey,
                publicAttributesToken
            );

            if (firstStepResult.error) {
                console.error("First Step Verification Failed:", firstStepResult.error);
                return { error: firstStepResult.error };
            }

            const idData1 = await getFromStorage(recoveryID);

            if (!idData1) {
                console.error("ID not found. Recovery creation related authentication data failed.");
                return { error: "ID not found." };
            }

            const secondStepResult = authenticatorInstance.coco_authenticator_step_4(
                idData1.VerificationKey,
                recoveryProof,
                recoveryPublicAttributes,
                blindSignRequest,
                publicKey,
                publicAttributesToken
            );

            if (secondStepResult.error) {
                console.error("Second Step Verification Failed:", secondStepResult.error);
                return { error: secondStepResult.error };
            }

            const deleted = await deleteFromStorage(id);
            if (deleted.error) {
                return { error: deleted.error };
            }

            const deleted1 = await deleteFromStorage(recoveryID);
            if (deleted1.error) {
                return { error: deleted1.error };
            }
            
            const setGlobalStatus = await setInGlobalStorage(secondStepResult.verificationKey, secondStepResult.verificationKey);
            if (setGlobalStatus.error) {
                return { error: setGlobalStatus.error };
            }

            return {
                Signature: secondStepResult.blindSignature,
                VK: secondStepResult.verificationKey,
            };
        }
    };
}

module.exports = authenticator;
