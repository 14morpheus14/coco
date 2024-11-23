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

'use strict';

const H = require("../argonHash.js");
const CoconutClient = require("../coconut/coconutClientState.js");
const CoconutSelfSigner = require("../coconut/coconutSelfSign.js");
const OPRFClientHandler = require("../oprf/oprfClient.js");
const generateSecureRandom = require("../randomGen.js");
const {MAX_ATTRIBUTES, SALT_N_PEPPER_LENGTH, AUTHENTICATOR_TOKEN_VALIDITY, VERIFIER_TOKEN_VALIDITY} = require("../../config.js");

class COCOClientState {
    
    constructor(max_authenticators) {
        try {
            if (typeof max_authenticators !== "number" || max_authenticators <= 0) {
                throw new Error("Invalid value for max_authenticators. It should be a positive number.");
            }
            this.number_of_authenticators = max_authenticators;
            this.oprfClient = new OPRFClientHandler();
            this.coconutClient = new CoconutClient(MAX_ATTRIBUTES);
        } catch (error) {
            console.error("Error initializing COCOClientState:", error.message);
            throw error;
        }
    }
    /**
     * Generate a random buffer of the given length.
     * @private
     * @param {number} length - The length of the random string to generate in bytes.
     * @returns {string} - A securely generated random hex string.
     */
    _generateRandom(length) {
        try {
            if (typeof length !== "number" || length <= 0) {
                throw new Error("Invalid length for random string generation. Must be a positive number.");
            }
            return generateSecureRandom(length);
        } catch (error) {
            console.error("Error generating random string:", error.message);
            throw error;
        }
    }

    /**
     * Generate a hash from the provided inputs.
     * @private
     * @param {...string} input - hex strings to hash together.
     * @returns {Promise<string>} - The resulting hash as a hex string.
     */
    async _hash(...input) {
        try {
            if (!input.every(item => typeof item === "string")) {
                throw new Error("All inputs to _hash must be strings.");
            }
            return await H(...input);
        } catch (error) {
            console.error("Error generating hash:", error.message);
            throw error;
        }
    }

    /**
     * Generate a blind signing request using the Coconut library.
     * @private
     * @param {Array<Object>} rawAttributes - The attributes to include in the blind signing request.
     * @returns {Object} - The public key, public attributes, and the blind signing request.
     * @property {string} publicKey - The public key of client.
     * @property {Array<Object>} publicAttributes - The public attributes in client's rawAttributes.
     * @property {string} blindSignRequest - The prepared blind signature request to be sent to signing authority. 
     */
    _generateBlindSignRequest(rawAttributes) {
        try {
            if (!Array.isArray(rawAttributes) || rawAttributes.length === 0) {
                throw new Error("Invalid rawAttributes provided. Must be a non-empty array.");
            }
            const { publicKey, publicAttributes, blindSignRequest } = this.coconutClient.configureAndPrepareSign(rawAttributes);
            if (!publicKey || !publicAttributes || !blindSignRequest) {
                throw new Error("Failed to generate blind sign request. Ensure the attributes are valid.");
            }
            return { publicKey, publicAttributes, blindSignRequest };
        } catch (error) {
            console.error("Error generating blind sign request:", error.message);
            throw error;
        }
    }

    /**
     * Generate a proof of credential from blind signatures and verification keys.
     * @private
     * @param {Array<Object>} blindSignatures - The blind signatures received from the server.
     * @param {Array<Object>} verificationKeys - The corresponding verification keys.
     * @returns {Object} - The proof, randomized credential, and aggregated verification key.
     * @property {string} proof - The proof of valid aggregated blind signature to be sent to verifying authority. 
     * @property {string} randomizedCredential - The re-randomized valid aggregated blind signature.
     * @property {string} aggregatedVerificationKey - The aggregated verification key of all signing authorities.
     */
    _generateProof(blindSignatures, verificationKeys) {
        try {
            if (!Array.isArray(blindSignatures) || !Array.isArray(verificationKeys)) {
                throw new Error("Invalid inputs. Both blindSignatures and verificationKeys must be arrays.");
            }
            const { proof, randomizedCredential, aggregatedVerificationKey } = this.coconutClient.processAndProveCredential(blindSignatures, verificationKeys);
            if (!proof || !randomizedCredential || !aggregatedVerificationKey) {
                throw new Error("Failed to generate proof. Ensure inputs are correct.");
            }
            return { proof, randomizedCredential, aggregatedVerificationKey };
        } catch (error) {
            console.error("Error generating proof:", error.message);
            throw error;
        }
    }

