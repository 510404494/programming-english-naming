import * as vscode from "vscode";
import axios from "axios";
import config from "./config";

export class TranslationViewProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;
  private _context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this._view = undefined;
    this._context = context;
  }

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this._view = webviewView;
    webviewView.webview.options = { enableScripts: true };
    webviewView.webview.html = this._getHtmlContent(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (message: { type: string; text: string }) => {
      if (message.type === "translate") {
        try {
          const postData = {
            model: config.modelName,
            messages: [
              { role: "system", content: config.systemPrompt },
              { role: "user", content: message.text }
            ]
          };
          const postConfig = {
            headers: {
              Authorization: "Bearer " + this._getApiKey(),
              "Content-Type": "application/json"
            }
          };
          const response = await axios.post(config.apiUrl, postData, postConfig);
          const result = JSON.parse(response.data.choices[0].message.content.trim());

          console.log("result", result);
          webviewView.webview.postMessage({ type: "result", ...result });
        } catch (error: unknown) {
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
          } catch (error: unknown) {
              const errorMessage = error instanceof Error ? error.message : "未知错误";
              vscode.window.showErrorMessage("命名转换失败：" + errorMessage);
          }
      }
    });
  }

  private _getApiKey() {
    const extensionConfig = vscode.workspace.getConfiguration("translationHelper");
    return extensionConfig.get("apiKey") || config.defaultApiKey;
  }

  private _getHtmlContent(webview: vscode.Webview): string {
    const { join } = require("path");
    const { readFileSync } = require("fs");
    const htmlFilePath = join(this._context.extensionPath, "src", "webview", "translationView.html");
    return readFileSync(htmlFilePath, "utf-8");
  }

  // 本地命名转换函数
  private _convertNaming(input: string): {
      pascal: string;
      camel: string;
      snake: string;
      kebab: string;
      upperSnake: string;
  } {
      // 清理特殊字符并分割单词
      const words = input
          .replace(/[^a-zA-Z0-9\s]/g, ' ')
          .toLowerCase()
          .split(/\s+/)
          .filter(word => word);
  
      if (words.length === 0) throw new Error("无效的输入");
  
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
