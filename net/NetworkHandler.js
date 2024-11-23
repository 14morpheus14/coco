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

const apiHandler = async ({ apiMap, apiType, endpoint, payload, method = 'POST' }) => {
    try {
        const apiInstance = apiMap[apiType];
        if (!apiInstance) throw new Error(`API type "${apiType}" not found in API map.`);

        if (typeof apiInstance[endpoint] !== 'function') {
            throw new Error(`Endpoint "${endpoint}" not defined in "${apiType}".`);
        }

        // bruh, call the API function dynamically
        const apiResponse = await apiInstance[endpoint](...payload);
        return apiResponse;
    } catch (error) {
        console.error(`[API Handler] Error calling ${apiType}.${endpoint}:`, error);
        throw error; // Propagate the error to the caller
    }
};

module.exports = apiHandler;