    /**
     * Generate a new proof of credential.
     * @private
     * @param {Object} randomizedCred - The randomized credential.
     * @param {Object} aggregatedVerificationKey - The aggregated verification key.
     * @returns {Object} - The new proof, re-randomized credential, and updated verification key.
     * @property {string} proof - The new proof generated by re-randomizing the previous credential (aggregated blind signature).
     * @property {string} randomizedCredential - Further re-randomized credential to use as input in subsequent calls to this function.
     * @property {string} sameAggregatedVerificationKey - Aggregated verification key to use as input in subsequent calls to this function.
     */
    _generateNewProof(randomizedCred, aggregatedVerificationKey) {
        try {
            if (!randomizedCred || !aggregatedVerificationKey) {
                throw new Error("Invalid inputs for generating new proof.");
            }
            const { proof, randomizedCredential, aggregatedVerificationKey: sameAggregatedVerificationKey } = this.coconutClient.generateNewProofOfCredential(randomizedCred, aggregatedVerificationKey);
            if (!proof || !randomizedCredential || !sameAggregatedVerificationKey) {
                throw new Error("Failed to generate new proof. Ensure inputs are valid.");
            }
            return { proof, randomizedCredential, aggregatedVerificationKey: sameAggregatedVerificationKey };
        } catch (error) {
            console.error("Error generating new proof:", error.message);
            throw error;
        }
    }

    /**
     * Prepare a blinded OPRF evaluation request.
     * @private
     * @param {string} priv_input - The private input to blind.
     * @returns {Promise<Object>} - The blind data and serialized evaluation request.
     * @property {string} hexFinalizeData - The hex string for serialized finalize data.
     * @property {string} hexEvalRequest - The hex string for serialized evaluation request to send to OPRF Evaluation server. 
     */
    async _blindOPRFInput(priv_input) {
        try {
            if (!(typeof priv_input === "string")) {
                throw new Error("priv_input must be a string.");
            }
            const { hexFinalizeData, hexEvalRequest } = await this.oprfClient.prepareBlindEvaluation(priv_input);
            if (!hexFinalizeData || !hexEvalRequest) {
                throw new Error("Failed to prepare OPRF blind input.");
            }
            return { hexFinalizeData, hexEvalRequest };
        } catch (error) {
            console.error("Error preparing OPRF blind input:", error.message);
            throw error;
        }
    }

    /**
     * Finalize the OPRF evaluation.
     * @private
     * @param {string} responseData - The evaluation response from the server.
     * @param {string} blindData - The blind data used in the request.
     * @returns {Promise<Buffer>} - The finalized OPRF result.
     * @property {string} response - The OPRF Evaluation response in hex string.
     */
    async _finalizeOPRF(responseData, blindData) {
        try {
            if (!(typeof blindData === "string") || !(typeof responseData === "string")) {
                throw new Error("Both responseData and blindData must be strings.");
            }
            const deserializedEval = this.oprfClient.deserializeEvaluationResponse(responseData);
            const deserializedBlind = this.oprfClient.deserializeFinalizeData(blindData);
            const response = await this.oprfClient.completeEvaluation(deserializedBlind, deserializedEval);
            if (!response) {
                throw new Error("Failed to finalize OPRF evaluation.");
            }
            return response;
        } catch (error) {
            console.error("Error finalizing OPRF evaluation:", error.message);
            throw error;
        }
    }

