import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

// function insertCodeLensAboveFunctions(document: vscode.TextDocument) {
//     const codeLenses: vscode.CodeLens[] = [];
//     const firstLine = document.lineAt(0);
    
//     const command: vscode.Command = {
//         title: 'Complexity',
//         command: 'extension.GetComplexity',
//         arguments: [firstLine.text]
//     };

//     const range = new vscode.Range(firstLine.range.start, firstLine.range.start); // CodeLens at the start of the first line

//     const codeLens = new vscode.CodeLens(range, command);
//     codeLenses.push(codeLens);

//     // Replace the existing CodeLenses with the new one
//     vscode.languages.registerCodeLensProvider(
//         { scheme: 'file', language: document.languageId },
//         {
//             provideCodeLenses: () => codeLenses,
//             resolveCodeLens: (codeLens: vscode.CodeLens) => codeLens
//         }
//     );
// }

// adding all code lenses

let currentPanel: vscode.WebviewPanel | undefined;
let createChat = true;

function getOrCreateWebviewPanel(
    viewId: string,
    title: string,
    options: vscode.WebviewOptions & vscode.WebviewPanelOptions
): vscode.WebviewPanel {

    if (currentPanel) {
        vscode.window.showInformationMessage('Getting existing panel');
        currentPanel.reveal();
        currentPanel.webview.postMessage({type: 'scrollDown'});
        createChat = false;
        return currentPanel;
    }

    createChat = true;
    vscode.window.showInformationMessage('Creating new panel');
    currentPanel = vscode.window.createWebviewPanel(
        viewId,
        title,
        vscode.ViewColumn.One,
        {
            ...options,
            retainContextWhenHidden: true
        }
    );

    currentPanel.onDidDispose(() => {
        currentPanel = undefined;
    }, null, undefined);

    return currentPanel;
}

class FunctionCodeLensProvider implements vscode.CodeLensProvider {
    private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

    provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
        const codeLenses: vscode.CodeLens[] = [];
        const functionRegex = /(?:\b(?:void|int|String|boolean|char|float|double|long|short|byte|def)\b\s+(\w+)\s*\()/g;
        
        let match;
        while ((match = functionRegex.exec(document.getText())) !== null) {
            const functionName = match[1];
            const range = new vscode.Range(document.positionAt(match.index), document.positionAt(match.index + match[0].length));
    
            // const complexity = await getComplexity(functionName);  //! TO IMPLEMENT
            // const tooltip = `Time Complexity: ${complexity.time}, Space Complexity: ${complexity.space}`;
    
            const command: vscode.Command = {
                title: 'Algorithm Complexity',
                command: 'extension.GetComplexity',
                arguments: [document, functionName, document.languageId],
                tooltip: "This text is under Development"
            };

            const codeLens = new vscode.CodeLens(range, command);
            codeLenses.push(codeLens);
        }
    
        return codeLenses;
    }

    // Trigger a refresh of code lenses when the document changes
    startWatchingForDocumentChanges() {
        const watcher = vscode.workspace.onDidChangeTextDocument(event => {
            this._onDidChangeCodeLenses.fire();
        });

        // Dispose the watcher when the extension is deactivated
        vscode.workspace.onDidCloseTextDocument(() => {
            watcher.dispose();
        });
    }
}

// Extract the function body from the document given the function name
function getFunctionBody(document: vscode.TextDocument, functionName: string): string {
    
    const text = document.getText();
    let functionCode = "";

    if(document.languageId == 'java'){
        const functionStartRegex = new RegExp(`\\b(?:public\\s+static\\s+void|public\\s+static\\s+int|String|boolean|char|float|double|long|short|byte)\\b\\s+${functionName}\\s*\\(.*\\)\\s*\\{`, 'gm');
        let match = functionStartRegex.exec(text);
        if (match) {
            let openBraces = 1; // Start counting from the function declaration
            let closeBraces = 0;
            let i = match.index + match[0].length;

            while (i < text.length) {
                if (text[i] === '{') {
                    openBraces++;
                } else if (text[i] === '}') {
                    closeBraces++;
                    if (openBraces === closeBraces) {
                        break;
                    }
                }
                i++;
            }

            functionCode = text.substring(match.index, i + 1).trim();
        }
    }

    else if(document.languageId == "python"){
        const functionStartRegex = new RegExp(`def\\s+${functionName}\\s*\\(.*\\):`, 'gm');
        let match = functionStartRegex.exec(text);
        if (match) {
            let indentLevel = 0; // Start counting from the function declaration
            let i = match.index + match[0].length;
    
            while (i < text.length) {
                if (text[i] === '\n') {
                    i++;
                    let spaces = 0;
                    while (text[i] === ' ') {
                        spaces++;
                        i++;
                    }
                    if (spaces <= indentLevel && text[i] !== '\n') {
                        break;
                    }
                } else {
                    i++;
                }
            }
    
            functionCode = text.substring(match.index, i).trim();
        }
    }

    return functionCode;
}

