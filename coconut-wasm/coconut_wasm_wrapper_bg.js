/*
 * This file includes code from the Coconut (https://github.com/nymtech/coconut).
 * Coconut is licensed under the Apache License 2.0. See LICENSE or NOTICE for more information.
 */

import * as wasm from './coconut_wasm_wrapper_bg.wasm';

const heap = new Array(32).fill(undefined);

heap.push(undefined, null, true, false);

function getObject(idx) { return heap[idx]; }

let WASM_VECTOR_LEN = 0;

let cachedUint8Memory0 = new Uint8Array();

function getUint8Memory0() {
    if (cachedUint8Memory0.byteLength === 0) {
        cachedUint8Memory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8Memory0;
}

const lTextEncoder = typeof TextEncoder === 'undefined' ? (0, module.require)('util').TextEncoder : TextEncoder;

let cachedTextEncoder = new lTextEncoder('utf-8');

const encodeString = (typeof cachedTextEncoder.encodeInto === 'function'
    ? function (arg, view) {
    return cachedTextEncoder.encodeInto(arg, view);
}
    : function (arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    view.set(buf);
    return {
        read: arg.length,
        written: buf.length
    };
});

function passStringToWasm0(arg, malloc, realloc) {

    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length);
        getUint8Memory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len);

    const mem = getUint8Memory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }

    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3);
        const view = getUint8Memory0().subarray(ptr + offset, ptr + len);
        const ret = encodeString(arg, view);

        offset += ret.written;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

let cachedInt32Memory0 = new Int32Array();

function getInt32Memory0() {
    if (cachedInt32Memory0.byteLength === 0) {
        cachedInt32Memory0 = new Int32Array(wasm.memory.buffer);
    }
    return cachedInt32Memory0;
}

let heap_next = heap.length;

function dropObject(idx) {
    if (idx < 36) return;
    heap[idx] = heap_next;
    heap_next = idx;
}

function takeObject(idx) {
    const ret = getObject(idx);
    dropObject(idx);
    return ret;
}

const lTextDecoder = typeof TextDecoder === 'undefined' ? (0, module.require)('util').TextDecoder : TextDecoder;

let cachedTextDecoder = new lTextDecoder('utf-8', { ignoreBOM: true, fatal: true });

cachedTextDecoder.decode();

function getStringFromWasm0(ptr, len) {
    return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
}

function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1);
    const idx = heap_next;
    heap_next = heap[idx];

    heap[idx] = obj;
    return idx;
}

let cachedFloat64Memory0 = new Float64Array();

function getFloat64Memory0() {
    if (cachedFloat64Memory0.byteLength === 0) {
        cachedFloat64Memory0 = new Float64Array(wasm.memory.buffer);
    }
    return cachedFloat64Memory0;
}

function debugString(val) {
    // primitive types
    const type = typeof val;
    if (type == 'number' || type == 'boolean' || val == null) {
        return  `${val}`;
    }
    if (type == 'string') {
        return `"${val}"`;
    }
    if (type == 'symbol') {
        const description = val.description;
        if (description == null) {
            return 'Symbol';
        } else {
            return `Symbol(${description})`;
        }
    }
    if (type == 'function') {
        const name = val.name;
        if (typeof name == 'string' && name.length > 0) {
            return `Function(${name})`;
        } else {
            return 'Function';
        }
    }
    // objects
    if (Array.isArray(val)) {
        const length = val.length;
        let debug = '[';
        if (length > 0) {
            debug += debugString(val[0]);
        }
        for(let i = 1; i < length; i++) {
            debug += ', ' + debugString(val[i]);
        }
        debug += ']';
        return debug;
    }
    // Test for built-in
    const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
    let className;
    if (builtInMatches.length > 1) {
        className = builtInMatches[1];
    } else {
        // Failed to match the standard '[object ClassName]'
        return toString.call(val);
    }
    if (className == 'Object') {
        // we're a user defined class or Object
        // JSON.stringify avoids problems with cycles, and is generally much
        // easier than looping through ownProperties of `val`.
        try {
            return 'Object(' + JSON.stringify(val) + ')';
        } catch (_) {
            return 'Object';
        }
    }
    // errors
    if (val instanceof Error) {
        return `${val.name}: ${val.message}\n${val.stack}`;
    }
    // TODO we could test for more things here, like `Set`s and `Map`s.
    return className;
}
/**
*/
export function set_panic_hook() {
    wasm.set_panic_hook();
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        wasm.__wbindgen_exn_store(addHeapObject(e));
    }
}