        /**
     * Generate a self-signed credential and proof with error handling.
     * @private
     * @param {Array<Object>} rawAttributes - The attributes to sign.
     * @param {string} private_key - The private key for signing.
     * @returns {Object} - The randomized credential, public attributes, verification key, and proof.
     * @property {string} randomizedCred - The re-randomized self-blind signature.
     * @property {Array<Object>} publicAttributes - The public attributes in rawAttributes.
     * @property {string} verificationKey - The verification key for the self-blind signature.
     * @property {string} proof - The proof of the self-blind signature.
     */
    _generateSelfSignature(rawAttributes, private_key) {
        try {
            // Input validation
            if (!Array.isArray(rawAttributes)) {
                throw new Error("rawAttributes must be an array of objects.");
            }

            if (!rawAttributes.every(attr => typeof attr === "object" && attr !== null)) {
                throw new Error("Each element in rawAttributes must be a non-null object.");
            }

            if (typeof private_key !== "string" || private_key.trim() === "") {
                throw new Error("private_key must be a non-empty string.");
            }

            // Generate self-signed credential and proof
            const coconutSelfSign = new CoconutSelfSigner(MAX_ATTRIBUTES, private_key);
            const { randomizedCred, publicAttributes, verificationKey, proof } = coconutSelfSign.selfSignAndProve(rawAttributes);

            // Return the result if successful
            return {
                randomizedCred,
                publicAttributes,
                verificationKey,
                proof,
            };
        } catch (error) {
            console.error("Error generating self-signed credential:", error.message);

            // Gracefully return a consistent structure with error info
            return {
                error: true,
                message: error.message,
                randomizedCred: null,
                publicAttributes: null,
                verificationKey: null,
                proof: null,
            };
        }
    }

    // -----------------------------------------------------------------------------------------------------
    // Public Methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Generate a blind sign request for registering uid.
     * @param {string} sub - The subject (some sort of identity).
     * @param {number} [iat=Date.now()/1000] - Issued-at timestamp.
     * @param {number} [exp=iat+AUTHENTICATOR_TOKEN_VALIDITY] - Expiration timestamp.
     * @param {string} [scope="register:uid"] - Access scope.
     * @returns {Object} - The public key, public attributes, and blind sign request.
     * @property {string} publicKey - The public key of client.
     * @property {Array<Object>} publicAttributes - The public attributes in client's rawAttributes.
     * @property {string} blindSignRequest - The prepared blind signature request to be sent to signing authority. 
     */
    coco_client_step_0(sub, iat = Math.floor(Date.now() / 1000), exp = iat + AUTHENTICATOR_TOKEN_VALIDITY, scope = "register:uid") {
        try {
            if (typeof sub !== 'string' || !sub.trim()) {
                throw new Error("Invalid sub. It must be a non-empty string.");
            }
            if (typeof iat !== 'number' || typeof exp !== 'number' || exp <= iat) {
                throw new Error("Invalid timestamps. `exp` must be greater than `iat`.");
            }
            if (typeof scope !== 'string' || !scope.trim()) {
                throw new Error("Invalid scope. It must be a non-empty string.");
            }
    
            const rawAttributes = [
                { value: sub, is_private: true },
                { value: iat.toString(), is_private: false },
                { value: exp.toString(), is_private: false },
                { value: scope, is_private: false }
            ];
            const { publicKey, publicAttributes, blindSignRequest } = this._generateBlindSignRequest(rawAttributes);
            return { publicKey, publicAttributes, blindSignRequest };
        } catch (error) {
            console.error("Error in coco_client_step_0:", error);
            throw new Error("Failed to generate blind sign request.");
        }
    }
    
    /**
     * Generate salts for registration.
     * @returns {Array<string>} - An array of generated salts.
     */
    coco_client_step_1() {
        try {
            if (typeof this.number_of_authenticators !== 'number' || this.number_of_authenticators <= 0) {
                throw new Error("Invalid number_of_authenticators. It must be a positive number.");
            }
            const salts = [];
            for (let i = 0; i < this.number_of_authenticators; i++) {
                const salt = this._generateRandom(SALT_N_PEPPER_LENGTH);
                salts.push(salt);
            }
            return salts;
        } catch (error) {
            console.error("Error in coco_client_step_1:", error);
            throw new Error("Failed to generate salts.");
        }
    }