// Activate Extension
export function activate(context: vscode.ExtensionContext) {

    const functionCodeLensProvider = new FunctionCodeLensProvider();
    
    // Start watching for document changes
    functionCodeLensProvider.startWatchingForDocumentChanges();

    // Register CodeLens provider
    context.subscriptions.push(vscode.languages.registerCodeLensProvider(['java', 'python'], functionCodeLensProvider));

    // Get Complexity command
    context.subscriptions.push(vscode.commands.registerCommand('extension.GetComplexity', (document: vscode.TextDocument, functionName: string, language: string) => {
        vscode.window.showInformationMessage(`Getting complexity clicked for function: ${functionName}`);

        const functionBody = getFunctionBody(document, functionName);
        
        const panel = getOrCreateWebviewPanel(
            'algorithmComplexity',
            `Algorithm Complexity for ${functionName}`,
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
        
        let cssPath = vscode.Uri.file(path.join(context.extensionPath, 'src', 'style.css'));
        let cssUri = panel.webview.asWebviewUri(cssPath);
        
        let htmlPath = path.join(context.extensionPath, 'src', 'webview.html');
        let htmlContent = fs.readFileSync(htmlPath, 'utf8');
        
        htmlContent = htmlContent.replace('${scriptUri}', scriptUri.toString());
        htmlContent = htmlContent.replace('${cssUri}', cssUri.toString());
        
        panel.webview.html = htmlContent;

        panel.webview.onDidReceiveMessage(
            message => {
                console.log(message)
                switch (message.command) {
                    case 'alert':
                        vscode.window.showInformationMessage(message.text);
                        return;
                    
                    case 'newFile':
                        vscode.window.showInputBox().then(input => {
                            // Use the input here
                            vscode.window.showInformationMessage("New file content: " + input);
                        });
                        return;
                }
            },
            undefined,
            context.subscriptions
        );

        // initiating the Algorithm Complexity chat
        panel.webview.postMessage({ type: 'algorithmComplexity', functionName: `${functionName}`, code: `${functionBody}`, language: `${language}`});
    }));

    // Open Chat command
    let disposable = vscode.commands.registerCommand('extension.openChat', async () => {

        // getting all workspace folders
        const workspaceFolders = vscode.workspace.workspaceFolders;
        const filesArray: { name: string, path: string }[] = [];

        if (workspaceFolders) {
            const workspacePath = workspaceFolders[0].uri.fsPath; // Get the path of the first workspace folder

            fs.readdirSync(workspacePath).forEach(file => {
                filesArray.push({name: file, path: path.join(workspacePath, file)});
            });

        } else {
            vscode.window.showInformationMessage('No workspace is currently open.');
        }

        const panel = getOrCreateWebviewPanel(
            'chat',
            'Chat',
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
        
        let cssPath = vscode.Uri.file(path.join(context.extensionPath, 'src', 'style.css'));
        let cssUri = panel.webview.asWebviewUri(cssPath);
        
        let htmlPath = path.join(context.extensionPath, 'src', 'webview.html');
        let htmlContent = fs.readFileSync(htmlPath, 'utf8');
        
        htmlContent = htmlContent.replace('${scriptUri}', scriptUri.toString());
        htmlContent = htmlContent.replace('${cssUri}', cssUri.toString());
        
        panel.webview.html = htmlContent;

        panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'alert':
                        vscode.window.showInformationMessage(message.text);
                        return;

                    case 'newFile':
                        vscode.window.showInputBox().then(input => {
                            // Use the input here
                            vscode.window.showInformationMessage("New file content: " + input);
                            const code = message.code 

                            // creating the file
                            fs.writeFile(`${workspaceFolders![0].uri.fsPath}/${input}`, code, function (err) {
                                if (err) throw err;
                                console.log('Saved!');
                            });
                        });
                        return;
                }
            },
            undefined,
            context.subscriptions
        );

        // initiating the chat
        if(createChat){
            panel.webview.postMessage({ type: 'chat', text: 'Hello there! I am Analyz, your personal coding assistant. How can I help you today?'});
        }
        else{
            vscode.window.showInformationMessage("Chat already exists not inserting text")
        }
        
        // sending the current workspace files to script.js
        panel.webview.postMessage({ type: 'files', files: filesArray, workspacePath: workspaceFolders![0].uri.fsPath});
    });

    context.subscriptions.push(disposable);
}

// ! TO IMPLEMENT
// async function getComplexity(functionName: string): Promise<{time: string, space: string}> {
//     return new Promise((resolve, reject) => {
//         // Create a message to send
//         const message = {
//             command: 'getComplexity',
//             functionName: functionName
//         };

//         // Send the message to script.js
//         postMessage(message);

//         // Listen for a response
//         window.addEventListener('message', event => {
//             const message = event.data; // The JSON data our extension sent

//             if (message.command === 'complexityResponse') {
//                 resolve({
//                     time: message.timeComplexity,
//                     space: message.spaceComplexity
//                 });
//             }
//         });
//     });
// }

export function deactivate() {}