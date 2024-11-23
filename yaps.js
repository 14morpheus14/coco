#!/usr/bin/env node

const DatabaseHandler = require('./db/DatabaseHandler');
const authenticator = require('./coco/authenticator');
const client = require('./coco/client');
const verifier = require('./coco/verifier');

async function waitForEnter() {
    return new Promise((resolve) => {
        process.stdin.resume(); 
        process.stdin.setEncoding('utf8'); 
        process.stdin.once('data', (data) => {
            if (data.trim() === '') { 
                process.stdin.pause(); 
                resolve();
            }
        });
    });
}

async function yap() {
    const logYap = (message) => console.log(`${message}`);

    logYap("🗣️  Yaps for ya!\n");
    logYap("Instruction: Once you complete reading the current yap, press Enter to continue with next piece of yap!");
    logYap("Press Enter!!")
    await waitForEnter();
    logYap("You need a Client 💻 \nA separate Verifier 🔍 \nA few non-colluding Authenticators 🛡️🛡️🛡️ \nAnd a Global DB 🌍 \n...All of 'em running 🏃 💨  with their resources🔧 .\n");
    logYap("\nStep 0: Calling Requirements 🔧 ");
    logYap(`
        const client = require('./coco/client');
        const verifier = require('./coco/verifier');
        const authenticator = require('./coco/authenticator');
        const DatabaseHandler = require('./db/DatabaseHandler');
    `);    
    await waitForEnter();
    logYap("Step 1: Storage Initialization 🗂️ ");
    logYap("        Imma initialize an in-mem storage for local 🏡 as well as global 🌍 databases.");
    logYap(`        
        Make sure to replace it with actual DB like:
        1. MongoDB (🍃)
        2. PostgreSQL (🐘)
        ...or what's that from AWS?
        3. DynamoDB (⚡)!`);
    logYap(`        
        Init the Storage Vars:

        const localVerifierStorage = {};       - this is local to Verifier 🔍
        const localAuthenticator1Storage = {}; - this is local to Authenticator 🛡️ (man it pains to write such a long name frfr!)
        const localAuthenticator2Storage = {}; - not writing it again! 🛡️
        const localAuthenticator3Storage = {}; - yet not writing it again! 🛡️
        const localClientStorage = {};         - that's client's 💻 , so prolly you'll use more like Google Keystore or Apple Keychain, I'm hoping? 
        const globalStorage = {};              - this is a Global DB 🌍🗂️  run by some 3rd Party - and really, they need NOT be trustworthy 🤷‍♀️ .
    `);
    await waitForEnter();
    logYap("        🚀 Init all the three DBs separately. Remember: replace in-mem DBs or you'll run outta mem!");
    logYap(`        
        (You know what? I required ./db/DatabaseHandler class to do this.)
        The DatabaseHandler class really works with the following:
        1. MongoDB (🍃)
        2. PostgreSQL (🐘)
        3. DynamoDB (⚡)!`);
    logYap(`    
        So you may not need to edit ./util/db/Databasehandler class if you are using any of these...
        However, I haven't tested the DatabaseHandler class for database types other than in-memory.`); 
    logYap("        You may test and edit accordingly.");
    logYap(`
        For in-mem, init with DatabaseHandler class goes like this:

        const localVerifierDB = new DatabaseHandler('inMemory', localVerifierStorage);
        const localAuthenticator1DB = new DatabaseHandler('inMemory', localAuthenticator1Storage);
        const localAuthenticator2DB = new DatabaseHandler('inMemory', localAuthenticator2Storage);
        const localAuthenticator3DB = new DatabaseHandler('inMemory', localAuthenticator3Storage);
        const localClientDB = new DatabaseHandler('inMemory', localClientStorage);
        const globalDB = new DatabaseHandler('inMemory', globalStorage);
    `);

    logYap(`        
        **SIDE NOTE: If you are running Global DB, 
        🧹✨ Clean up the DB entries in your implementation after a certain time from their creation to maintain sanity!`);
    logYap("        (This time could be anything > AUTHENTICATOR_TOKEN_VALIDITY)");
    await waitForEnter();
    logYap("\n\nNow wut? 🤷‍♀️ ");
    logYap("Bruh, frfr!😒😒");
    logYap("Let's just init 🔧 the Verifier and Authenticators...");
    await waitForEnter();
    logYap(`\n\nStep 2: Verifier 🔍 and Authenticator Initialization 🛡️🛡️🛡️

        const verifierAPI = verifier(localVerifierDB, globalDB);
        let auth1API = authenticator(localAuthenticator1DB, globalDB);
        const auth2API = authenticator(localAuthenticator2DB, globalDB);
        const auth3API = authenticator(localAuthenticator3DB, globalDB);
    `);

    logYap("        NOTE: if Authenticator engine goes brrrrr...🕺,\n        then we need to restart with SAME OPRF private key as before!");
    logYap(`        🚔 🏛️ 🚔 If you don't do it, ALL credentials will become useless and you will be sued for your mischief. 🚔 🏛️ 🚔
        So! 😤 It's best practice to retrieve and separately store the key.`);
    logYap(`
        We do it this way:

        const OPRFprivateKey = await auth1API.getOPRFPrivateKey(); - Retrieve the key and store it...
        auth1API = authenticator(localAuthenticator1DB, globalDB, OPRFprivateKey); - Use it next time you start the engine!
    `);
    
    logYap(`        If you are 🏃💨 running just a Verifier or an Authenticator,
        - simply init the Verifier 🔍 or Authenticator 🛡️ as above,
        - directly call the respective handler functions exposed by ./coco/verifier.js and ./coco/authenticator.js.

        Makes it easier to integrate into your server code, nah? 🙈`);

    await waitForEnter();
    logYap(`
        Handler functions exposed by ./coco/authenticator.js:

            - handleBlindSignatureRequest(blindSignRequest, publicKey, publicAttributes)
    
            - handleOPRFEvaluation(verificationKeys, proof, publicAttributes, evalRequest)
            
            - handleRegisterRequest(
                id, 
                currentVerificationKey, 
                proof, 
                publicAttributes, 
                blindSignRequest, 
                publicKey, 
                publicAttributesToken, 
                registrationTokenProof,
                registrationTokenPublicAttribute, 
                registrationTokenVerificationKey
            )
            
            - handleLoginRequest(id, proof, publicAttributes, blindSignRequest, publicKey, publicAttributesToken)
            
            - handleChangeAuthenticationDataRequest(
                oldId, 
                oldProof, 
                oldPublicAttributes, 
                newId, 
                newVerificationKey, 
                proof, 
                publicAttributes, 
                blindSignRequest, 
                publicKey, 
                publicAttributesToken
            )
            
            - handleNFACredentialCreationRequest(
                id, 
                proof, 
                publicAttributes, 
                recoveryID, 
                recoveryVerificationKey, 
                recoveryProof, 
                recoveryPublicAttributes, 
                blindSignRequest, 
                publicKey, 
                publicAttributesToken
            )
            
            - handleDeleteCredentialRequest(id, proof, publicAttributes, blindSignRequest, publicKey, publicAttributesToken)


        Handler functions exposed by ./coco/verifier.js:

            - handleRegistrationRequest(username, blindSignRequest, publicKey, publicAttributes)
            
            - completeRegistration(username, userId, salts, VerificationKeys, AccessTokenProof, PublicAttributes)
            
            - handleLoginRequest(username)
            
            - completeLogin(username, VerificationKeys, AccessTokenProof, PublicAttributes)
            
            - handleUpdateSaltsRequest(username, new_salts, VerificationKeys, AccessTokenProof, PublicAttributes)
            
            - handleUsernameUpdateRequest(username, new_username, VerificationKeys, AccessTokenProof, PublicAttributes)
            
            - handleDeleteUserRequest(username, VerificationKeys, AccessTokenProof, PublicAttributes)
            
            - credentialLogin(username, VerificationKeys, AccessTokenProof, PublicAttributes)
   `);

    await waitForEnter();
    logYap("\nStep 3: Prepare Client 👥 Intitialization 👥👥")

    logYap(`        
        Now comes the most important part - how to init 🎮 the client?
        So, if you are running a client 👥, then the client needs a local database 🗄️ (we already have that).
        Then it needs a way to communicate 🌐 with the Verifier 🔍✅ and all the Authenticators 🔑🛡️.
    `);
    logYap(`    
        For this, Imma gonna create a map of Verifier 🔍✅ and Authenticator 🔑🛡️  APIs rn!
        You can export the API-s with whatever name you like 🤷‍♀️ but don't forget to mention it in the 'apiMap'.   
        Also, just edit and attach fetch/axios or whatever you want man...upto you!
        I didn't implement 'em API-s, 'cause ya know - felt cute 🙈 🙈 !
    `);
    logYap(`

        Here's the API Map:
        
            const apiMap = {
            verifierAPI,
            auth1API,
            auth2API,
            auth3API,
            //auth4API, - man, add as many authenticator APIs as needed... 
                        - see, add other APIs here 'dynamically'
                        - the benefit of coco is you can have many many authenticators...that comes at a cost 💃💃! 
                        - if you register 📝 with 3 Authenticators 🔑🛡️, 
                        - then you'll stick to authenticating with those same 3 Authenticators until death do you part 👰🤵💍!
                        - this is why COCO is an Unconditional Privacy protocol.
                        - and this is why Coconut Scheme used by COCO is also specifically initialized with Uncoditional Privacy.
            };
    `);
    await waitForEnter();
    logYap(`        You know this map is used by client internally by requiring NetworkHandler.js 
        But, do NOT go and edit ./util/net/NetworkHandler unless you know what you are doing, please! 
    `);
    await waitForEnter();
    logYap("        Below we create apiType 📑 arrays, which is like a key (string) used to look up the specific API instance in the apiMap 📖.");
    logYap("        It tells the client which API to use for a given operation.")
    logYap(`
        const authAPIs = ['auth1API', 'auth2API', 'auth3API'];
        const verifierAPIs = ['verifierAPI']; - currently one client supports one verifier but you can tweak around a bit if you want
    `);
    await waitForEnter();
    logYap(`        Note that when creating the endpoints for these API-s (the functions that'll actually contain the fetch/axios logic), 
        you must name them exactly as below, with exactly the same number of inputs to send online:
    
        Endpoint names for Authenticator APIs of Client:

            - handleBlindSignatureRequest(blindSignRequest, publicKey, publicAttributes)
            
            - handleOPRFEvaluation(verificationKeys, proof, publicAttributes, evalRequest)
            
            - handleRegisterRequest(
                id, 
                currentVerificationKey, 
                proof, 
                publicAttributes, 
                blindSignRequest, 
                publicKey, 
                publicAttributesToken, 
                registrationTokenProof,
                registrationTokenPublicAttribute, 
                registrationTokenVerificationKey
            )
            
            - handleLoginRequest(id, proof, publicAttributes, blindSignRequest, publicKey, publicAttributesToken)
            
            - handleChangeAuthenticationDataRequest(
                oldId, 
                oldProof, 
                oldPublicAttributes, 
                newId, 
                newVerificationKey, 
                proof, 
                publicAttributes, 
                blindSignRequest, 
                publicKey, 
                publicAttributesToken
            )
            
            - handleNFACredentialCreationRequest(
                id, 
                proof, 
                publicAttributes, 
                recoveryID, 
                recoveryVerificationKey, 
                recoveryProof, 
                recoveryPublicAttributes, 
                blindSignRequest, 
                publicKey, 
                publicAttributesToken
            )
            
            - handleDeleteCredentialRequest(id, proof, publicAttributes, blindSignRequest, publicKey, publicAttributesToken)

        Endpoint names for Verifier API of Client:

            - handleRegistrationRequest(username, blindSignRequest, publicKey, publicAttributes)
            
            - completeRegistration(username, userId, salts, VerificationKeys, AccessTokenProof, PublicAttributes)
            
            - handleLoginRequest(username)
            
            - completeLogin(username, VerificationKeys, AccessTokenProof, PublicAttributes)
            
            - handleUpdateSaltsRequest(username, new_salts, VerificationKeys, AccessTokenProof, PublicAttributes)
            
            - handleUsernameUpdateRequest(username, new_username, VerificationKeys, AccessTokenProof, PublicAttributes)
            
            - handleDeleteUserRequest(username, VerificationKeys, AccessTokenProof, PublicAttributes)
            
            - credentialLogin(username, VerificationKeys, AccessTokenProof, PublicAttributes)
    
        This strict condition to maintain the endpoint names is because ./coco/client.js is hardcoded to work with these very endpoint labels.
        You can surely change ./coco/client.js if you can't absolutely stand these names, but I thought I have named them cute enough to not make you abhor 'em!
    `);
    await waitForEnter();
    logYap(`\n\nSo wut do we have till now? 😏
    - The Global DB 🌍 is running,
    - The Verifier 🔍✅ is up and running with it's Local DB instance and Network API (verifierAPI),
    - The 3 Authenticators 🔑🛡️ are up 'n running with xer Local DB instances and Network API-s (auth1API, auth2API, auth3API),
    - We got the Client's 👥 Local DB and Network API-s (verifierAPI and authAPIs) in place, up and running...
    `);
    await waitForEnter();
    logYap("Now, we are ready to initialize the client...");
    await waitForEnter();
    logYap("\n\nStep 4: Client 👥 Initialization 🚀")
    logYap(`
        const clientAPI = client(localClientDB, apiMap, verifierAPIs, authAPIs); - What's a client gonna do with globalDB? 
        Sheesh! Just init it already!
    `);
    await waitForEnter();
    logYap("        We got our clientAPI up and running. 💃🕺💃🕺!");
    logYap("        Time to perform some serious registration 🔓, login 🔑, and other operations.");
    logYap(`        NOTE: COCO assumes a mandatory NFA 🕵️‍♀️🕵️‍♂️ for smooth functioning (Also it is helpful in case you forgot your original password). 
        Current implementation supports 2FA only...
    `);
    await waitForEnter();
    logYap(`

        Handlers exposed by ./coco/client.js -
            - register(username, secret, someID)    
                                                                        ['someID' can really be any kinda ID you wanna use for Coconut 🥥 Blind Signature ✍️  ] 
    
            - login(username, secret, someID)   
                                                                        ['secret' can be your password or some sorta passkey] 
            
            - credentialLogin(username)                                 
                                                                        [This you can use for secure 'n randomized token based login] 
            
            - updateUsername(username, secret, new username, someID) 
                                                                        [This sets up a new username for a user in the eyes of the Verifier]
            
            - updatePassword(username, secret, new secret, someID) 
                                                                        [This sets up a new password and discards the previous one]
            
            - setNextFactor(username, secret, next factor secret, someID) 
                                                                        [You can use it to set up an NFA or a recovery password too]
            
            - delete(username, secret, next factor secret, someID) 
                                                                        [Simply delete the user footprint from everywhere]
    `);

    await waitForEnter();

    logYap("Oh! AND DON'T FORGET TO CHECK ./config FOR FINE TUNING COCO...");
    logYap(`                                        
                                                                ...THE END...`);
    await waitForEnter();
    logYap(`
Running Test...
`);
    // Test data 📋
    const localVerifierStorage = {}; 
    const localAuthenticator1Storage = {};  
    const localAuthenticator2Storage = {}; 
    const localAuthenticator3Storage = {}; 
    const localClientStorage = {}; 
    const globalStorage = {}; 

    const localVerifierDB = new DatabaseHandler('inMemory', localVerifierStorage);
    const localAuthenticator1DB = new DatabaseHandler('inMemory', localAuthenticator1Storage);
    const localAuthenticator2DB = new DatabaseHandler('inMemory', localAuthenticator2Storage);
    const localAuthenticator3DB = new DatabaseHandler('inMemory', localAuthenticator3Storage);
    const localClientDB = new DatabaseHandler('inMemory', localClientStorage);
    const globalDB = new DatabaseHandler('inMemory', globalStorage);

    const verifierAPI = verifier(localVerifierDB, globalDB);
    let auth1API = authenticator(localAuthenticator1DB, globalDB);
    const auth2API = authenticator(localAuthenticator2DB, globalDB);
    const auth3API = authenticator(localAuthenticator3DB, globalDB);
    
    const OPRFprivateKey = await auth1API.getOPRFPrivateKey();
    auth1API = authenticator(localAuthenticator1DB, globalDB, OPRFprivateKey);
    
    const apiMap = {
        verifierAPI,
        auth1API,
        auth2API,
        auth3API,
    };
    
    const authAPIs = ['auth1API', 'auth2API', 'auth3API'];
    const verifierAPIs = ['verifierAPI'];
    const clientAPI = client(localClientDB, apiMap, verifierAPIs, authAPIs);

    const usernames = ['coco', 'wine', 'violet', 'jesus', 'skibidi_toilet'];
    const passwords = ['sus2020', 'emo15', 'famboii22', 'christ4ever', 'emo15'];
    const someIDs = ['macbookpro', 'asus', 'android', 'blackberry', 'hp'];
    const new_usernames = ['bogota', 'buriburi', 'hello_kitty', 'crumbled_bread', 'sir_lenon'];
    const new_passwords = ['heelo', 'hejjjjlo', 'heluulo', 'helll', 'helll'];

    // Perform operations ✅
    const performOperation = async (label, operation) => {
        try {
            const response = await operation();
            if (response) {
                console.log(`✅ ${label}:`, response);
            } else {
                console.log(`❌ ${label} failed.`);
            }
        } catch (err) {
            console.log(`❌ ${label} encountered an error:`, err);
        }
    };

    await performOperation('Registering user', () => clientAPI.register(usernames[0], passwords[0], someIDs[0]));
    await performOperation('Logging in user', () => clientAPI.login(usernames[0], passwords[0], someIDs[0]));
    await performOperation('Credential login', () => clientAPI.credentialLogin(usernames[0]));
    await performOperation('Updating username', () => clientAPI.updateUsername(usernames[0], passwords[0], new_usernames[0], someIDs[0]));
    await performOperation('Updating password', () => clientAPI.updatePassword(new_usernames[0], passwords[0], new_passwords[0], someIDs[0]));
    await performOperation('Next factor registration', () => clientAPI.setNextFactor(new_usernames[0], new_passwords[0], new_passwords[1], someIDs[0]));
    await performOperation('Deleting user', () => clientAPI.delete(new_usernames[0], new_passwords[0], new_passwords[1], someIDs[0]));

    // Log storage state 🗄️(Everything except Global DB should be empty!)
    const logStorageState = (label, storage) => {
        console.log(`\n--- ${label} Storage State ---`);
        console.log(JSON.stringify(storage, null, 2));
    };
    logStorageState('Verifier Local', localVerifierStorage);
    logStorageState('Authenticator 1 Local', localAuthenticator1Storage);
    logStorageState('Authenticator 2 Local', localAuthenticator2Storage);
    logStorageState('Authenticator 3 Local', localAuthenticator3Storage);
    logStorageState('Global', globalStorage);
    logStorageState('Client Local', localClientStorage);
}