    /**
     * Generate real identity strings (RIDs) for a user.
     * @param {string} uid - The user ID.
     * @param {string} secret - The user's secret.
     * @param {Array<string>} salts - The salts to use in RID generation.
     * @param {string} pepper - The pepper for added randomness.
     * @returns {Promise<Array<string>>} - An array of generated RIDs.
     */
    async coco_client_step_2(uid, secret, salts, pepper) {
        try {
            if (typeof uid !== 'string' || !uid.trim()) {
                throw new Error("Invalid uid. It must be a non-empty string.");
            }
            if (typeof secret !== 'string' || !secret.trim()) {
                throw new Error("Invalid secret. It must be a non-empty string.");
            }
            if (!Array.isArray(salts) || !salts.every(s => typeof s === 'string')) {
                throw new Error("Invalid salts. It must be an array of strings.");
            }
            if (typeof pepper !== 'string' || !pepper.trim()) {
                throw new Error("Invalid pepper. It must be a non-empty string.");
            }
    
            const rids = await Promise.all(
                salts.map(async salt => {
                    const hashedSecret = await this._hash(secret, salt);
                    return await this._hash(uid, hashedSecret, pepper);
                })
            );
            return rids;
        } catch (error) {
            console.error("Error in coco_client_step_2:", error);
            throw new Error("Failed to generate RIDs.");
        }
    }    

    /**
     * Generate a blind sign request for OPRF evaluation access.
     * @param {string} sub - The subject (some sort of identity).
     * @param {number} [iat=Date.now()/1000] - Issued-at timestamp.
     * @param {number} [exp=iat+AUTHENTICATOR_TOKEN_VALIDITY] - Expiration timestamp.
     * @param {string} [scope="evaluate:OPRF"] - Access scope.
     * @returns {Object} - The public key, public attributes, and blind sign request.
     * @property {string} publicKey - The public key of client.
     * @property {Array<Object>} publicAttributes - The public attributes in client's rawAttributes.
     * @property {string} blindSignRequest - The prepared blind signature request to be sent to signing authority. 
     */
    coco_client_step_3(sub, iat = Math.floor(Date.now() / 1000), exp = iat + AUTHENTICATOR_TOKEN_VALIDITY, scope = "evaluate:OPRF") {
        try {
            if (typeof sub !== 'string' || !sub.trim()) {
                throw new Error("Invalid sub. It must be a non-empty string.");
            }
            if (typeof iat !== 'number' || typeof exp !== 'number' || exp <= iat) {
                throw new Error("Invalid timestamps. `exp` must be greater than `iat`.");
            }
            if (typeof scope !== 'string' || !scope.trim()) {
                throw new Error("Invalid scope. It must be a non-empty string.");
            }
    
            const rawAttributes = [
                { value: sub, is_private: true },
                { value: iat.toString(), is_private: false },
                { value: exp.toString(), is_private: false },
                { value: scope, is_private: false }
            ];
            const { publicKey, publicAttributes, blindSignRequest } = this._generateBlindSignRequest(rawAttributes);
            return { publicKey, publicAttributes, blindSignRequest };
        } catch (error) {
            console.error("Error in coco_client_step_3:", error);
            throw new Error("Failed to generate blind sign request.");
        }
    }    

    /**
     * Generate a proof of OPRF evaluation access token and prepare blinded OPRF inputs.
     * @param {Array<string>} blindSignatures - The blind signatures from the authorization server.
     * @param {Array<string>} verificationKeys - The verification keys corresponding to the blind signatures.
     * @param {Array<string>} rids - The real identity strings for the user.
     * @returns {Promise<Object>} - An object containing blind data array, serialized evaluation requests array, and the proof.
     * @property {Array<string>} blindDataArray - An array of blind data indexed by the OPRF evaluators.
     * @property {Array<string>} serializedEvalReqArray - An array of hex serialized OPRF evaluation requests indexed by OPRF evaluators.
     * @property {Array<string>} proofArray - An array of hex proof-s indexed by the OPRF evaluators. 
     */
    async coco_client_step_4(blindSignatures, verificationKeys, rids) {
        try {
            if (!Array.isArray(blindSignatures) || !blindSignatures.every(sig => typeof sig === 'string')) {
                throw new Error("Invalid blindSignatures. It must be an array of strings.");
            }
            if (!Array.isArray(verificationKeys) || !verificationKeys.every(key => typeof key === 'string')) {
                throw new Error("Invalid verificationKeys. It must be an array of strings.");
            }
            if (!Array.isArray(rids) || !rids.every(rid => typeof rid === 'string')) {
                throw new Error("Invalid RIDs. It must be an array of strings.");
            }
    
            let { proof, randomizedCredential, aggregatedVerificationKey } = this._generateProof(blindSignatures, verificationKeys);
            const proofArray = [];
            const blindDataArray = [];
            const evalReqArray = [];
        
            // Prepare blinded OPRF inputs for each RID
            for (let i = 0; i < rids.length; i++) {
                // Reassign variables without redeclaring
                ({ proof, randomizedCredential, aggregatedVerificationKey } = this._generateNewProof(randomizedCredential, aggregatedVerificationKey));
                
                proofArray.push(proof); 
                const { hexFinalizeData, hexEvalRequest } = await this._blindOPRFInput(rids[i]);
                if (!hexFinalizeData || !hexEvalRequest) {
                    throw new Error(`_blindOPRFInput did not return valid data for RID: ${rids[i]}`);
                }
                blindDataArray.push(hexFinalizeData);
                evalReqArray.push(hexEvalRequest);
            
            }
    
            return {
                blindDataArray,
                evalReqArray,
                proofArray,
            };
        } catch (error) {
            console.error("Error in coco_client_step_4:", error);
            throw new Error("Failed to prepare blinded OPRF inputs.");
        }
    }    
        
