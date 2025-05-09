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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TranslationViewProvider = void 0;
const vscode = __importStar(require("vscode"));
const axios_1 = __importDefault(require("axios"));
const config_1 = __importDefault(require("./config"));
class TranslationViewProvider {
    _view;
    _context;
    constructor(context) {
        this._view = undefined;
        this._context = context;
    }
    resolveWebviewView(webviewView) {
        this._view = webviewView;
        webviewView.webview.options = { enableScripts: true };
        webviewView.webview.html = this._getHtmlContent(webviewView.webview);
        webviewView.webview.onDidReceiveMessage(async (message) => {
            if (message.type === "translate") {
                try {
                    const postData = {
                        model: config_1.default.modelName,
                        messages: [
                            { role: "system", content: config_1.default.systemPrompt },
                            { role: "user", content: message.text }
                        ]
                    };
                    const postConfig = {
                        headers: {
                            Authorization: "Bearer " + this._getApiKey(),
                            "Content-Type": "application/json"
                        }
                    };
                    const response = await axios_1.default.post(config_1.default.apiUrl, postData, postConfig);
                    const result = JSON.parse(response.data.choices[0].message.content.trim());
                    console.log("result", result);
                    webviewView.webview.postMessage({ type: "result", ...result });
                }
                catch (error) {
                    const errorMessage = error instanceof Error ? error.message : "未知错误";
                    vscode.window.showErrorMessage("翻译失败：" + errorMessage);
                    webviewView.webview.postMessage({ type: "result", error: true });
                }
            }
            // 新增命名转换处理
            if (message.type === "convertNaming") {
                try {
                    const result = this._convertNaming(message.text);
                    webviewView.webview.postMessage({ type: "convertResult", ...result });
                }
                catch (error) {
                    const errorMessage = error instanceof Error ? error.message : "未知错误";
                    vscode.window.showErrorMessage("命名转换失败：" + errorMessage);
                }
            }
        });
    }
    _getApiKey() {
        const extensionConfig = vscode.workspace.getConfiguration("translationHelper");
        return extensionConfig.get("apiKey") || config_1.default.defaultApiKey;
    }
    _getHtmlContent(webview) {
        const { join } = require("path");
        const { readFileSync } = require("fs");
        const htmlFilePath = join(this._context.extensionPath, "src", "webview", "translationView.html");
        return readFileSync(htmlFilePath, "utf-8");
    }
    // 本地命名转换函数
    _convertNaming(input) {
        // 清理特殊字符并分割单词
        const words = input
            .replace(/[^a-zA-Z0-9\s]/g, ' ')
            .toLowerCase()
            .split(/\s+/)
            .filter(word => word);
        if (words.length === 0)
            throw new Error("无效的输入");
        // 大驼峰（PascalCase）
        const pascal = words.map(word => word[0].toUpperCase() + word.slice(1)).join('');
        // 小驼峰（camelCase）
        const camel = words[0].toLowerCase() +
            words.slice(1).map(word => word[0].toUpperCase() + word.slice(1)).join('');
        // 蛇形命名（snake_case）
        const snake = words.join('_');
        // 短横线命名（kebab-case）
        const kebab = words.join('-');
        // 全大写蛇形（SNAKE_CASE）
        const upperSnake = snake.toUpperCase();
        return { pascal, camel, snake, kebab, upperSnake };
    }
}
exports.TranslationViewProvider = TranslationViewProvider;
