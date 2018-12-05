/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

import * as Path from "path";
import * as Fs from "fs-extra";

/**
 * Internal Utility class for Caliper
 */
export default class Util {

    /**
     * Perform a sleep
     * @param {*} ms the time to sleep, in ms
     * @returns {Promise} a completed promise
     */
    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Simple log method to output to the console
     * @param {any} msg messages to log
     */
    static log(...msg) {
        // eslint-disable-next-line no-console
        console.log(...msg);
    }

    static createDataDump(label, data){
        try {
            console.log("Creating datadump");
            const filename = `${label.toLowerCase().replace(/[^0-9a-z-]/gi, '')}-${new Date(Date.now()).toISOString()}.json`;
            const path = Path.join(Path.sep, 'test-runner', 'data', 'dumps', filename);
            Fs.outputJsonSync(path, data);
            console.log("Created datadump:", filename);
        }
        catch(e){
            console.error("Unable to create datadump:",label,". Reason:", e)
        }
    }
}