    /**
     * Generate user IDs (IDs) for the authentication server and corresponding attributes.
     * @param {Array<string>} rids - Real identity strings for the user.
     * @param {Array<string>} salts - Salts used in registration.
     * @param {Array<string>} responseDatas - OPRF evaluation responses.
     * @param {Array<string>} blindDatas - Blinded OPRF input data.
     * @returns {Promise<Object>} - An object containing IDs, verification keys, proofs, randomized credentials, and public attributes.
     * @property {Array<string>} ids - An array of id-s indexed by authenticator.
     * @property {Array<string>} verificationKeys - An array of verification keys associated with id-s indexed by authenticator.
     * @property {Array<string>} proofs - An array of proofs associated with verification keys indexed by authenticator.
     * @property {Array<Array<Object>>} publicAttributes - An array of public attributes associated with proofs indexed by authenticator.  
     */
    async coco_client_step_5(rids, salts, responseDatas, blindDatas) {
        try {
            if (!Array.isArray(rids) || !Array.isArray(salts) || !Array.isArray(responseDatas) || !Array.isArray(blindDatas)) {
                throw new Error("All inputs must be arrays.");
            }
            if (rids.length !== salts.length || salts.length !== responseDatas.length || responseDatas.length !== blindDatas.length) {
                throw new Error("All input arrays must have the same length.");
            }
    
            const ids = [];
            const rawAttributes = [];
            const publicAttributesArray = [];
            const verificationKeys = [];
            const proofs = [];
        
            const allResponses = [];
        
            // Finalize OPRF evaluations
            for (let i = 0; i < responseDatas.length; i++) {
                const res = await this._finalizeOPRF(responseDatas[i], blindDatas[i]);
                allResponses.push(res);
            }
        
            // Generate IDs and attributes for each RID
            for (let i = 0; i < rids.length; i++) {
                const hashedResponses = await this._hash(allResponses.join(','), salts[i]);
                const id = await this._hash(rids[i], hashedResponses);
                ids.push(id);
        
                // Generate raw attributes
                const iat = Math.floor(Date.now() / 1000);
                const exp = iat + AUTHENTICATOR_TOKEN_VALIDITY;
                const scope = "prove:identity";
                const attributes = [
                    { value: id, is_private: true },
                    { value: iat.toString(), is_private: false },
                    { value: exp.toString(), is_private: false },
                    { value: scope, is_private: false }
                ];
                rawAttributes.push(attributes);
        
                // Generate self-signature for attributes
                const { randomizedCred, publicAttributes, verificationKey, proof } = this._generateSelfSignature(attributes, rids[i]);
                publicAttributesArray.push(publicAttributes);
                verificationKeys.push(verificationKey);
                proofs.push(proof);
            }
        
            return {
                ids,
                verificationKeys,
                proofs,
                publicAttributesArray,
            };
        } catch (error) {
            console.error("Error in coco_client_step_5:", error);
            throw new Error("Failed to generate user IDs and attributes.");
        }
    }    

