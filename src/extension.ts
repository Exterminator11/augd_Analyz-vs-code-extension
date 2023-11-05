import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('extension.openChat', () => {
        const panel = vscode.window.createWebviewPanel(
            'chat',
            'Chat',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.file(path.join(context.extensionPath, 'src')),
                    vscode.Uri.file(path.join(context.extensionPath, 'media'))
                ]
            }
        );

        panel.iconPath = {
            light: vscode.Uri.file(path.join(context.extensionPath, 'media', 'bot.png')),
            dark: vscode.Uri.file(path.join(context.extensionPath, 'media', 'bot.png'))
        };
        
        const scriptPath = vscode.Uri.file(path.join(context.extensionPath, 'src', 'script.js'));
        const scriptUri = panel.webview.asWebviewUri(scriptPath);

        let htmlPath = path.join(context.extensionPath, 'src', 'webview.html');
        let htmlContent = fs.readFileSync(htmlPath, 'utf8');

        htmlContent = htmlContent.replace('${scriptUri}', scriptUri.toString());
        panel.webview.html = htmlContent;

        panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'alert':
                        vscode.window.showInformationMessage(message.text);
                        return;
                }
            },
            undefined,
            context.subscriptions
        );
    });

    

    context.subscriptions.push(disposable);
}

export function deactivate() {}
