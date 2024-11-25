/*
 * This file includes code from the Coconut (https://github.com/nymtech/coconut).
 * Coconut is licensed under the Apache License 2.0. See LICENSE or NOTICE for more information.
 */
/* tslint:disable */
/* eslint-disable */
export const memory: WebAssembly.Memory;
export function __wbg_rawattribute_free(a: number): void;
export function __wbg_issuedpartialsignatures_free(a: number): void;
export function __wbg_signatureaggregationresult_free(a: number): void;
export function __wbg_verificationkeysaggregationresult_free(a: number): void;
export function rawattribute_new(a: number, b: number, c: number): number;
export function __wbg_coconutdemostate_free(a: number): void;
export function __wbg_get_coconutdemostate_threshold(a: number): number;
export function __wbg_set_coconutdemostate_threshold(a: number, b: number): void;
export function coconutdemostate_new(a: number, b: number, c: number): number;
export function coconutdemostate_signing_authorities_public_keys(a: number): number;
export function coconutdemostate_current_credential(a: number): number;
export function coconutdemostate_randomise_credential(a: number): number;
export function coconutdemostate_issued_signatures(a: number): number;
export function coconutdemostate_aggregate_signatures(a: number): number;
export function coconutdemostate_aggregate_verification_keys(a: number): number;
export function coconutdemostate_verify_credential(a: number, b: number, c: number, d: number): number;
export function coconutdemostate_set_raw_attributes(a: number, b: number): void;
export function coconutdemostate_blind_sign_attributes(a: number): number;
export function __wbg_coconutstate_free(a: number): void;
export function coconutstate_new(a: number): number;
export function coconutstate_get_client_public_key(a: number): number;
export function coconutstate_get_signing_authority_verification_key(a: number): number;
export function coconutstate_set_raw_attributes(a: number, b: number): void;
export function coconutstate_prepare_blind_sign(a: number): number;
export function coconutstate_blind_sign(a: number, b: number, c: number, d: number): number;
export function coconutstate_unblind(a: number, b: number): number;
export function coconutstate_aggregate_signature_shares(a: number, b: number): number;
export function coconutstate_aggregate_verification_keys(a: number, b: number): number;
export function coconutstate_randomise_credential(a: number, b: number): number;
export function coconutstate_prove_credential(a: number, b: number, c: number): number;
export function coconutstate_verify_credential(a: number, b: number, c: number, d: number): number;
export function __wbg_coconutauthstate_free(a: number): void;
export function coconutauthstate_new(a: number): number;
export function coconutauthstate_get_signing_authority_verification_key(a: number): number;
export function coconutauthstate_blind_sign(a: number, b: number, c: number, d: number): number;
export function __wbg_coconutverifystate_free(a: number): void;
export function coconutverifystate_new(a: number): number;
export function coconutverifystate_aggregate_verification_keys(a: number, b: number): number;
export function coconutverifystate_verify_credential(a: number, b: number, c: number, d: number): number;
export function __wbg_coconutclientstate_free(a: number): void;
export function coconutclientstate_new(a: number): number;
export function coconutclientstate_get_client_public_key(a: number): number;
export function coconutclientstate_set_raw_attributes(a: number, b: number): void;
export function coconutclientstate_prepare_blind_sign(a: number): number;
export function coconutclientstate_unblind(a: number, b: number): number;
export function coconutclientstate_aggregate_signature_shares(a: number, b: number): number;
export function coconutclientstate_aggregate_verification_keys(a: number, b: number): number;
export function coconutclientstate_randomise_credential(a: number, b: number): number;
export function coconutclientstate_prove_credential(a: number, b: number, c: number): number;
export function coconutdeterministicauthstate_new(a: number, b: number): number;
export function coconutdeterministicauthstate_get_signing_authority_verification_key(a: number): number;
export function coconutdeterministicauthstate_blind_sign(a: number, b: number, c: number, d: number): number;
export function __wbg_coconutdeterministicauthstate_free(a: number): void;
export function set_panic_hook(): void;
export function __wbindgen_malloc(a: number): number;
export function __wbindgen_realloc(a: number, b: number, c: number): number;
export function __wbindgen_free(a: number, b: number): void;
export function __wbindgen_exn_store(a: number): void;