    /**
     * Generate a blind signing request for a resource access token.
     * @param {string} sub - The subject (some sort of user identity).
     * @param {number} [iat=Date.now()/1000] - Issued-at timestamp.
     * @param {number} [exp=iat+VERIFIER_TOKEN_VALIDITY] - Expiration timestamp (default is 30 days from `iat`).
     * @param {string} [scope="access:uid"] - Access scope.
     * @returns {Object} - The public key, public attributes, and blind sign request.
     * @property {string} publicKey - The public key of client requesting signature.
     * @property {Array<Object>} publicAttributes - The public attributes in rawAttributes.
     * @property {string} blindSignRequest - The blind signature request to send to signing authority
     */
    coco_client_step_6(sub, iat = Math.floor(Date.now() / 1000), exp = iat + VERIFIER_TOKEN_VALIDITY, scope = "access:uid") {    
        try {
            if (typeof sub !== 'string' || !sub.trim()) {
                throw new Error("Invalid sub. It must be a non-empty string.");
            }
            if (typeof iat !== 'number' || typeof exp !== 'number' || exp <= iat) {
                throw new Error("Invalid timestamps. `exp` must be greater than `iat`.");
            }
            if (typeof scope !== 'string' || !scope.trim()) {
                throw new Error("Invalid scope. It must be a non-empty string.");
            }
    
            const { publicKey, publicAttributes, blindSignRequest } = this._generateBlindSignRequest([
                { value: sub, is_private: true },
                { value: iat.toString(), is_private: false },
                { value: exp.toString(), is_private: false },
                { value: scope, is_private: false }
            ]);
            return {
                publicKey,
                publicAttributes,
                blindSignRequest,
            };
        } catch (error) {
            console.error("Error in coco_client_step_6:", error);
            throw new Error("Failed to generate blind signing request.");
        }
    }

    /**
     * Generate a proof of access token for resource access.
     * @param {Array<string>} blindSignatures - The blind signatures for access token.
     * @param {Array<string>} verificationKeys - The verification keys corresponding to the blind signatures.
     * @returns {Object} - The proof, randomized credential, and aggregated verification key.
     * @property {string} proof - The proof of access token to send to resource server.
     * @property {string} randomizedCred - The re-randomized access token to use for a new proof generation after current proof expires.
     * @property {string} aggregatedVerificationKey - The aggregated verification key to use in new proof generation. 
     */
    coco_client_step_7(blindSignatures, verificationKeys) {
        try {
            if (!Array.isArray(blindSignatures) || !blindSignatures.every(sig => typeof sig === 'string')) {
                throw new Error("Invalid blindSignatures. It must be an array of strings.");
            }
            if (!Array.isArray(verificationKeys) || !verificationKeys.every(key => typeof key === 'string')) {
                throw new Error("Invalid verificationKeys. It must be an array of strings.");
            }
       
            const { proof, randomizedCredential, aggregatedVerificationKey } = this._generateProof(blindSignatures, verificationKeys);
            return {
                proof,
                randomizedCredential,
                aggregatedVerificationKey,
            };
        }catch (error) {
            console.error("Error in coco_client_step_7:", error);
            throw new Error("Failed to generate proof of access token.");
        }
    }

    /**
     * Generate a new proof of access token from an existing randomized credential.
     * @param {Object} randomizedCred - The existing randomized credential.
     * @param {Object} aggregatedVerificationKey - The aggregated verification key for the credential.
     * @returns {Object} - The new proof, re-randomized credential, and updated verification key.
     * @property {string} new_proof - The new proof to use when current proof expires.
     * @property {string} rerandomizedCred - The re-randomized access token to use for a new proof generation after current proof expires.
     * @property {verificationKey} verificationKey - The aggregated verification key to use in new proof generation.
     */
    coco_client_step_8(randomizedCred, aggregatedVerificationKey) {
        try {
            if (!randomizedCred || !aggregatedVerificationKey) {
                throw new Error("Invalid inputs for generating new proof.");
            }
            const { proof, randomizedCredential, aggregatedVerificationKey:newAggregatedVerificationKey } = this._generateNewProof(randomizedCred, aggregatedVerificationKey);
            
            return {
                proof,
                randomizedCredential,
                newAggregatedVerificationKey,
            };
        }catch (error) {
            console.error("Error in coco_client_step_8:", error);
            throw new Error("Failed to generate new proof of access token.");
        }
    }    
}

module.exports = COCOClientState;
