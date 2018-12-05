"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Table = require("table");
class ResourceStatistics {
    constructor(monitor) {
        this.monitor = monitor;
        this.peers = [];
    }
    print() {
        console.log('### resource stats ###');
        this.printTable(this.getDefaultStats());
    }
    createDataDump(label) {
        this.monitor.createDataDump(label);
    }
    printTable(value) {
        let t = Table.table(value, { border: Table.getBorderCharacters('ramac') });
        console.log(t);
    }
    /**
     * Get the default statistics table
     * @return {Array} statistics table
     */
    getDefaultStats() {
        try {
            this._readDefaultStats(true);
            if (this.peers === null || this.peers.length === 0) {
                console.log('Failed to read monitoring data');
                return;
            }
            let defaultTable = [];
            let tableHead = [];
            for (let i in this.peers[0].info) {
                tableHead.push(i);
            }
            let historyItems = this._getDefaultItems();
            tableHead.push.apply(tableHead, historyItems);
            defaultTable.push(tableHead);
            for (let i in this.peers) {
                let row = [];
                for (let j in this.peers[i].info) {
                    row.push(this.peers[i].info[j]);
                }
                let historyValues = this._getLastHistoryValues(historyItems, i);
                row.push.apply(row, historyValues);
                defaultTable.push(row);
            }
            return defaultTable;
        }
        catch (err) {
            console.log('Failed to read monitoring data, ' + (err.stack ? err.stack : err));
            return [];
        }
    }
    _getDefaultItems() {
        let items = [];
        for (let key in this.peers[0].history) {
            if (this.peers[0].history.hasOwnProperty(key)) {
                items.push(key);
            }
        }
        return items;
    }
    /**
     * Print the maximum values of all watched items
     */
    printMaxStats() {
        try {
            this._readDefaultStats(true);
            if (this.peers === null || this.peers.length === 0) {
                console.log('Failed to read monitoring data');
                return;
            }
            let defaultTable = [];
            let tableHead = [];
            for (let i in this.peers[0].info) {
                tableHead.push(i);
            }
            let historyItems = this._getMaxItems();
            tableHead.push.apply(tableHead, historyItems);
            defaultTable.push(tableHead);
            for (let i in this.peers) {
                let row = [];
                for (let j in this.peers[i].info) {
                    row.push(this.peers[i].info[j]);
                }
                let historyValues = this._getMaxHistoryValues(historyItems, i);
                row.push.apply(row, historyValues);
                defaultTable.push(row);
            }
            let t = Table.table(defaultTable, { border: Table.getBorderCharacters('ramac') });
            console.log('### resource stats (maximum) ###');
            console.log(t);
        }
        catch (err) {
            console.log('Failed to read monitoring data, ' + (err.stack ? err.stack : err));
        }
    }
    _getMaxItems() {
        return ['Memory(max)', 'CPU(max)', 'Traffic In', 'Traffic Out'];
    }
    _getMaxHistoryValues(items, idx) {
        let values = [];
        for (let i = 0; i < items.length; i++) {
            let key = items[i];
            if (!this.peers[idx].history.hasOwnProperty(key)) {
                console.log('could not find history object named ' + key);
                values.push('-');
                continue;
            }
            let length = this.peers[idx].history[key].length;
            if (length === 0) {
                console.log('could not find history data of ' + key);
                values.push('-');
                continue;
            }
            let stats = getStatistics(this.peers[idx].history[key]);
            if (key.indexOf('Memory') === 0 || key.indexOf('Traffic') === 0) {
                values.push(byteNormalize(stats.max));
            }
            else if (key.indexOf('CPU') === 0) {
                values.push(stats.max.toFixed(2) + '%');
            }
            else {
                values.push(stats.max.toString());
            }
        }
        return values;
    }
    /**
     * pseudo private functions
     */
    /**
     * read current statistics from monitor object and push the data into peers.history object
     * the history data will not be cleared until stop() is called, in other words, calling restart will not vanish the data
     * @param {Boolean} tmp =true, the data should only be stored in history temporarily
     */
    _readDefaultStats(tmp) {
        if (this.peers.length === 0) {
            {
                let newPeers = this.monitor.getPeers();
                newPeers.forEach((peer) => {
                    peer.history = {
                        'Memory(max)': [],
                        'Memory(avg)': [],
                        'CPU(max)': [],
                        'CPU(avg)': [],
                        'Traffic In': [],
                        'Traffic Out': []
                    };
                    peer.isLastTmp = false;
                    peer.monitor = this.monitor;
                    this.peers.push(peer);
                });
            }
        }
        this.peers.forEach((peer) => {
            let key = peer.key;
            let mem = peer.monitor.getMemHistory(key);
            let cpu = peer.monitor.getCpuHistory(key);
            let net = peer.monitor.getNetworkHistory(key);
            let mem_stat = getStatistics(mem);
            let cpu_stat = getStatistics(cpu);
            if (peer.isLastTmp) {
                let lastIdx = peer.history['Memory(max)'].length - 1;
                peer.history['Memory(max)'][lastIdx] = mem_stat.max;
                peer.history['Memory(avg)'][lastIdx] = mem_stat.avg;
                peer.history['CPU(max)'][lastIdx] = cpu_stat.max;
                peer.history['CPU(avg)'][lastIdx] = cpu_stat.avg;
                peer.history['Traffic In'][lastIdx] = net.in[net.in.length - 1] - net.in[0];
                peer.history['Traffic Out'][lastIdx] = net.out[net.out.length - 1] - net.out[0];
            }
            else {
                peer.history['Memory(max)'].push(mem_stat.max);
                peer.history['Memory(avg)'].push(mem_stat.avg);
                peer.history['CPU(max)'].push(cpu_stat.max);
                peer.history['CPU(avg)'].push(cpu_stat.avg);
                peer.history['Traffic In'].push(net.in[net.in.length - 1] - net.in[0]);
                peer.history['Traffic Out'].push(net.out[net.out.length - 1] - net.out[0]);
            }
            peer.isLastTmp = tmp;
        });
    }
    _getLastHistoryValues(items, idx) {
        let values = [];
        for (let i = 0; i < items.length; i++) {
            let key = items[i];
            if (!this.peers[idx].history.hasOwnProperty(key)) {
                console.log('could not find history object named ' + key);
                values.push('-');
                continue;
            }
            let length = this.peers[idx].history[key].length;
            if (length === 0) {
                console.log('could not find history data of ' + key);
                values.push('-');
                continue;
            }
            let value = this.peers[idx].history[key][length - 1];
            if (key.indexOf('Memory') === 0 || key.indexOf('Traffic') === 0) {
                values.push(byteNormalize(value));
            }
            else if (key.indexOf('CPU') === 0) {
                values.push(value.toFixed(2) + '%');
            }
            else {
                values.push(value.toString());
            }
        }
        return values;
    }
}
exports.default = ResourceStatistics;
function getStatistics(arr) {
    if (arr.length === 0) {
        return { max: NaN, min: NaN, total: NaN, avg: NaN };
    }
    let max = arr[0], min = arr[0], total = arr[0];
    for (let i = 1; i < arr.length; i++) {
        let value = arr[i];
        if (value > max) {
            max = value;
        }
        if (value < min) {
            min = value;
        }
        total += value;
    }
    return { max: max, min: min, total: total, avg: total / arr.length };
}
function byteNormalize(data) {
    if (isNaN(data)) {
        return '-';
    }
    let kb = 1024;
    let mb = kb * 1024;
    let gb = mb * 1024;
    if (data < kb) {
        return data.toString() + 'B';
    }
    else if (data < mb) {
        return (data / kb).toFixed(1) + 'KB';
    }
    else if (data < gb) {
        return (data / mb).toFixed(1) + 'MB';
    }
    else {
        return (data / gb).toFixed(1) + 'GB';
    }
}
//# sourceMappingURL=resourcestatistics.js.map