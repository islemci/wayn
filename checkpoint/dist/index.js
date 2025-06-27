"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = exports.useCheckpoint = exports.CheckpointProvider = exports.withCheckpoint = exports.createCheckpoint = exports.WaynCheckpoint = void 0;
// Main exports
var checkpoint_1 = require("./checkpoint");
Object.defineProperty(exports, "WaynCheckpoint", { enumerable: true, get: function () { return checkpoint_1.WaynCheckpoint; } });
Object.defineProperty(exports, "createCheckpoint", { enumerable: true, get: function () { return checkpoint_1.createCheckpoint; } });
var react_1 = require("./react");
Object.defineProperty(exports, "withCheckpoint", { enumerable: true, get: function () { return react_1.withCheckpoint; } });
Object.defineProperty(exports, "CheckpointProvider", { enumerable: true, get: function () { return react_1.CheckpointProvider; } });
Object.defineProperty(exports, "useCheckpoint", { enumerable: true, get: function () { return react_1.useCheckpoint; } });
__exportStar(require("./types"), exports);
// Default export
var checkpoint_2 = require("./checkpoint");
Object.defineProperty(exports, "default", { enumerable: true, get: function () { return __importDefault(checkpoint_2).default; } });
//# sourceMappingURL=index.js.map