(async () => {
    await yap();
})();

// **Example usage (setup dependent on the database type):
    // PostgreSQL Integration-
    // const { Client } = require('pg');
    // const client = new Client({ connectionString: "postgresql://user:password@host:port/db" });
    // client.connect();
    // const handler = new DatabaseHandler('postgresql', client);
    // handler.save('users', { id: 1, name: 'John' }, (err, result) => console.log(result));

    // DynamoDB Integration
    // const AWS = require('aws-sdk');
    // const dynamoDB = new AWS.DynamoDB.DocumentClient();
    // const handler = new DatabaseHandler('dynamoDB', dynamoDB);
    // handler.save('users', { id: '123', name: 'John' }, (err, result) => console.log(result));

    // MongoDB Integration
    // const MongoClient = require('mongodb').MongoClient;
    // const client = new MongoClient("mongodb_connection_string");
    // client.connect((err) => {
    //   const handler = new DatabaseHandler('mongodb', client.db('myDatabase'));
    //   handler.save('myCollection', { name: 'John' }, (err, result) => console.log(result));
    // });

    // SQL Integration
    // const mysql = require('mysql');
    // const connection = mysql.createConnection({ host, user, password, database });
    // connection.connect();
    // const handler = new DatabaseHandler('sql', connection);
    // handler.save('myTable', { id: 1, name: 'John' }, (err, result) => console.log(result));

    // In-Memory Integration
    // const memoryDb = {};
    // const handler = new DatabaseHandler('inMemory', memoryDb);
    // handler.save('myCollection', { id: 1, name: 'John' }, (err, result) => console.log(result));
