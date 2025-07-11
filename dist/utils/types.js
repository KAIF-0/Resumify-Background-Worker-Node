"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PortStatus = void 0;
var PortStatus;
(function (PortStatus) {
    PortStatus[PortStatus["READY"] = 0] = "READY";
    PortStatus[PortStatus["PROCESSING"] = 1] = "PROCESSING";
    PortStatus[PortStatus["ERROR"] = 2] = "ERROR";
})(PortStatus || (exports.PortStatus = PortStatus = {}));
