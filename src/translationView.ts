import * as vscode from "vscode";
import axios from "axios";

export class TranslationViewProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;
  private _context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this._view = undefined;
    this._context = context;
  }

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this._view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
    };

    // 设置WebView的HTML内容
    webviewView.webview.html = this._getHtmlContent(webviewView.webview);

    // 处理来自WebView的消息
    webviewView.webview.onDidReceiveMessage(
      async (message: { type: string; text: string }) => {
        if (message.type === "translate") {
          try {
            const response = await axios.post(
              "https://api.siliconflow.cn/v1/chat/completions",
              {
                model: "Qwen/Qwen2.5-14B-Instruct",
                messages: [
                  {
                    role: "system",
                    content: `你是一个专业的程序员中文翻译命名助手，同时也是一名高级前端工程师，请完成以下任务：
1. 将用户输入的中文翻译成英文
2. 提供以下命名建议：
   - 变量命名（小驼峰）
   - 类/接口命名（大驼峰）
   - 方法命名（动词开头，小驼峰）
   - 常量命名（全大写下划线）
   - 文件/文件夹命名（kebab-case）
3. 如果名称超过20个字符，提供合适的缩写建议，不能出现中文，不能使用拼音
4. 按以下JSON格式返回结果：
{
    "english": "翻译结果",
    "naming": {
        "variable": "变量命名",
        "class": "类命名",
        "method": "方法命名",
        "constant": "常量命名",
        "file": "文件命名",
        "abbreviation": "缩写建议(如果需要)"
    }
}
5.每种命名给出多种结果建议
    `,
                  },
                  {
                    role: "user",
                    content: message.text,
                  },
                ],
              },
              {
                headers: {
                  Authorization: "Bearer " + this._getApiKey(),
                  "Content-Type": "application/json",
                },
              }
            );

            const result = JSON.parse(
              response.data.choices[0].message.content.trim()
            );

            console.log("result", result);

            // 发送结果回WebView
            webviewView.webview.postMessage({
              type: "result",
              ...result,
            });
          } catch (error: unknown) {
            const errorMessage =
              error instanceof Error ? error.message : "未知错误";
            vscode.window.showErrorMessage("翻译失败：" + errorMessage);
            // 发送错误消息到 WebView，以取消加载状态
            webviewView.webview.postMessage({
              type: "result",
              error: true,
            });
          }
        }
      }
    );
  }

  // 获取 API Key
  private _getApiKey() {
    const config = vscode.workspace.getConfiguration("translationHelper");
    return (
      config.get("apiKey") ||
      "sk-ylxslkvftadjtltnuwcolbippxqyeufwzacqdtlcmjzmiecq"
    );
  }

  // 转换为小驼峰命名
  private _toCamelCase(str: string): string {
    return str
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]+(.)/g, (_: string, chr: string) =>
        chr.toUpperCase()
      );
  }

  // 转换为大驼峰命名
  private _toPascalCase(str: string): string {
    const camelCase = this._toCamelCase(str);
    return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
  }

  private _getHtmlContent(webview: vscode.Webview): string {
    return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { 
                        padding: 10px; 
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                    }
                    input, button { 
                        width: 100%; 
                        margin: 5px 0; 
                        padding: 8px;
                    }
                    button {
                        background-color: #007acc;
                        color: white;
                        border: none;
                        cursor: pointer;
                        padding: 8px 16px;
                        transition: all 0.3s ease;
                    }
                    button:hover {
                        background-color: #005999;
                    }
                    button:disabled {
                        background-color: #cccccc;
                        cursor: not-allowed;
                    }
                    
                    .loading-spinner {
                        display: none;
                        width: 16px;
                        height: 16px;
                        border: 2px solid #ffffff;
                        border-top: 2px solid transparent;
                        border-radius: 50%;
                        margin-left: 8px;
                        animation: spin 1s linear infinite;
                        vertical-align: middle;
                    }
                    
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                    
                    .button-content {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                    }
                    .result { 
                        margin-top: 20px;
                        border-top: 1px solid #ccc;
                        padding-top: 10px;
                    }
                    .result-item {
                        margin: 8px 0;
                        padding: 8px;
                        background-color: #f3f3f3;
                        color:#000;
                        border-radius: 4px;
                    }
                    .result-label {
                        font-weight: bold;
                        color: #666;
                    }
                    .abbreviation {
                        margin-top: 10px;
                        padding: 8px;
                        background-color: #fff3cd;
                        border-left: 4px solid #ffc107;
                    }
                </style>
            </head>
            <body>
                <input type="text" id="chineseInput" placeholder="请输入中文">
                <button id="translateBtn">
                    <div class="button-content">
                        <span>翻译并生成命名建议</span>
                        <div class="loading-spinner" id="loadingSpinner"></div>
                    </div>
                </button>
                <div class="result">
                    <div id="englishResult" class="result-item"></div>
                    <div id="variableResult" class="result-item"></div>
                    <div id="classResult" class="result-item"></div>
                    <div id="methodResult" class="result-item"></div>
                    <div id="constantResult" class="result-item"></div>
                    <div id="fileResult" class="result-item"></div>
                    <div id="abbreviationResult" class="abbreviation" style="display: none;"></div>
                </div>
                <script>
                    const vscode = acquireVsCodeApi();
                    const translateBtn = document.getElementById('translateBtn');
                    const loadingSpinner = document.getElementById('loadingSpinner');
                    const chineseInput = document.getElementById('chineseInput');

                    function setLoading(isLoading) {
                        if (isLoading) {
                            translateBtn.disabled = true;
                            loadingSpinner.style.display = 'inline-block';
                            chineseInput.disabled = true;
                        } else {
                            translateBtn.disabled = false;
                            loadingSpinner.style.display = 'none';
                            chineseInput.disabled = false;
                        }
                    }

                    translateBtn.addEventListener('click', () => {
                        const text = chineseInput.value;
                        if (!text.trim()) {
                            return;
                        }
                        
                        setLoading(true);
                        vscode.postMessage({ type: 'translate', text });
                    });

                    window.addEventListener('message', event => {
                        const message = event.data;
                        if (message.type === 'result') {
                            setLoading(false);
                            
                            document.getElementById('englishResult').innerHTML = 
                                '<span class="result-label">英文翻译：</span>' + message.english;
                            document.getElementById('variableResult').innerHTML = 
                                '<span class="result-label">变量命名：</span>' + message.naming.variable;
                            document.getElementById('classResult').innerHTML = 
                                '<span class="result-label">类名：</span>' + message.naming.class;
                            document.getElementById('methodResult').innerHTML = 
                                '<span class="result-label">方法名：</span>' + message.naming.method;
                            document.getElementById('constantResult').innerHTML = 
                                '<span class="result-label">常量名：</span>' + message.naming.constant;
                            document.getElementById('fileResult').innerHTML = 
                                '<span class="result-label">文件名：</span>' + message.naming.file;
                            
                            const abbr = document.getElementById('abbreviationResult');
                            if (message.naming.abbreviation) {
                                abbr.innerHTML = '<span class="result-label">缩写建议：</span>' + 
                                    message.naming.abbreviation;
                                abbr.style.display = 'block';
                            } else {
                                abbr.style.display = 'none';
                            }
                        }
                    });
                </script>
            </body>
            </html>
        `;
  }
}
