# COCO: Collaborative Oblivious Computation for Orthogonal Authentication

**COCO is more than an authentication system — it’s my manifesto for radical privacy!**  

COCO is a system reimagining authentication with a steadfast commitment to Unconditional Privacy. At its core, COCO comprises three primary roles: the **Authenticatee**, the **Authenticator**, and the **Verifier**. What COCO deliberately avoids being are an **Authorizer** (Access Controller) or a **Resource Server**. This separation is intentional—COCO's mission is solely to authenticate users, generate access tokens, and verify those tokens, leaving the management of resource access rights entirely out of its purview. This design achieves a crucial goal: preserving user privacy by decoupling the Authentication System from the Resourcing System.

An **Authentication Server** serves as an inherent link between the real and virtual worlds. COCO redefines this bridge, making it **one-way and irreversible**, ensuring user identity flows securely into the digital realm without leaving exploitable trails behind.

---

## Philosophy Behind COCO

True privacy-preserving authentication focuses on one thing: **validating access rights correctly**. COCO challenges the conventional paradigm that requires knowledge of *who* holds these rights. Such knowledge is antithetical to privacy.

The design of COCO embodies the belief that an authenticator does **not need to know**—let alone store—usernames, passwords, passkeys, emails, or any other Personally Identifiable Information (PII) to authenticate someone. By eliminating the need for this information, COCO achieves privacy by design, rendering the question of *who* irrelevant.

---

## Why COCO?

COCO’s separation of roles and its reliance on cryptographic principles ensure that the system operates with maximum privacy and minimal attack surfaces. It empowers users with control over their data, establishes trust through transparency, and redefines authentication as a tool for validation rather than identification.

---

## Dedication

This work is lovingly dedicated to **Divya Jyoti Das** (*alias: Coco*), *Forensic Scientist*, whose constant support and encouragement were instrumental in its creation. The name **COCO** not only represents *Collaborative Oblivious Computation for Orthogonal Authentication* but also serves as a heartfelt tribute to her. This collection of circuits is part of an ongoing authentication library named **COCO**, a personal and professional dedication.

---

## Installation

To get started with COCO:

1. Clone the repository:
   ```bash
   git clone https://github.com/14morpheus14/coco.git
   cd coco
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

---

## Usage

### Run the Developer Manual and Test

COCO comes with a developer manual and runtime test script to help you understand and validate its functionality. To execute:

1. Run the following command:
   ```bash
   npm run yap
   ```
   Alternatively:
   ```bash
   yap
   ```

2. This will execute the `yaps.js` script, which contains detailed info about COCO's usage, features and runtime tests.

### Try COCO in Your Project

You can integrate COCO into your own projects by importing the library into your Node.js code. Please refer to the Whitepaper (updating soon).

---

## License

COCO is licensed under the **GPL v3**. See [LICENSE](LICENSE) for details.

### Third-Party Dependencies

- **[@nymproject/coconut-wasm-wrapper](https://github.com/nymtech/coconut)**: This library includes components from the Coconut project, which is licensed under the **Apache License 2.0**. Use of those components is subject to the terms of the Apache License 2.0. See [Apache 2.0 License](https://www.apache.org/licenses/LICENSE-2.0) for details.
- **[@cloudflare/voprf-ts](https://www.npmjs.com/package/@cloudflare/voprf-ts)**: This library is licensed under the **BSD 3-Clause License**. See [BSD 3-Clause License](https://opensource.org/licenses/BSD-3-Clause) for details.
- **[argon2](https://www.npmjs.com/package/argon2)**: This library is licensed under the **MIT License**. See [MIT License](https://opensource.org/licenses/MIT) for details.
- **[uuid](https://www.npmjs.com/package/uuid)**: This library is licensed under the **MIT License**. See [MIT License](https://opensource.org/licenses/MIT) for details.
- **[@wasm-tool/wasm-pack-plugin](https://github.com/wasm-tool/wasm-pack-plugin)**: Licensed under the **MIT License**. See [MIT License](https://opensource.org/licenses/MIT) for details.

Please refer to the [NOTICE](NOTICE) file for full attribution and license details.
```
