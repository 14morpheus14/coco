# COCO: Coconuts & Oblivious Computations for Orthogonal Authentication

**COCO is more than an authentication system — it’s my manifesto for radical privacy!**  

### Author  
- **Yamya Reiki**  

### Contributors  
- **Yamya Reiki** *(under the aliases: 14morpheus14 and statecraftlabs)*  

COCO is a system reimagining authentication with a steadfast commitment to Unconditional Privacy. At its core, COCO comprises three primary roles: the **Client/Authenticatee**, the **Authenticator**, and the **Verifier**. This design achieves a crucial goal: preserving user privacy by decoupling the Authentication System from the Resourcing System.

An **Authentication Server** serves as an inherent link between the real and virtual worlds. COCO redefines this bridge, making it **one-way and irreversible**, ensuring user identity flows securely into the digital realm without leaving exploitable trails behind.

---

## Philosophy Behind COCO

True privacy-preserving authentication focuses on one thing: **validating access rights correctly**. COCO challenges the conventional paradigm that requires knowledge of *who* holds these rights to *what*. Such knowledge is antithetical to privacy.

The design of COCO embodies the belief that an authenticator does **not need to know**—let alone store—usernames, passwords, passkeys, emails, or any other Personally Identifiable Information (PII) to authenticate someone. By eliminating the need for this information, COCO achieves privacy by design, rendering the question of *who* and *what* irrelevant.

---

## Why COCO?

COCO’s separation of roles and its reliance on cryptographic principles ensure that the system operates with maximal privacy and minimal attack surfaces. It empowers users with control over their data, establishes trust through transparency, and redefines authentication as a tool for validation rather than identification.


---

## Dedication  

This work is lovingly dedicated to **Divya Jyoti Das** (*alias: Coco*), a *Forensic Scientist*, whose unwavering support, and encouragement have been instrumental in the creation of this project. 

The name **COCO** is not merely an acronym for *Collaborative Oblivious Computation for Orthogonal Authentication*; it is a heartfelt tribute to her—a reflection of her spirit, brilliance, and the immense motivation she has provided.  

Through this authentication library, named **COCO**, I aim to celebrate her influence both personally and professionally. This work stands as a testament to the profound impact she has had on my life and endeavors, making this library a symbol of gratitude, admiration, and dedication to her enduring legacy.

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

### Run the User Manual and Test

COCO comes with a user manual and runtime test script to help you understand and validate its functionality. To execute:

1. Run the following command:
   ```bash
   npm run yap
   ```

2. This will execute the `yaps.js` script, which contains detailed info about COCO's usage, features and runtime tests.

### COCO Performance Evaluation:

A performance evaluation code has been provided **[performance.js](performance.js)** that runs instances of authenticators, verifier and client on a single system resource to test and create a performance graph. Note that it requires **[chartjs-node-canvas](https://www.npmjs.com/package/chartjs-node-canvas)** to create the performance graph. 

### Try COCO in Your Project

You can integrate COCO into your own projects by importing the library into your Node.js code. Please refer to the **[pre-print](COCO-preprint.pdf)** for technical details (it keeps on updating).

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

---
