/*
 * This file includes code from the Coconut (https://github.com/nymtech/coconut).
 * Coconut is licensed under the Apache License 2.0. See LICENSE or NOTICE for more information.
 */
/* tslint:disable */
/* eslint-disable */
/**
*/
export function set_panic_hook(): void;
/**
*/
export class CoconutAuthState {
  free(): void;
/**
* @param {number} max_attributes
*/
  constructor(max_attributes: number);
/**
* @param {any} blind_sign_request
* @param {any} client_public_key
* @param {Array<any>} public_attributes
* @returns {any}
*/
  blind_sign(blind_sign_request: any, client_public_key: any, public_attributes: Array<any>): any;
/**
*/
  readonly get_signing_authority_verification_key: any;
}
/**
*/
export class CoconutClientState {
  free(): void;
/**
* @param {number} max_attributes
*/
  constructor(max_attributes: number);
/**
* @returns {any}
*/
  prepare_blind_sign(): any;
/**
* @param {Array<any>} blinded_signatures
* @returns {any}
*/
  unblind(blinded_signatures: Array<any>): any;
/**
* @param {Array<any>} issued_signatures
* @returns {any}
*/
  aggregate_signature_shares(issued_signatures: Array<any>): any;
/**
* @param {Array<any>} verification_keys
* @returns {any}
*/
  aggregate_verification_keys(verification_keys: Array<any>): any;
/**
* @param {any} aggregated_credential
* @returns {any}
*/
  randomise_credential(aggregated_credential: any): any;
/**
* @param {any} aggregated_vk
* @param {any} aggregated_signature
* @returns {any}
*/
  prove_credential(aggregated_vk: any, aggregated_signature: any): any;
/**
*/
  readonly get_client_public_key: any;
/**
*/
  raw_attributes: Array<any>;
}
/**
*/
export class CoconutDemoState {
  free(): void;
/**
* @param {number} max_attributes
* @param {bigint} num_signing_authorities
* @param {bigint} threshold
*/
  constructor(max_attributes: number, num_signing_authorities: bigint, threshold: bigint);
/**
* @returns {any}
*/
  signing_authorities_public_keys(): any;
/**
* @returns {any}
*/
  randomise_credential(): any;
/**
* @returns {any}
*/
  issued_signatures(): any;
/**
* @returns {any}
*/
  aggregate_signatures(): any;
/**
* @returns {any}
*/
  aggregate_verification_keys(): any;
/**
* @param {Array<any>} raw_attributes
* @param {any} credential
* @param {any} aggregated_vk
* @returns {boolean}
*/
  verify_credential(raw_attributes: Array<any>, credential: any, aggregated_vk: any): boolean;
/**
* @returns {any}
*/
  blind_sign_attributes(): any;
/**
*/
  readonly current_credential: any;
/**
*/
  raw_attributes: Array<any>;
/**
*/
  threshold: bigint;
}
/**
*/
export class CoconutDeterministicAuthState {
  free(): void;
/**
* @param {number} max_attributes
* @param {any} private_key
*/
  constructor(max_attributes: number, private_key: any);
/**
* @param {any} blind_sign_request
* @param {any} client_public_key
* @param {Array<any>} public_attributes
* @returns {any}
*/
  blind_sign(blind_sign_request: any, client_public_key: any, public_attributes: Array<any>): any;
/**
*/
  readonly get_signing_authority_verification_key: any;
}
/**
*/
export class CoconutState {
  free(): void;
/**
* @param {number} max_attributes
*/
  constructor(max_attributes: number);
/**
* @returns {any}
*/
  get_client_public_key(): any;
/**
* @returns {any}
*/
  get_signing_authority_verification_key(): any;
/**
* @param {Array<any>} raw_attributes
*/
  set_raw_attributes(raw_attributes: Array<any>): void;
/**
* @returns {any}
*/
  prepare_blind_sign(): any;
/**
* @param {any} blind_sign_request
* @param {any} client_public_key
* @param {Array<any>} public_attributes
* @returns {any}
*/
  blind_sign(blind_sign_request: any, client_public_key: any, public_attributes: Array<any>): any;
/**
* @param {Array<any>} blinded_signatures
* @returns {any}
*/
  unblind(blinded_signatures: Array<any>): any;
/**
* @param {Array<any>} issued_signatures
* @returns {any}
*/
  aggregate_signature_shares(issued_signatures: Array<any>): any;
/**
* @param {Array<any>} verification_keys
* @returns {any}
*/
  aggregate_verification_keys(verification_keys: Array<any>): any;
/**
* @param {any} aggregated_credential
* @returns {any}
*/
  randomise_credential(aggregated_credential: any): any;
/**
* @param {any} aggregated_vk
* @param {any} aggregated_signature
* @returns {any}
*/
  prove_credential(aggregated_vk: any, aggregated_signature: any): any;
/**
* @param {any} aggregated_vk
* @param {any} theta
* @param {Array<any>} public_attributes
* @returns {boolean}
*/
  verify_credential(aggregated_vk: any, theta: any, public_attributes: Array<any>): boolean;
}
/**
*/
export class CoconutVerifyState {
  free(): void;
/**
* @param {number} max_attributes
*/
  constructor(max_attributes: number);
/**
* @param {Array<any>} verification_keys
* @returns {any}
*/
  aggregate_verification_keys(verification_keys: Array<any>): any;
/**
* @param {any} aggregated_vk
* @param {any} theta
* @param {Array<any>} public_attributes
* @returns {boolean}
*/
  verify_credential(aggregated_vk: any, theta: any, public_attributes: Array<any>): boolean;
}
/**
*/
export class IssuedPartialSignatures {
  free(): void;
}
/**
*/
export class RawAttribute {
  free(): void;
/**
* @param {string} value
* @param {boolean} is_private
*/
  constructor(value: string, is_private: boolean);
}
/**
*/
export class SignatureAggregationResult {
  free(): void;
}
/**
*/
export class VerificationKeysAggregationResult {
  free(): void;
}
