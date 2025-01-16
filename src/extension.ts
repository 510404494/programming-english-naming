/*
 * @Author: lingqiang.kong lingqiang.kong@changhong.com
 * @Date: 2025-01-16 11:11:59
 * @LastEditors: lingqiang.kong lingqiang.kong@changhong.com
 * @LastEditTime: 2025-01-16 15:23:56
 * @FilePath: /programming-english-naming/src/extension.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { TranslationViewProvider } from './translationView';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
export function activate(context: vscode.ExtensionContext) {
	// 注册 WebView 提供者
	const provider = new TranslationViewProvider(context);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider('translationView', provider)
	);
}

// This method is called when your extension is deactivated
export function deactivate() {}
