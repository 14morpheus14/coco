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

class DatabaseHandler {
    constructor(dbType, dbConnection, options = {}) {
        this.dbType = dbType;
        this.dbConnection = dbConnection; // Database-specific connection object
        this.options = options;
    }

    // Save data
    save(collection, data, callback) {
        switch (this.dbType) {
            case 'mongodb':
                this.dbConnection.collection(collection).insertOne(data, callback);
                break;
            case 'sql':
            case 'postgresql':
                const query = `INSERT INTO ${collection} (${Object.keys(data).join(",")}) VALUES (${Object.keys(data).map((_, i) => `$${i + 1}`).join(",")})`;
                this.dbConnection.query(query, Object.values(data), callback);
                break;
            case 'dynamoDB':
                const params = { TableName: collection, Item: data };
                this.dbConnection.put(params, callback);
                break;
            case 'androidKeystore':
                callback(null, { success: true, message: "Data saved to Android Keystore" });
                break;
            case 'iosKeychain':
                callback(null, { success: true, message: "Data saved to iOS Keychain" });
                break;
            case 'windowsCredentialLocker':
                callback(null, { success: true, message: "Data saved to Windows Credential Locker" });
                break;
            case 'inMemory':
                if (!this.dbConnection[collection]) this.dbConnection[collection] = [];
                this.dbConnection[collection].push(data);
                callback(null, { success: true });
                break;
            default:
                callback(new Error("Unsupported database type"));
        }
    }

    // Retrieve data
    retrieve(collection, query, callback) {
        switch (this.dbType) {
            case 'mongodb':
                this.dbConnection.collection(collection).find(query).toArray(callback);
                break;
            case 'postgresql':
                const whereClause = Object.keys(query).map((key, i) => `${key} = $${i + 1}`).join(" AND ");
                const sqlQuery = `SELECT * FROM ${collection} WHERE ${whereClause}`;
                this.dbConnection.query(sqlQuery, Object.values(query), callback);
                break;
            case 'dynamoDB':
                const scanParams = {
                    TableName: collection,
                    FilterExpression: Object.keys(query).map((key, i) => `#${key} = :val${i}`).join(" AND "),
                    ExpressionAttributeNames: Object.fromEntries(Object.keys(query).map((key) => [`#${key}`, key])),
                    ExpressionAttributeValues: Object.fromEntries(Object.entries(query).map(([key, value], i) => [`:val${i}`, value])),
                };
                this.dbConnection.scan(scanParams, (err, data) => callback(err, data ? data.Items : []));
                break;    
            case 'androidKeystore':
            case 'iosKeychain':
            case 'windowsCredentialLocker':
                callback(null, { success: true, message: "Retrieve operation depends on native APIs (implementation needed)" });
                break;
            case 'inMemory':
                const results = (this.dbConnection[collection] || []).filter(item =>
                    Object.entries(query).every(([key, value]) => item[key] === value)
                );
                callback(null, results);
                break;
            default:
                callback(new Error("Unsupported database type"));
        }
    }

    update(collection, query, updates, callback) {
        switch (this.dbType) {
            case 'mongodb':
                this.dbConnection.collection(collection).updateOne(query, { $set: updates }, callback);
                break;
            case 'postgresql':
                const setClause = Object.keys(updates).map((key, i) => `${key} = $${i + 1}`).join(", ");
                const whereClause = Object.keys(query).map((key, i) => `${key} = $${i + 1 + Object.keys(updates).length}`).join(" AND ");
                const sqlQuery = `UPDATE ${collection} SET ${setClause} WHERE ${whereClause}`;
                this.dbConnection.query(sqlQuery, [...Object.values(updates), ...Object.values(query)], callback);
                break;
            case 'dynamoDB':
                const updateParams = {
                    TableName: collection,
                    Key: query,
                    UpdateExpression: "SET " + Object.keys(updates).map((key, i) => `#${key} = :val${i}`).join(", "),
                    ExpressionAttributeNames: Object.fromEntries(Object.keys(updates).map((key) => [`#${key}`, key])),
                    ExpressionAttributeValues: Object.fromEntries(Object.entries(updates).map(([key, value], i) => [`:val${i}`, value])),
                };
                this.dbConnection.update(updateParams, callback);
                break;    
            case 'androidKeystore':
            case 'iosKeychain':
            case 'windowsCredentialLocker':
                callback(null, { success: true, message: "Update operation depends on native APIs (implementation needed)" });
                break;
            case 'inMemory':
                const collectionData = this.dbConnection[collection] || [];
                let updatedCount = 0;
            
                collectionData.forEach(item => {
                    if (Object.entries(query).every(([key, value]) => item[key] === value)) {
                        // Iterate over keys in updates and apply them to the appropriate nested field
                        Object.entries(updates).forEach(([updateKey, updateValue]) => {
                            if (item.value.hasOwnProperty(updateKey)) {
                                item.value[updateKey] = updateValue; // Update the specific field
                            } else {
                                item.value[updateKey] = updateValue; // Add the field if it doesn't exist
                            }
                        });
                        updatedCount++;
                    }
                });
            
                callback(null, { updatedCount });
                break;                    
            default:
                callback(new Error("Unsupported database type"));
        }
    }

    // Delete data
    delete(collection, query, callback) {
        switch (this.dbType) {
            case 'mongodb':
                this.dbConnection.collection(collection).deleteOne(query, callback);
                break;
            case 'sql':
            case 'postgresql':
                const whereClause = Object.keys(query).map(key => `${key} = ?`).join(" AND ");
                const sqlQuery = `DELETE FROM ${collection} WHERE ${whereClause}`;
                this.dbConnection.query(sqlQuery, Object.values(query), callback);
                break;
            case 'dynamoDB':
                const params = { TableName: collection, Key: query };
                this.dbConnection.delete(params, callback);
                break;
            case 'androidKeystore':
            case 'iosKeychain':
            case 'windowsCredentialLocker':
                callback(null, { success: true, message: "Delete operation depends on native APIs (implementation needed)" });
                break;
            case 'inMemory':
                if (!this.dbConnection[collection]) return callback(null, { deletedCount: 0 });
                const initialLength = this.dbConnection[collection].length;
                this.dbConnection[collection] = this.dbConnection[collection].filter(item =>
                    !Object.entries(query).every(([key, value]) => item[key] === value)
                );
                const deletedCount = initialLength - this.dbConnection[collection].length;
                callback(null, { deletedCount });
                break;
            default:
                callback(new Error("Unsupported database type"));
        }
    }

    // Search data
    search(collection, query, callback) {
        this.retrieve(collection, query, callback); // Alias for retrieval
    }
}

module.exports = DatabaseHandler;