function getArrayU8FromWasm0(ptr, len) {
    return getUint8Memory0().subarray(ptr / 1, ptr / 1 + len);
}
/**
*/
export class CoconutAuthState {

    static __wrap(ptr) {
        const obj = Object.create(CoconutAuthState.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_coconutauthstate_free(ptr);
    }
    /**
    * @param {number} max_attributes
    */
    constructor(max_attributes) {
        const ret = wasm.coconutauthstate_new(max_attributes);
        return CoconutAuthState.__wrap(ret);
    }
    /**
    * @returns {any}
    */
    get get_signing_authority_verification_key() {
        const ret = wasm.coconutauthstate_get_signing_authority_verification_key(this.ptr);
        return takeObject(ret);
    }
    /**
    * @param {any} blind_sign_request
    * @param {any} client_public_key
    * @param {Array<any>} public_attributes
    * @returns {any}
    */
    blind_sign(blind_sign_request, client_public_key, public_attributes) {
        const ret = wasm.coconutauthstate_blind_sign(this.ptr, addHeapObject(blind_sign_request), addHeapObject(client_public_key), addHeapObject(public_attributes));
        return takeObject(ret);
    }
}
/**
*/
export class CoconutClientState {

    static __wrap(ptr) {
        const obj = Object.create(CoconutClientState.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_coconutclientstate_free(ptr);
    }
    /**
    * @param {number} max_attributes
    */
    constructor(max_attributes) {
        const ret = wasm.coconutclientstate_new(max_attributes);
        return CoconutClientState.__wrap(ret);
    }
    /**
    * @returns {any}
    */
    get get_client_public_key() {
        const ret = wasm.coconutclientstate_get_client_public_key(this.ptr);
        return takeObject(ret);
    }
    /**
    * @param {Array<any>} raw_attributes
    */
    set raw_attributes(raw_attributes) {
        wasm.coconutclientstate_set_raw_attributes(this.ptr, addHeapObject(raw_attributes));
    }
    /**
    * @returns {any}
    */
    prepare_blind_sign() {
        const ret = wasm.coconutclientstate_prepare_blind_sign(this.ptr);
        return takeObject(ret);
    }
    /**
    * @param {Array<any>} blinded_signatures
    * @returns {any}
    */
    unblind(blinded_signatures) {
        const ret = wasm.coconutclientstate_unblind(this.ptr, addHeapObject(blinded_signatures));
        return takeObject(ret);
    }
    /**
    * @param {Array<any>} issued_signatures
    * @returns {any}
    */
    aggregate_signature_shares(issued_signatures) {
        const ret = wasm.coconutclientstate_aggregate_signature_shares(this.ptr, addHeapObject(issued_signatures));
        return takeObject(ret);
    }
    /**
    * @param {Array<any>} verification_keys
    * @returns {any}
    */
    aggregate_verification_keys(verification_keys) {
        const ret = wasm.coconutclientstate_aggregate_verification_keys(this.ptr, addHeapObject(verification_keys));
        return takeObject(ret);
    }
    /**
    * @param {any} aggregated_credential
    * @returns {any}
    */
    randomise_credential(aggregated_credential) {
        const ret = wasm.coconutclientstate_randomise_credential(this.ptr, addHeapObject(aggregated_credential));
        return takeObject(ret);
    }
    /**
    * @param {any} aggregated_vk
    * @param {any} aggregated_signature
    * @returns {any}
    */
    prove_credential(aggregated_vk, aggregated_signature) {
        const ret = wasm.coconutclientstate_prove_credential(this.ptr, addHeapObject(aggregated_vk), addHeapObject(aggregated_signature));
        return takeObject(ret);
    }
}
/**
*/
export class CoconutDemoState {

