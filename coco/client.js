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


const COCOClientState = require("../util/coco/coco-client");
const apiHandler = require("../net/NetworkHandler");
const {CLIENT_STORAGE_COLLECTION} = require("../config");

function client (localDB, apiMap, verifierAPI, authAPIs) {
    const client = new COCOClientState(authAPIs.length);
    
    // Helper functions for database interactions
    const getFromStorage = async (key) => {
        try {
            const [data] = await new Promise((resolve, reject) => {
                localDB.retrieve(CLIENT_STORAGE_COLLECTION, { key }, (err, result) => {
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

    const updateInStorage = async (key, updates) => {
        try {
            const updateResult = await new Promise((resolve, reject) => {
                localDB.update(CLIENT_STORAGE_COLLECTION, { key }, updates, (err, result) => {
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

    const setInStorage = async (key, value) => {
        try {
            await new Promise((resolve, reject) => {
                localDB.save(CLIENT_STORAGE_COLLECTION, { key, value }, (err) => {
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
                localDB.delete(CLIENT_STORAGE_COLLECTION, { key }, (err) => {
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

    // handlers for authenticator responses:

    const handleBlindSignatureRequestResponse = (response) => {
        if (!response) {
            console.error("[Client] No response received for blind signature request.");
            return null;
        }
    
        if (response.error) {
            console.error("[Client] Blind signature request error:", response.error);
            return null;
        }
    
        if (!response.Signature || !response.VK) {
            console.error("[Client] Blind signature response missing required fields.");
            return null;
        }
    
        console.log("[Client] Successfully processed blind signature request.");
        return response;
    };

    const handleOPRFEvaluationResponse = async (response) => {
        if (!response) {
            console.error("[Client] No response received for OPRF evaluation.");
            return null;
        }
    
        if (response.error) {
            console.error("[Client] OPRF evaluation error:", response.error);
            return null;
        }
    
        if (!response.Evaluation) {
            console.error("[Client] OPRF evaluation response missing required fields.");
            return null;
        }
    
        console.log("[Client] Successfully evaluated OPRF.");
        return response;
    };

    const handleRegisterRequestResponse = async (response, id) => {
        if (!response) {
            console.error(`[Client] No response received for registration request for ID "${id}".`);
            return null;
        }
    
        if (response.error) {
            console.error(`[Client] Registration request error for ID "${id}":`, response.error);
            return null;
        }
    
        if (!response.Signature || !response.VK) {
            console.error(`[Client] Registration response missing required fields for ID "${id}".`);
            return null;
        }
    
        console.log(`[Client] Registration successful for ID "${id}".`);
        return response;
    };

    const handleLoginRequestResponse = async (response, id) => {
        if (!response) {
            console.error(`[Client] No response received for login request for ID "${id}".`);
            return null;
        }
    
        if (response.error) {
            console.error(`[Client] Login request error for ID "${id}":`, response.error);
            return null;
        }
    
        if (!response.Signature || !response.VK) {
            console.error(`[Client] Login response missing required fields for ID "${id}".`);
            return null;
        }
    
        console.log(`[Client] Login successful for ID "${id}".`);
        return response;
    };

    const handleChangeAuthenticationDataResponse = async (response, newId) => {
        if (!response) {
            console.error(`[Client] No response received for change authentication data request for ID "${newId}".`);
            return null;
        }
    
        if (response.error) {
            console.error(`[Client] Change authentication data error for ID "${newId}":`, response.error);
            return null;
        }
    
        if (!response.Signature || !response.VK) {
            console.error(`[Client] Change authentication data response missing required fields for ID "${newId}".`);
            return null;
        }
    
        console.log(`[Client] Authentication data successfully changed for ID "${newId}".`);
        return response;
    };

    const handleNFACredentialCreationResponse = async (response, recoveryID) => {
        if (!response) {
            console.error(`[Client] No response received for NFA credential creation request for Recovery ID "${recoveryID}".`);
            return null;
        }
    
        if (response.error) {
            console.error(`[Client] NFA credential creation error for Recovery ID "${recoveryID}":`, response.error);
            return null;
        }
    
        if (!response.Signature || !response.VK) {
            console.error(`[Client] NFA credential creation response missing required fields for Recovery ID "${recoveryID}".`);
            return null;
        }
    
        console.log(`[Client] NFA credential successfully created for Recovery ID "${recoveryID}".`);
        return response;
    };

    const handleDeleteCredentialResponse = async (response, id) => {
        if (!response) {
            console.error(`[Client] No response received for delete credential request for ID "${id}".`);
            return null;
        }
    
        if (response.error) {
            console.error(`[Client] Delete credential error for ID "${id}":`, response.error);
            return null;
        }
    
        if (!response.Signature || !response.VK) {
            console.error(`[Client] Delete credential response missing required fields for ID "${id}".`);
            return null;
        }
    
        console.log(`[Client] Credential successfully deleted for ID "${id}".`);
        return response;
    };
    
    // handlers for verifier responses:
    const handleVerifierResponse = async (response, username) => {
        if (!response) {
            console.error(`[Client] No response received from verifier for username "${username}".`);
            return null;
        }
    
        if (response.error) {
            console.error(`[Client] Verifier returned an error for username "${username}":`, response.error);
            return null;
        }
    
        if (response.exists) {
            // Verifier says the user exists (useful for login or checking pre-registration state)
            if (!response.userId || !response.salts || !response.pepper) {
                console.error(`[Client] Verifier did not return required user id, salts or pepper for username "${username}".`);
                return null;
            }
            return response; // Sufficient data for login
        } else {
            // Verifier says the user does not exist (useful for registration)
            if (!response.userId || !response.pepper || !response.Signature || !response.VK) {
                console.error(`[Client] Missing registration requirements (user id, pepper, Signature, or VK) for username "${username}".`);
                return null;
            }
            return response; // Sufficient data for registration
        }
    };
    

    const handleRegistrationCompletion = async (response, username) => {
        if (!response) {
            console.error(`[Client] No response received from verifier for completing registration of username "${username}".`);
            return null;
        }
    
        if (response.error) {
            console.error(`[Client] Registration error for username "${username}":`, response.error);
            return null;
        }
    
        if (!response.registered) {
            console.error(`[Client] Registration failed for username "${username}".`);
            return null;
        }
    
        console.log(`[Client] Registration successful for username "${username}".`);
        return response;
    };

    const handleLoginCompletion = async (response, username) => {
        if (!response) {
            console.error(`[Client] No response received from verifier for login of username "${username}".`);
            return null;
        }
    
        if (response.error) {
            console.error(`[Client] Login error for username "${username}":`, response.error);
            return null;
        }
    
        if (!response.logged) {
            console.error(`[Client] Login failed for username "${username}".`);
            return null;
        }
    
        console.log(`[Client] Login successful for username "${username}".`);
        return response;
    };

    const handleUpdateCompletion = async (response, username) => {
        if (!response) {
            console.error(`[Client] No response received from verifier for updating username "${username}".`);
            return null;
        }
    
        if (response.error) {
            console.error(`[Client] Update error for username "${username}":`, response.error);
            return null;
        }
    
        if (!response.updated) {
            console.error(`[Client] Update failed for username "${username}".`);
            return null;
        }
    
        console.log(`[Client] Update successful for username "${username}".`);
        return response;
    };

    const handleDeletionCompletion = async (response, username) => {
        if (!response) {
            console.error(`[Client] No response received from verifier for deleting username "${username}".`);
            return null;
        }
    
        if (response.error) {
            console.error(`[Client] Deletion error for username "${username}":`, response.error);
            return null;
        }
    
        if (!response.deleted) {
            console.error(`[Client] Deletion failed for username "${username}".`);
            return null;
        }
    
        console.log(`[Client] Deletion successful for username "${username}".`);
        return response;
    };    

    return {
        // handler for registering a user...
        register: async (username, secret, deviceID) => {
            try {
                // Step 1: Initiate registration with the verifier
                const { publicKey, publicAttributes, blindSignRequest } = client.coco_client_step_0(username);
        
                const verifierResponse = await apiHandler({
                    apiMap,
                    apiType: verifierAPI[0],
                    endpoint: 'handleRegistrationRequest',
                    payload: [username, blindSignRequest, publicKey, publicAttributes],
                });

        
                const validVerifierResponse = await handleVerifierResponse(verifierResponse, username);
                if (!validVerifierResponse) return false;
        
                // If the username already exists, registration cannot proceed
                if (validVerifierResponse.exists) {
                    console.warn(`[Client] Username "${username}" is already registered.`);
                    return false;
                }
        
                // Step 2: Generate salts and perform client-side computations
                const salts = client.coco_client_step_1();
                const RIDs = await client.coco_client_step_2(verifierResponse.userId, secret, salts, validVerifierResponse.pepper);
                const { publicKey: deviceKey, publicAttributes: deviceAttributes, blindSignRequest: deviceBlindRequest } =
                    client.coco_client_step_3(deviceID);
        
                // Step 3: Request blind signatures from authenticators
                const authResponses = [];
                for (const apiType of authAPIs) {
                    const authResponse = await apiHandler({
                        apiMap,
                        apiType,
                        endpoint: 'handleBlindSignatureRequest',
                        payload: [deviceBlindRequest, deviceKey, deviceAttributes],
                    });
                    const validResponse = await handleBlindSignatureRequestResponse(authResponse);
                    if (!validResponse) {
                        console.error("[Client] Registration failed at an authenticator.");
                        return false;
                    }
                    authResponses.push(authResponse);
                }
        
                // Step 4: OPRF evaluation requests
                ({ blindDataArray, evalReqArray, proofArray } = await client.coco_client_step_4(
                    authResponses.map((res) => res.Signature),
                    authResponses.map((res) => res.VK),
                    RIDs
                ));
        
                const evalResponses = [];
                for (let i = 0; i < authAPIs.length; i++) {
                    const authEvalResponse = await apiHandler({
                        apiMap,
                        apiType: authAPIs[i],
                        endpoint: 'handleOPRFEvaluation',
                        payload: [
                            authResponses.map((res) => res.VK),
                            proofArray[i],
                            deviceAttributes,
                            evalReqArray[i],
                        ],
                    });
                    const validResponse = await handleOPRFEvaluationResponse(authEvalResponse);
                    if (!validResponse) {
                        console.error("[Client] Registration failed at an authenticator.");
                        return false;
                    }
                    evalResponses.push(authEvalResponse);
                }
        
                // Step 5: Generate registration keys
                const registrationData = await client.coco_client_step_5(
                    RIDs,
                    salts,
                    evalResponses.map((res) => res.Evaluation),
                    blindDataArray
                );
        
                const { ids, verificationKeys, proofs, publicAttributesArray } = registrationData;
                const { publicKey: accessKey, publicAttributes: accessAttrs, blindSignRequest: accessBlindReq } =
                    client.coco_client_step_6(username);
        
                // Step 6: Submit registration requests to authenticators
                const registrationResponses = [];
                for (let i = 0; i < authAPIs.length; i++) {
                    const authRegisterResponse = await apiHandler({
                        apiMap,
                        apiType: authAPIs[i],
                        endpoint: 'handleRegisterRequest',
                        payload: [
                            ids[i],
                            verificationKeys[i],
                            proofs[i],
                            publicAttributesArray[i],
                            accessBlindReq,
                            accessKey,
                            accessAttrs,
                            validVerifierResponse.Signature,
                            validVerifierResponse.VK,
                        ],
                    });
                    const validResponse = await handleRegisterRequestResponse(authRegisterResponse, ids[i]);
                    if (!validResponse) {
                        console.error("[Client] Registration failed at an authenticator.");
                        return false;
                    }
                    registrationResponses.push(authRegisterResponse);
                }
        
                // Step 7: Finalize registration
                const { proof, randomizedCredential, aggregatedVerificationKey } = client.coco_client_step_7(
                    registrationResponses.map((res) => res.Signature),
                    registrationResponses.map((res) => res.VK)
                );
                        
                const finalResponse = await apiHandler({
                    apiMap,
                    apiType: verifierAPI[0],
                    endpoint: 'completeRegistration',
                    payload: [
                        username,
                        verifierResponse.userId,
                        salts,
                        registrationResponses.map((res) => res.VK),
                        proof,
                        accessAttrs,
                    ],
                });
                
                const validFinalResponse = await handleRegistrationCompletion(finalResponse, username);
                if (!validFinalResponse) return false;
        
                // Store user data in localDB
                // look if you donn wanna keep it in user's dev, then just don't!
                const userData = {
                    proof: proof,
                    Credential: randomizedCredential,
                    verificationKeys: registrationResponses.map((res) => res.VK),
                    publicAttributes: accessAttrs,
                    AggregatedVerificationKey: aggregatedVerificationKey,
                };
                
                const setStatus = await setInStorage(username, userData);
                if (setStatus.error) {
                    return { error: setStatus.error };
                }
        
                return true; // Registration successful
            } catch (error) {
                console.error("[Client] Registration process encountered an error:", error);
                return false;
            }
        },
        
        login: async (username, secret, deviceID) => {
            try {
                // Step 1: Initiate login request with the verifier
                const verifierResponse = await apiHandler({
                    apiMap,
                    apiType: verifierAPI[0],
                    endpoint: 'handleLoginRequest',
                    payload: [username],
                });

                const validVerifierResponse = await handleVerifierResponse(verifierResponse, username);
                if (!validVerifierResponse) return false;
        
                // If the username does not exist, login cannot proceed
                if (!validVerifierResponse.exists) {
                    console.warn(`[Client] Username "${username}" is not registered.`);
                    return false;
                }
        
                // Step 2: Generate RIDs and prepare client-side data
                const RIDs = await client.coco_client_step_2(
                    verifierResponse.userId,
                    secret,
                    validVerifierResponse.salts,
                    validVerifierResponse.pepper
                );
                const { publicKey: deviceKey, publicAttributes: deviceAttributes, blindSignRequest: deviceBlindRequest } =
                    client.coco_client_step_3(deviceID);
        
                // Step 3: Request blind signatures from authenticators
                const authResponses = [];
                for (const apiType of authAPIs) {
                    const authResponse = await apiHandler({
                        apiMap,
                        apiType,
                        endpoint: 'handleBlindSignatureRequest',
                        payload: [deviceBlindRequest, deviceKey, deviceAttributes],
                    });
                    const validResponse = await handleBlindSignatureRequestResponse(authResponse);
                    if (!validResponse) {
                        console.error("[Client] Login failed at an authenticator.");
                        return false;
                    }
                    authResponses.push(authResponse);
                }
        
                // Step 4: Perform OPRF evaluations
                const { blindDataArray, evalReqArray, proofArray } = await client.coco_client_step_4(
                    authResponses.map((res) => res.Signature),
                    authResponses.map((res) => res.VK),
                    RIDs
                );
        
                const evalResponses = [];
                for (let i = 0; i < authAPIs.length; i++) {
                    const authEvalResponse = await apiHandler({
                        apiMap,
                        apiType: authAPIs[i],
                        endpoint: 'handleOPRFEvaluation',
                        payload: [
                            authResponses.map((res) => res.VK),
                            proofArray[i],
                            deviceAttributes,
                            evalReqArray[i],
                        ],
                    });
                    const validResponse = await handleOPRFEvaluationResponse(authEvalResponse);
                    if (!validResponse) {
                        console.error("[Client] Login failed at an authenticator.");
                        return false;
                    }
                    evalResponses.push(authEvalResponse);
                }
        
                // Step 5: Generate authentication keys
                const authenticationData = await client.coco_client_step_5(
                    RIDs,
                    validVerifierResponse.salts,
                    evalResponses.map((res) => res.Evaluation),
                    blindDataArray
                );
        
                const { ids, proofs, publicAttributesArray } = authenticationData;
                const { publicKey: accessKey, publicAttributes: accessAttrs, blindSignRequest: accessBlindReq } =
                    client.coco_client_step_6(username);
                //console.log("Blind Sign Req:", accessBlindReq);

                // Step 6: Submit login requests to authenticators
                const loginResponses = [];
                for (let i = 0; i < authAPIs.length; i++) {
                    const authLoginResponse = await apiHandler({
                        apiMap,
                        apiType: authAPIs[i],
                        endpoint: 'handleLoginRequest',
                        payload: [
                            ids[i],
                            proofs[i],
                            publicAttributesArray[i],
                            accessBlindReq,
                            accessKey,
                            accessAttrs,
                        ],
                    });
                    const validResponse = await handleLoginRequestResponse(authLoginResponse, ids[i]);
                    if (!validResponse) {
                        console.error("[Client] Login failed at an authenticator.");
                        return false;
                    }
                    loginResponses.push(authLoginResponse);
                }
        
                // Step 7: Finalize login
                const { proof, randomizedCredential, aggregatedVerificationKey } = client.coco_client_step_7(
                    loginResponses.map((res) => res.Signature),
                    loginResponses.map((res) => res.VK)
                );
        
                const finalResponse = await apiHandler({
                    apiMap,
                    apiType: verifierAPI[0],
                    endpoint: 'completeLogin',
                    payload: [
                        username,
                        loginResponses.map((res) => res.VK),
                        proof,
                        accessAttrs,
                    ],
                });
        
                const validFinalResponse = await handleLoginCompletion(finalResponse, username);
                if (!validFinalResponse) return false;
                
                // Store user data in localDB
                const userData = await getFromStorage(username);
                const newUserData = {
                    ...userData,
                    proof: proof,
                    Credential: randomizedCredential,
                    verificationKeys: loginResponses.map((res) => res.VK),
                    publicAttributes: accessAttrs,
                    AggregatedVerificationKey: aggregatedVerificationKey,
                };
                
                const updateStatus = await updateInStorage(username, newUserData);
                if (updateStatus.error) {
                    return { error: updateStatus.error };
                }
        
                return true; // Login successful
            } catch (error) {
                console.error("[Client] Login process encountered an error:", error);
                return false;
            }
        },
        
        updatePassword: async (username, oldSecret, newSecret, deviceID) => {
            try {
                // Step 1: Begin password change process by fetching salts and pepper
                const verifierResponse = await apiHandler({
                    apiMap,
                    apiType: verifierAPI[0],
                    endpoint: 'handleLoginRequest',
                    payload: [username],
                });

                const validVerifierResponse = await handleVerifierResponse(verifierResponse, username);
                if (!validVerifierResponse) return false;
        
                if (!verifierResponse.exists) {
                    console.warn(`[Client] Username "${username}" is not registered.`);
                    return false;
                }
        
                // Step 2: Generate recovery data for the old password
                const oldRIDs = await client.coco_client_step_2(
                    verifierResponse.userId,
                    oldSecret,
                    verifierResponse.salts,
                    verifierResponse.pepper
                );
        
                const { publicKey: oldDeviceKey, publicAttributes: oldDeviceAttributes, blindSignRequest: oldDeviceBlindRequest } =
                    client.coco_client_step_3(deviceID);
        
                // Step 3: Request blind signatures for the old password
                const oldAuthResponses = [];
                for (const apiType of authAPIs) {
                    const authResponse = await apiHandler({
                        apiMap,
                        apiType,
                        endpoint: 'handleBlindSignatureRequest',
                        payload: [oldDeviceBlindRequest, oldDeviceKey, oldDeviceAttributes],
                    });
                    const validResponse = await handleBlindSignatureRequestResponse(authResponse);
                    if (!validResponse) {
                        console.error("[Client] Password Updation failed at an authenticator.");
                        return false;
                    }
                    oldAuthResponses.push(authResponse);
                }
        
                // Step 4: OPRF evaluations for the old password
                const { blindDataArray: oldBlindDataArray, evalReqArray: oldEvalReqArray, proofArray: oldProofArray } =
                    await client.coco_client_step_4(
                        oldAuthResponses.map((res) => res.Signature),
                        oldAuthResponses.map((res) => res.VK),
                        oldRIDs
                    );
        
                const oldEvalResponses = [];
                for (let i = 0; i < authAPIs.length; i++) {
                    const authEvalResponse = await apiHandler({
                        apiMap,
                        apiType: authAPIs[i],
                        endpoint: 'handleOPRFEvaluation',
                        payload: [
                            oldAuthResponses.map((res) => res.VK),
                            oldProofArray[i],
                            oldDeviceAttributes,
                            oldEvalReqArray[i],
                        ],
                    });
                    const validResponse = await handleOPRFEvaluationResponse(authEvalResponse);
                    if (!validResponse) {
                        console.error("[Client] Password Updation failed at an authenticator.");
                        return false;
                    }
                    oldEvalResponses.push(authEvalResponse);
                }

                // Step 5: Generate old id-s
                const oldAuthenticationData = await client.coco_client_step_5(
                    oldRIDs,
                    validVerifierResponse.salts,
                    oldEvalResponses.map((res) => res.Evaluation),
                    oldBlindDataArray
                );
        
                const { ids: oldIds, proofs: oldProofs, publicAttributesArray: oldPublicAttributesArray } = oldAuthenticationData;
        
        
                // Step 5: Generate salts and recovery data for the new password
                const newSalts = client.coco_client_step_1();
                const newRIDs = await client.coco_client_step_2(
                    verifierResponse.userId,
                    newSecret,
                    newSalts,
                    verifierResponse.pepper
                );
        
                const { publicKey: newDeviceKey, publicAttributes: newDeviceAttributes, blindSignRequest: newDeviceBlindRequest } =
                    client.coco_client_step_3(deviceID);
        
                // Step 6: Request blind signatures for the new password
                const newAuthResponses = [];
                for (const apiType of authAPIs) {
                    const authResponse = await apiHandler({
                        apiMap,
                        apiType,
                        endpoint: 'handleBlindSignatureRequest',
                        payload: [newDeviceBlindRequest, newDeviceKey, newDeviceAttributes],
                    });
                    const validResponse = await handleBlindSignatureRequestResponse(authResponse);
                    if (!validResponse) {
                        console.error("[Client] Password Updation failed at an authenticator.");
                        return false;
                    }
                    newAuthResponses.push(authResponse);
                }
        
                // Step 7: OPRF evaluations for the new password
                const { blindDataArray: newBlindDataArray, evalReqArray: newEvalReqArray, proofArray: newProofArray } =
                    await client.coco_client_step_4(
                        newAuthResponses.map((res) => res.Signature),
                        newAuthResponses.map((res) => res.VK),
                        newRIDs
                    );
        
                const newEvalResponses = [];
                for (let i = 0; i < authAPIs.length; i++) {
                    const authEvalResponse = await apiHandler({
                        apiMap,
                        apiType: authAPIs[i],
                        endpoint: 'handleOPRFEvaluation',
                        payload: [
                            newAuthResponses.map((res) => res.VK),
                            newProofArray[i],
                            newDeviceAttributes,
                            newEvalReqArray[i],
                        ],
                    });
                    const validResponse = await handleOPRFEvaluationResponse(authEvalResponse);
                    if (!validResponse) {
                        console.error("[Client] Password Updation failed at an authenticator.");
                        return false;
                    }
                    newEvalResponses.push(authEvalResponse);
                }


                // Step 5: Generate new authentication data
                const newAuthenticationData = await client.coco_client_step_5(
                    newRIDs,
                    newSalts,
                    newEvalResponses.map((res) => res.Evaluation),
                    newBlindDataArray
                );
        
                const { ids: newIds, verificationKeys: newVerificationKeys, proofs: newProofs, publicAttributesArray: newPublicAttributesArray } = newAuthenticationData;
                
                const { publicKey: newAccessKey, publicAttributes: newAccessAttrs, blindSignRequest: newAccessBlindReq } =
                    client.coco_client_step_6(username);
        
                // Step 8: Request password updates on authenticators
                const changePasswordResponses = [];
                for (let i = 0; i < authAPIs.length; i++) {
                    const authResponse = await apiHandler({
                        apiMap,
                        apiType: authAPIs[i],
                        endpoint: 'handleChangeAuthenticationDataRequest',
                        payload: [
                            oldIds[i],
                            oldProofs[i],
                            oldPublicAttributesArray[i],
                            newIds[i],
                            newVerificationKeys[i],
                            newProofs[i],
                            newPublicAttributesArray[i],
                            newAccessBlindReq,
                            newAccessKey,
                            newAccessAttrs,
                        ],
                    });
                    const validResponse = await handleChangeAuthenticationDataResponse(authResponse, newIds[i]);
                    if (!validResponse) {
                        console.error("[Client] Password Updation failed at an authenticator.");
                        return false;
                    }
                    changePasswordResponses.push(authResponse);
                }
        
                // Step 9: Finalize password update with verifier
                const { proof, randomizedCredential, aggregatedVerificationKey } = client.coco_client_step_7(
                    changePasswordResponses.map((res) => res.Signature),
                    changePasswordResponses.map((res) => res.VK)
                );

                const finalResponse = await apiHandler({
                    apiMap,
                    apiType: verifierAPI[0],
                    endpoint: 'handleUpdateSaltsRequest',
                    payload: [
                        username,
                        newSalts,
                        changePasswordResponses.map((res) => res.VK),
                        proof,
                        newAccessAttrs,
                    ],
                });                
        
                const validFinalResponse = await handleUpdateCompletion(finalResponse, username);
                if (!validFinalResponse) return false;
        
                // Update user data in localDB
                const userData = await getFromStorage(username);
                const newUserData = {
                    ...userData,
                    proof: proof,
                    Credential: randomizedCredential,
                    verificationKeys: changePasswordResponses.map((res) => res.VK),
                    publicAttributes: newAccessAttrs,
                    AggregatedVerificationKey: aggregatedVerificationKey,
                };
                
                const updateStatus = await updateInStorage(username, newUserData);
                if (updateStatus.error) {
                    return { error: updateStatus.error };
                }
        
                return true; // Password update successful
            } catch (error) {
                console.error("[Client] Error during password update process:", error);
                return false;
            }
        },
        
        setNextFactor: async (username, currentSecret, next_factor_secret, deviceID) => {
            try {
                // Step 1: Retrieve user details and salts from verifier
                const verifierResponse = await apiHandler({
                    apiMap,
                    apiType: verifierAPI[0],
                    endpoint: 'handleLoginRequest',
                    payload: [username],
                });

                const validVerifierResponse = await handleVerifierResponse(verifierResponse, username);
                if (!validVerifierResponse) return false;
        
                if (!validVerifierResponse.exists) {
                    console.warn(`[Client] Username "${username}" is not registered.`);
                    return false;
                }
        
                // Step 2: Generate RIDs using current secret
                const RIDs = await client.coco_client_step_2(
                    verifierResponse.userId,
                    currentSecret,
                    validVerifierResponse.salts,
                    validVerifierResponse.pepper
                );
        
                // Step 3: Generate blind signature requests for the current secret
                const { publicKey: deviceKey, publicAttributes: deviceAttributes, blindSignRequest: deviceBlindRequest } =
                    client.coco_client_step_3(deviceID);
        
                // Step 4: Obtain blind signatures from authenticators
                const authResponses = [];
                for (const apiType of authAPIs) {
                    const authResponse = await apiHandler({
                        apiMap,
                        apiType,
                        endpoint: 'handleBlindSignatureRequest',
                        payload: [deviceBlindRequest, deviceKey, deviceAttributes],
                    });
                    const validResponse = await handleBlindSignatureRequestResponse(authResponse);
                    if (!validResponse) {
                        console.error("[Client] Set Next Factor failed at an authenticator.");
                        return false;
                    }
                    authResponses.push(authResponse);
                }
        
                // Step 5: OPRF evaluations for the current secret
                const { blindDataArray, evalReqArray, proofArray } = await client.coco_client_step_4(
                    authResponses.map((res) => res.Signature),
                    authResponses.map((res) => res.VK),
                    RIDs
                );
        
                const evalResponses = [];
                for (let i = 0; i < authAPIs.length; i++) {
                    const authEvalResponse = await apiHandler({
                        apiMap,
                        apiType: authAPIs[i],
                        endpoint: 'handleOPRFEvaluation',
                        payload: [
                            authResponses.map((res) => res.VK),
                            proofArray[i],
                            deviceAttributes,
                            evalReqArray[i],
                        ],
                    });
                    const validResponse = await handleOPRFEvaluationResponse(authEvalResponse);
                    if (!validResponse) {
                        console.error("[Client] Set Next Factor failed at an authenticator.");
                        return false;
                    }
                    evalResponses.push(authEvalResponse);
                }

                // Step 5: Generate old id-s
                const authenticationData = await client.coco_client_step_5(
                    RIDs,
                    validVerifierResponse.salts,
                    evalResponses.map((res) => res.Evaluation),
                    blindDataArray
                );
        
                const { ids, proofs, publicAttributesArray } = authenticationData;
        
        
                // Step 6: Create recovery/next factor credentials using the next factor secret
                const RIDsNew = await client.coco_client_step_2(
                    verifierResponse.userId,
                    next_factor_secret,
                    validVerifierResponse.salts,
                    validVerifierResponse.pepper
                );
        
                const { publicKey: newDeviceKey, publicAttributes: newDeviceAttributes, blindSignRequest: newDeviceBlindRequest } =
                    client.coco_client_step_3(deviceID);
        
                // Step 6: Request blind signatures for the new password
                const newAuthResponses = [];
                for (const apiType of authAPIs) {
                    const authResponse = await apiHandler({
                        apiMap,
                        apiType,
                        endpoint: 'handleBlindSignatureRequest',
                        payload: [newDeviceBlindRequest, newDeviceKey, newDeviceAttributes],
                    });
                    const validResponse = await handleBlindSignatureRequestResponse(authResponse);
                    if (!validResponse) {
                        console.error("[Client] Set Next Factor failed at an authenticator.");
                        return false;
                    }
                    newAuthResponses.push(authResponse);
                }
        
                // Step 7: OPRF evaluations for the new password
                const { blindDataArray: newBlindDataArray, evalReqArray: newEvalReqArray, proofArray: newProofArray } =
                    await client.coco_client_step_4(
                        newAuthResponses.map((res) => res.Signature),
                        newAuthResponses.map((res) => res.VK),
                        RIDsNew
                    );
        
                const newEvalResponses = [];
                for (let i = 0; i < authAPIs.length; i++) {
                    const authEvalResponse = await apiHandler({
                        apiMap,
                        apiType: authAPIs[i],
                        endpoint: 'handleOPRFEvaluation',
                        payload: [
                            newAuthResponses.map((res) => res.VK),
                            newProofArray[i],
                            newDeviceAttributes,
                            newEvalReqArray[i],
                        ],
                    });
                    const validResponse = await handleOPRFEvaluationResponse(authEvalResponse);
                    if (!validResponse) {
                        console.error("[Client] Set Next Factor failed at an authenticator.");
                        return false;
                    }
                    newEvalResponses.push(authEvalResponse);
                }


                // Step 5: Generate new authentication data
                const recoveryData = await client.coco_client_step_5(
                    RIDsNew,
                    validVerifierResponse.salts,
                    newEvalResponses.map((res) => res.Evaluation),
                    newBlindDataArray
                );
        
                const { ids: newIds, verificationKeys: newVerificationKeys, proofs: newProofs, publicAttributesArray: newPublicAttributesArray } = recoveryData;

                const { publicKey: accessKey, publicAttributes: accessAttrs, blindSignRequest: accessBlindReq } =
                    client.coco_client_step_6(username);
        
                // Step 7: Send recovery/next factor registration requests to authenticators
                const recoveryResponses = [];
                for (let i = 0; i < authAPIs.length; i++) {
                    const recoveryResponse = await apiHandler({
                        apiMap,
                        apiType: authAPIs[i],
                        endpoint: 'handleNFACredentialCreationRequest',
                        payload: [
                            ids[i],
                            proofs[i],
                            publicAttributesArray[i],
                            newIds[i],
                            newVerificationKeys[i],
                            newProofs[i],
                            newPublicAttributesArray[i],
                            accessBlindReq,
                            accessKey,
                            accessAttrs,
                        ],
                    });
                    const validResponse = await handleNFACredentialCreationResponse(recoveryResponse, newIds[i]);
                    if (!validResponse) {
                        console.error("[Client] Set Next Factor failed at an authenticator.");
                        return false;
                    }
                    recoveryResponses.push(recoveryResponse);
                }
        
                // Step 8: Finalize recovery/next factor credential registration
                const { proof, randomizedCredential, aggregatedVerificationKey } = client.coco_client_step_7(
                    recoveryResponses.map((res) => res.Signature),
                    recoveryResponses.map((res) => res.VK)
                );
        
                const finalResponse = await apiHandler({
                    apiMap,
                    apiType: verifierAPI[0],
                    endpoint: 'completeLogin',
                    payload: [
                        username,
                        recoveryResponses.map((res) => res.VK),
                        proof,
                        accessAttrs,
                    ],
                });
                
                const validFinalResponse = await handleLoginCompletion(finalResponse, username);
                if (!validFinalResponse) return false;
        
                return true; // Recovery/next factor set successfully
            } catch (error) {
                console.error("[Client] Next Factor Registration process encountered an error:", error);
                return false;
            }
        },
        
        updateUsername: async (username, secret, new_username, deviceID) => {
            try {
                // Step 1: Initiate login request with the verifier
                const verifierResponse = await apiHandler({
                    apiMap,
                    apiType: verifierAPI[0],
                    endpoint: 'handleLoginRequest',
                    payload: [username],
                });
                
                const validVerifierResponse = await handleVerifierResponse(verifierResponse, username);
                if (!validVerifierResponse) return false;
        
                // If the username does not exist, login cannot proceed
                if (!validVerifierResponse.exists) {
                    console.warn(`[Client] Username "${username}" is not registered.`);
                    return false;
                }
        
                // Step 2: Generate RIDs and prepare client-side data
                const RIDs = await client.coco_client_step_2(
                    verifierResponse.userId,
                    secret,
                    validVerifierResponse.salts,
                    validVerifierResponse.pepper
                );
                const { publicKey: deviceKey, publicAttributes: deviceAttributes, blindSignRequest: deviceBlindRequest } =
                    client.coco_client_step_3(deviceID);
        
                // Step 3: Request blind signatures from authenticators
                const authResponses = [];
                for (const apiType of authAPIs) {
                    const authResponse = await apiHandler({
                        apiMap,
                        apiType,
                        endpoint: 'handleBlindSignatureRequest',
                        payload: [deviceBlindRequest, deviceKey, deviceAttributes],
                    });
                    const validResponse = await handleBlindSignatureRequestResponse(authResponse);
                    if (!validResponse) {
                        console.error("[Client] Username Updation failed at an authenticator.");
                        return false;
                    }
                    authResponses.push(authResponse);
                }
        
                // Step 4: Perform OPRF evaluations
                const { blindDataArray, evalReqArray, proofArray } = await client.coco_client_step_4(
                    authResponses.map((res) => res.Signature),
                    authResponses.map((res) => res.VK),
                    RIDs
                );
        
                const evalResponses = [];
                for (let i = 0; i < authAPIs.length; i++) {
                    const authEvalResponse = await apiHandler({
                        apiMap,
                        apiType: authAPIs[i],
                        endpoint: 'handleOPRFEvaluation',
                        payload: [
                            authResponses.map((res) => res.VK),
                            proofArray[i],
                            deviceAttributes,
                            evalReqArray[i],
                        ],
                    });
                    const validResponse = await handleOPRFEvaluationResponse(authEvalResponse);
                    if (!validResponse) {
                        console.error("[Client] Username Updation failed at an authenticator.");
                        return false;
                    }
                    evalResponses.push(authEvalResponse);
                }
        
                // Step 5: Generate authentication keys
                const authenticationData = await client.coco_client_step_5(
                    RIDs,
                    validVerifierResponse.salts,
                    evalResponses.map((res) => res.Evaluation),
                    blindDataArray
                );
        
                const { ids, proofs, publicAttributesArray } = authenticationData;
                const { publicKey: accessKey, publicAttributes: accessAttrs, blindSignRequest: accessBlindReq } =
                    client.coco_client_step_6(username);
        
                // Step 6: Submit login requests to authenticators
                const loginResponses = [];
                for (let i = 0; i < authAPIs.length; i++) {
                    const authLoginResponse = await apiHandler({
                        apiMap,
                        apiType: authAPIs[i],
                        endpoint: 'handleLoginRequest',
                        payload: [
                            ids[i],
                            proofs[i],
                            publicAttributesArray[i],
                            accessBlindReq,
                            accessKey,
                            accessAttrs,
                        ],
                    });
                    const validResponse = await handleLoginRequestResponse(authLoginResponse, ids[i]);
                    if (!validResponse) {
                        console.error("[Client] Username Updation failed at an authenticator.");
                        return false;
                    }
                    loginResponses.push(authLoginResponse);
                }
        
                // Step 7: Finalize login
                const { proof, randomizedCredential, aggregatedVerificationKey } = client.coco_client_step_7(
                    loginResponses.map((res) => res.Signature),
                    loginResponses.map((res) => res.VK)
                );

                const finalResponse = await apiHandler({
                    apiMap,
                    apiType: verifierAPI[0],
                    endpoint: 'handleUsernameUpdateRequest',
                    payload: [
                        username,
                        new_username,
                        loginResponses.map((res) => res.VK),
                        proof,
                        accessAttrs,
                    ],
                });
                
                const validFinalResponse = await handleUpdateCompletion(finalResponse, username);
                if (!validFinalResponse) return false;
        
                // Store user data in localDB
                const userData = await getFromStorage(username);
                const newUserData = {
                    ...userData,
                    proof: proof,
                    Credential: randomizedCredential,
                    verificationKeys: loginResponses.map((res) => res.VK),
                    publicAttributes: accessAttrs,
                    AggregatedVerificationKey: aggregatedVerificationKey,
                };
                
                const setStatus = await setInStorage(new_username, newUserData);
                if (setStatus.error) {
                    return { error: setStatus.error };
                }

                const deleteStatus = await deleteFromStorage(username);
                if (deleteStatus.error) {
                    return { error: deleteStatus.error };
                }
        
                return true; // Login successful
            } catch (error) {
                console.error("[Client] Username Updation process encountered an error:", error);
                return false;
            }
        },

        delete: async (username, secret, next_factor_secret, deviceID) => {
            try {
                // Step 1: Initiate login request with the verifier
                const verifierResponse = await apiHandler({
                    apiMap,
                    apiType: verifierAPI[0],
                    endpoint: 'handleLoginRequest',
                    payload: [username],
                });
                
                const validVerifierResponse = await handleVerifierResponse(verifierResponse, username);
                if (!validVerifierResponse) return false;
        
                // If the username does not exist, login cannot proceed
                if (!validVerifierResponse.exists) {
                    console.warn(`[Client] Username "${username}" is not registered.`);
                    return false;
                }
        
                // Step 2: Generate RIDs and prepare client-side data
                const RIDs = await client.coco_client_step_2(
                    verifierResponse.userId,
                    secret,
                    validVerifierResponse.salts,
                    validVerifierResponse.pepper
                );
                const { publicKey: deviceKey, publicAttributes: deviceAttributes, blindSignRequest: deviceBlindRequest } =
                    client.coco_client_step_3(deviceID);
        
                // Step 3: Request blind signatures from authenticators
                const authResponses = [];
                for (const apiType of authAPIs) {
                    const authResponse = await apiHandler({
                        apiMap,
                        apiType,
                        endpoint: 'handleBlindSignatureRequest',
                        payload: [deviceBlindRequest, deviceKey, deviceAttributes],
                    });
                    const validResponse = await handleBlindSignatureRequestResponse(authResponse);
                    if (!validResponse) {
                        console.error("[Client] User Deletion failed at an authenticator.");
                        return false;
                    }
                    authResponses.push(authResponse);
                }
        
                // Step 4: Perform OPRF evaluations
                const { blindDataArray, evalReqArray, proofArray } = await client.coco_client_step_4(
                    authResponses.map((res) => res.Signature),
                    authResponses.map((res) => res.VK),
                    RIDs
                );
        
                const evalResponses = [];
                for (let i = 0; i < authAPIs.length; i++) {
                    const authEvalResponse = await apiHandler({
                        apiMap,
                        apiType: authAPIs[i],
                        endpoint: 'handleOPRFEvaluation',
                        payload: [
                            authResponses.map((res) => res.VK),
                            proofArray[i],
                            deviceAttributes,
                            evalReqArray[i],
                        ],
                    });
                    const validResponse = await handleOPRFEvaluationResponse(authEvalResponse);
                    if (!validResponse) {
                        console.error("[Client] User Deletion failed at an authenticator.");
                        return false;
                    }
                    evalResponses.push(authEvalResponse);
                }
        
                // Step 5: Generate authentication keys
                const authenticationData = await client.coco_client_step_5(
                    RIDs,
                    validVerifierResponse.salts,
                    evalResponses.map((res) => res.Evaluation),
                    blindDataArray
                );
        
                const { ids, proofs, publicAttributesArray } = authenticationData;
                
                // Step 6: Create recovery/next factor credentials using the recovery/next factor secret
                const RIDsNew = await client.coco_client_step_2(
                    verifierResponse.userId,
                    next_factor_secret,
                    validVerifierResponse.salts,
                    validVerifierResponse.pepper
                );
        
                const { publicKey: newDeviceKey, publicAttributes: newDeviceAttributes, blindSignRequest: newDeviceBlindRequest } =
                    client.coco_client_step_3(deviceID);
        
                // Step 6: Request blind signatures for the new password
                const newAuthResponses = [];
                for (const apiType of authAPIs) {
                    const authResponse = await apiHandler({
                        apiMap,
                        apiType,
                        endpoint: 'handleBlindSignatureRequest',
                        payload: [newDeviceBlindRequest, newDeviceKey, newDeviceAttributes],
                    });
                    const validResponse = await handleBlindSignatureRequestResponse(authResponse);
                    if (!validResponse) {
                        console.error("[Client] Registration failed at an authenticator.");
                        return false;
                    }
                    newAuthResponses.push(authResponse);
                }
        
                // Step 7: OPRF evaluations for the new password
                const { blindDataArray: newBlindDataArray, evalReqArray: newEvalReqArray, proofArray: newProofArray } =
                    await client.coco_client_step_4(
                        newAuthResponses.map((res) => res.Signature),
                        newAuthResponses.map((res) => res.VK),
                        RIDsNew
                    );
        
                const newEvalResponses = [];
                for (let i = 0; i < authAPIs.length; i++) {
                    const authEvalResponse = await apiHandler({
                        apiMap,
                        apiType: authAPIs[i],
                        endpoint: 'handleOPRFEvaluation',
                        payload: [
                            newAuthResponses.map((res) => res.VK),
                            newProofArray[i],
                            newDeviceAttributes,
                            newEvalReqArray[i],
                        ],
                    });
                    const validResponse = await handleOPRFEvaluationResponse(authEvalResponse);
                    if (!validResponse) {
                        console.error("[Client] User Deletion failed at an authenticator.");
                        return false;
                    }
                    newEvalResponses.push(authEvalResponse);
                }

                // Step 5: Generate new authentication data
                const recoveryData = await client.coco_client_step_5(
                    RIDsNew,
                    validVerifierResponse.salts,
                    newEvalResponses.map((res) => res.Evaluation),
                    newBlindDataArray
                );
        
                const { ids: newIds, verificationKeys: newVerificationKeys, proofs: newProofs, publicAttributesArray: newPublicAttributesArray } = recoveryData;
                
                const { publicKey: accessKey, publicAttributes: accessAttrs, blindSignRequest: accessBlindReq } =
                    client.coco_client_step_6(username);

                // Step 6: Submit login requests to authenticators
                const loginResponses = [];
                for (let i = 0; i < authAPIs.length; i++) {
                    const authLoginResponse = await apiHandler({
                        apiMap,
                        apiType: authAPIs[i],
                        endpoint: 'handleDeleteCredentialRequest',
                        payload: [
                            ids[i],
                            proofs[i], 
                            publicAttributesArray[i],
                            newIds[i],
                            newProofs[i],
                            newPublicAttributesArray[i],
                            accessBlindReq,
                            accessKey,
                            accessAttrs,
                        ],
                    });
                    const validResponse = await handleDeleteCredentialResponse(authLoginResponse, ids[i]);
                    if (!validResponse) {
                        console.error("[Client] User Deletion failed at an authenticator.");
                        return false;
                    }
                    loginResponses.push(authLoginResponse);
                }
        
                // Step 7: Finalize login
                const { proof, randomizedCredential, aggregatedVerificationKey } = client.coco_client_step_7(
                    loginResponses.map((res) => res.Signature),
                    loginResponses.map((res) => res.VK)
                );

                const finalResponse = await apiHandler({
                    apiMap,
                    apiType: verifierAPI[0],
                    endpoint: 'handleDeleteUserRequest',
                    payload: [
                        username,
                        loginResponses.map((res) => res.VK),
                        proof,
                        accessAttrs,
                    ],
                });
        
                const validFinalResponse = await handleDeletionCompletion(finalResponse, username);
                if (!validFinalResponse) return false;

                const deleteStatus = await deleteFromStorage(username);
                if (deleteStatus.error) {
                    return { error: deleteStatus.error };
                }
        
                return true; 
            } catch (error) {
                console.error("[Client] Deletion process encountered an error:", error);
                return false;
            }
        },

        credentialLogin: async (username) => {
            try{
                const userData = await getFromStorage(username); // cloning to protect from overwrite... honestly I am confused

                if (!userData) {
                    return false;
                }

                const {                
                    proof,
                    randomizedCredential,
                    newAggregatedVerificationKey,
                } = client.coco_client_step_8(userData.Credential, userData.AggregatedVerificationKey);

                const finalResponse = await apiHandler({
                    apiMap,
                    apiType: verifierAPI[0],
                    endpoint: 'credentialLogin',
                    payload: [
                        username,
                        userData.verificationKeys,
                        proof,
                        userData.publicAttributes
                    ],
                });
        
                const validFinalResponse = await handleLoginCompletion(finalResponse, username);
                if (!validFinalResponse) return false;

                const newUserData = {
                    ...userData,
                    Proof: proof,
                    Credential: randomizedCredential,
                };

                const updateStatus = await updateInStorage(username, newUserData);
                if (updateStatus.error) {
                    return { error: updateStatus.error };
                }
                
                return true;
            }catch (error) {
                console.error("[Client] Credential login process encountered an error:", error);
                return false;
            }   
        }
    };
}

module.exports = client;