    static __wrap(ptr) {
        const obj = Object.create(CoconutDemoState.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_coconutdemostate_free(ptr);
    }
    /**
    * @returns {bigint}
    */
    get threshold() {
        const ret = wasm.__wbg_get_coconutdemostate_threshold(this.ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
    * @param {bigint} arg0
    */
    set threshold(arg0) {
        wasm.__wbg_set_coconutdemostate_threshold(this.ptr, arg0);
    }
    /**
    * @param {number} max_attributes
    * @param {bigint} num_signing_authorities
    * @param {bigint} threshold
    */
    constructor(max_attributes, num_signing_authorities, threshold) {
        const ret = wasm.coconutdemostate_new(max_attributes, num_signing_authorities, threshold);
        return CoconutDemoState.__wrap(ret);
    }
    /**
    * @returns {any}
    */
    signing_authorities_public_keys() {
        const ret = wasm.coconutdemostate_signing_authorities_public_keys(this.ptr);
        return takeObject(ret);
    }
    /**
    * @returns {any}
    */
    get current_credential() {
        const ret = wasm.coconutdemostate_current_credential(this.ptr);
        return takeObject(ret);
    }
    /**
    * @returns {any}
    */
    randomise_credential() {
        const ret = wasm.coconutdemostate_randomise_credential(this.ptr);
        return takeObject(ret);
    }
    /**
    * @returns {any}
    */
    issued_signatures() {
        const ret = wasm.coconutdemostate_issued_signatures(this.ptr);
        return takeObject(ret);
    }
    /**
    * @returns {any}
    */
    aggregate_signatures() {
        const ret = wasm.coconutdemostate_aggregate_signatures(this.ptr);
        return takeObject(ret);
    }
    /**
    * @returns {any}
    */
    aggregate_verification_keys() {
        const ret = wasm.coconutdemostate_aggregate_verification_keys(this.ptr);
        return takeObject(ret);
    }
    /**
    * @param {Array<any>} raw_attributes
    * @param {any} credential
    * @param {any} aggregated_vk
    * @returns {boolean}
    */
    verify_credential(raw_attributes, credential, aggregated_vk) {
        const ret = wasm.coconutdemostate_verify_credential(this.ptr, addHeapObject(raw_attributes), addHeapObject(credential), addHeapObject(aggregated_vk));
        return ret !== 0;
    }
    /**
    * @param {Array<any>} raw_attributes
    */
    set raw_attributes(raw_attributes) {
        wasm.coconutdemostate_set_raw_attributes(this.ptr, addHeapObject(raw_attributes));
    }
    /**
    * @returns {any}
    */
    blind_sign_attributes() {
        const ret = wasm.coconutdemostate_blind_sign_attributes(this.ptr);
        return takeObject(ret);
    }
}
/**
*/
export class CoconutState {

    static __wrap(ptr) {
        const obj = Object.create(CoconutState.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_coconutstate_free(ptr);
    }
    /**
    * @param {number} max_attributes
    */
    constructor(max_attributes) {
        const ret = wasm.coconutstate_new(max_attributes);
        return CoconutState.__wrap(ret);
    }
    /**
    * @returns {any}
    */
    get_client_public_key() {
        const ret = wasm.coconutstate_get_client_public_key(this.ptr);
        return takeObject(ret);
    }
    /**
    * @returns {any}
    */
    get_signing_authority_verification_key() {
        const ret = wasm.coconutstate_get_signing_authority_verification_key(this.ptr);
        return takeObject(ret);
    }
    /**
    * @param {Array<any>} raw_attributes
    */
    set_raw_attributes(raw_attributes) {
        wasm.coconutstate_set_raw_attributes(this.ptr, addHeapObject(raw_attributes));
    }
    /**
    * @returns {any}
    */
    prepare_blind_sign() {
        const ret = wasm.coconutstate_prepare_blind_sign(this.ptr);
        return takeObject(ret);
    }
    /**
    * @param {any} blind_sign_request
    * @param {any} client_public_key
    * @param {Array<any>} public_attributes
    * @returns {any}
    */
    blind_sign(blind_sign_request, client_public_key, public_attributes) {
        const ret = wasm.coconutstate_blind_sign(this.ptr, addHeapObject(blind_sign_request), addHeapObject(client_public_key), addHeapObject(public_attributes));
        return takeObject(ret);
    }
    /**
    * @param {Array<any>} blinded_signatures
    * @returns {any}
    */
    unblind(blinded_signatures) {
        const ret = wasm.coconutstate_unblind(this.ptr, addHeapObject(blinded_signatures));
        return takeObject(ret);
    }
    /**
    * @param {Array<any>} issued_signatures
    * @returns {any}
    */
    aggregate_signature_shares(issued_signatures) {
        const ret = wasm.coconutstate_aggregate_signature_shares(this.ptr, addHeapObject(issued_signatures));
        return takeObject(ret);
    }
    /**
    * @param {Array<any>} verification_keys
    * @returns {any}
    */
    aggregate_verification_keys(verification_keys) {
        const ret = wasm.coconutstate_aggregate_verification_keys(this.ptr, addHeapObject(verification_keys));
        return takeObject(ret);
    }
    /**
    * @param {any} aggregated_credential
    * @returns {any}
    */
    randomise_credential(aggregated_credential) {
        const ret = wasm.coconutstate_randomise_credential(this.ptr, addHeapObject(aggregated_credential));
        return takeObject(ret);
    }
    /**
    * @param {any} aggregated_vk
    * @param {any} aggregated_signature
    * @returns {any}
    */
    prove_credential(aggregated_vk, aggregated_signature) {
        const ret = wasm.coconutstate_prove_credential(this.ptr, addHeapObject(aggregated_vk), addHeapObject(aggregated_signature));
        return takeObject(ret);
    }
    /**
    * @param {any} aggregated_vk
    * @param {any} theta
    * @param {Array<any>} public_attributes
    * @returns {boolean}
    */
    verify_credential(aggregated_vk, theta, public_attributes) {
        const ret = wasm.coconutstate_verify_credential(this.ptr, addHeapObject(aggregated_vk), addHeapObject(theta), addHeapObject(public_attributes));
        return ret !== 0;
    }
}
/**
*/
export class CoconutVerifyState {

    static __wrap(ptr) {
        const obj = Object.create(CoconutVerifyState.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_coconutverifystate_free(ptr);
    }
    /**
    * @param {number} max_attributes
    */
    constructor(max_attributes) {
        const ret = wasm.coconutverifystate_new(max_attributes);
        return CoconutVerifyState.__wrap(ret);
    }
    /**
    * @param {Array<any>} verification_keys
    * @returns {any}
    */
    aggregate_verification_keys(verification_keys) {
        const ret = wasm.coconutverifystate_aggregate_verification_keys(this.ptr, addHeapObject(verification_keys));
        return takeObject(ret);
    }
    /**
    * @param {any} aggregated_vk
    * @param {any} theta
    * @param {Array<any>} public_attributes
    * @returns {boolean}
    */
    verify_credential(aggregated_vk, theta, public_attributes) {
        const ret = wasm.coconutverifystate_verify_credential(this.ptr, addHeapObject(aggregated_vk), addHeapObject(theta), addHeapObject(public_attributes));
        return ret !== 0;
    }
}
/**
*/
export class IssuedPartialSignatures {

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_issuedpartialsignatures_free(ptr);
    }
}
/**
*/
export class RawAttribute {

    static __wrap(ptr) {
        const obj = Object.create(RawAttribute.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_rawattribute_free(ptr);
    }
    /**
    * @param {string} value
    * @param {boolean} is_private
    */
    constructor(value, is_private) {
        const ptr0 = passStringToWasm0(value, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.rawattribute_new(ptr0, len0, is_private);
        return RawAttribute.__wrap(ret);
    }
}
/**
*/
export class SignatureAggregationResult {

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_signatureaggregationresult_free(ptr);
    }
}
/**
*/
export class VerificationKeysAggregationResult {

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_verificationkeysaggregationresult_free(ptr);
    }
}

export function __wbindgen_string_get(arg0, arg1) {
    const obj = getObject(arg1);
    const ret = typeof(obj) === 'string' ? obj : undefined;
    var ptr0 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len0 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len0;
    getInt32Memory0()[arg0 / 4 + 0] = ptr0;
};

export function __wbindgen_object_drop_ref(arg0) {
    takeObject(arg0);
};

export function __wbg_warn_862e78491633c9cc(arg0, arg1) {
    console.warn(getStringFromWasm0(arg0, arg1));
};

export function __wbg_error_68a062104d912e88(arg0, arg1) {
    console.error(getStringFromWasm0(arg0, arg1));
};

export function __wbindgen_boolean_get(arg0) {
    const v = getObject(arg0);
    const ret = typeof(v) === 'boolean' ? (v ? 1 : 0) : 2;
    return ret;
};

export function __wbindgen_is_object(arg0) {
    const val = getObject(arg0);
    const ret = typeof(val) === 'object' && val !== null;
    return ret;
};

export function __wbindgen_is_undefined(arg0) {
    const ret = getObject(arg0) === undefined;
    return ret;
};

export function __wbindgen_in(arg0, arg1) {
    const ret = getObject(arg0) in getObject(arg1);
    return ret;
};

export function __wbindgen_error_new(arg0, arg1) {
    const ret = new Error(getStringFromWasm0(arg0, arg1));
    return addHeapObject(ret);
};

export function __wbindgen_jsval_loose_eq(arg0, arg1) {
    const ret = getObject(arg0) == getObject(arg1);
    return ret;
};

export function __wbindgen_number_get(arg0, arg1) {
    const obj = getObject(arg1);
    const ret = typeof(obj) === 'number' ? obj : undefined;
    getFloat64Memory0()[arg0 / 8 + 1] = isLikeNone(ret) ? 0 : ret;
    getInt32Memory0()[arg0 / 4 + 0] = !isLikeNone(ret);
};

export function __wbindgen_number_new(arg0) {
    const ret = arg0;
    return addHeapObject(ret);
};

export function __wbindgen_bigint_from_u64(arg0) {
    const ret = BigInt.asUintN(64, arg0);
    return addHeapObject(ret);
};

export function __wbindgen_object_clone_ref(arg0) {
    const ret = getObject(arg0);
    return addHeapObject(ret);
};

export function __wbindgen_string_new(arg0, arg1) {
    const ret = getStringFromWasm0(arg0, arg1);
    return addHeapObject(ret);
};

export function __wbg_getwithrefkey_15c62c2b8546208d(arg0, arg1) {
    const ret = getObject(arg0)[getObject(arg1)];
    return addHeapObject(ret);
};

export function __wbg_set_20cbc34131e76824(arg0, arg1, arg2) {
    getObject(arg0)[takeObject(arg1)] = takeObject(arg2);
};

export function __wbg_new_abda76e883ba8a5f() {
    const ret = new Error();
    return addHeapObject(ret);
};

export function __wbg_stack_658279fe44541cf6(arg0, arg1) {
    const ret = getObject(arg1).stack;
    const ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len0;
    getInt32Memory0()[arg0 / 4 + 0] = ptr0;
};

export function __wbg_error_f851667af71bcfc6(arg0, arg1) {
    try {
        console.error(getStringFromWasm0(arg0, arg1));
    } finally {
        wasm.__wbindgen_free(arg0, arg1);
    }
};

export function __wbg_crypto_e1d53a1d73fb10b8(arg0) {
    const ret = getObject(arg0).crypto;
    return addHeapObject(ret);
};

export function __wbg_process_038c26bf42b093f8(arg0) {
    const ret = getObject(arg0).process;
    return addHeapObject(ret);
};

export function __wbg_versions_ab37218d2f0b24a8(arg0) {
    const ret = getObject(arg0).versions;
    return addHeapObject(ret);
};

export function __wbg_node_080f4b19d15bc1fe(arg0) {
    const ret = getObject(arg0).node;
    return addHeapObject(ret);
};

export function __wbindgen_is_string(arg0) {
    const ret = typeof(getObject(arg0)) === 'string';
    return ret;
};

export function __wbg_require_78a3dcfbdba9cbce() { return handleError(function () {
    const ret = module.require;
    return addHeapObject(ret);
}, arguments) };

export function __wbindgen_is_function(arg0) {
    const ret = typeof(getObject(arg0)) === 'function';
    return ret;
};

export function __wbg_msCrypto_6e7d3e1f92610cbb(arg0) {
    const ret = getObject(arg0).msCrypto;
    return addHeapObject(ret);
};

export function __wbg_randomFillSync_6894564c2c334c42() { return handleError(function (arg0, arg1, arg2) {
    getObject(arg0).randomFillSync(getArrayU8FromWasm0(arg1, arg2));
}, arguments) };

export function __wbg_getRandomValues_805f1c3d65988a5a() { return handleError(function (arg0, arg1) {
    getObject(arg0).getRandomValues(getObject(arg1));
}, arguments) };

export function __wbg_get_57245cc7d7c7619d(arg0, arg1) {
    const ret = getObject(arg0)[arg1 >>> 0];
    return addHeapObject(ret);
};

export function __wbg_length_6e3bbe7c8bd4dbd8(arg0) {
    const ret = getObject(arg0).length;
    return ret;
};

export function __wbg_new_1d9a920c6bfc44a8() {
    const ret = new Array();
    return addHeapObject(ret);
};

export function __wbg_newnoargs_b5b063fc6c2f0376(arg0, arg1) {
    const ret = new Function(getStringFromWasm0(arg0, arg1));
    return addHeapObject(ret);
};

export function __wbg_call_97ae9d8645dc388b() { return handleError(function (arg0, arg1) {
    const ret = getObject(arg0).call(getObject(arg1));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_new_0b9bfdd97583284e() {
    const ret = new Object();
    return addHeapObject(ret);
};

export function __wbg_self_6d479506f72c6a71() { return handleError(function () {
    const ret = self.self;
    return addHeapObject(ret);
}, arguments) };

export function __wbg_window_f2557cc78490aceb() { return handleError(function () {
    const ret = window.window;
    return addHeapObject(ret);
}, arguments) };

export function __wbg_globalThis_7f206bda628d5286() { return handleError(function () {
    const ret = globalThis.globalThis;
    return addHeapObject(ret);
}, arguments) };

export function __wbg_global_ba75c50d1cf384f4() { return handleError(function () {
    const ret = global.global;
    return addHeapObject(ret);
}, arguments) };

export function __wbg_set_a68214f35c417fa9(arg0, arg1, arg2) {
    getObject(arg0)[arg1 >>> 0] = takeObject(arg2);
};

export function __wbg_instanceof_ArrayBuffer_e5e48f4762c5610b(arg0) {
    let result;
    try {
        result = getObject(arg0) instanceof ArrayBuffer;
    } catch {
        result = false;
    }
    const ret = result;
    return ret;
};

export function __wbg_call_168da88779e35f61() { return handleError(function (arg0, arg1, arg2) {
    const ret = getObject(arg0).call(getObject(arg1), getObject(arg2));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_buffer_3f3d764d4747d564(arg0) {
    const ret = getObject(arg0).buffer;
    return addHeapObject(ret);
};

export function __wbg_new_8c3f0052272a457a(arg0) {
    const ret = new Uint8Array(getObject(arg0));
    return addHeapObject(ret);
};

export function __wbg_set_83db9690f9353e79(arg0, arg1, arg2) {
    getObject(arg0).set(getObject(arg1), arg2 >>> 0);
};

export function __wbg_length_9e1ae1900cb0fbd5(arg0) {
    const ret = getObject(arg0).length;
    return ret;
};

export function __wbg_instanceof_Uint8Array_971eeda69eb75003(arg0) {
    let result;
    try {
        result = getObject(arg0) instanceof Uint8Array;
    } catch {
        result = false;
    }
    const ret = result;
    return ret;
};

export function __wbg_newwithlength_f5933855e4f48a19(arg0) {
    const ret = new Uint8Array(arg0 >>> 0);
    return addHeapObject(ret);
};

export function __wbg_subarray_58ad4efbb5bcb886(arg0, arg1, arg2) {
    const ret = getObject(arg0).subarray(arg1 >>> 0, arg2 >>> 0);
    return addHeapObject(ret);
};

export function __wbindgen_debug_string(arg0, arg1) {
    const ret = debugString(getObject(arg1));
    const ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len0;
    getInt32Memory0()[arg0 / 4 + 0] = ptr0;
};

export function __wbindgen_throw(arg0, arg1) {
    throw new Error(getStringFromWasm0(arg0, arg1));
};

export function __wbindgen_memory() {
    const ret = wasm.memory;
    return addHeapObject(ret);
};

