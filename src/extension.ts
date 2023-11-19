import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

function insertCodeLensAboveFunctions(document: vscode.TextDocument) {
    const codeLenses: vscode.CodeLens[] = [];
    const firstLine = document.lineAt(0);
    
    const text=document.getText();

    const command: vscode.Command = {
        title: 'Convert code',
        command: 'extension.ConvertCode',
        arguments: [text]
    };

//     const range = new vscode.Range(firstLine.range.start, firstLine.range.start); // CodeLens at the start of the first line

//     const codeLens = new vscode.CodeLens(range, command);
//     codeLenses.push(codeLens);

    // Replace the existing CodeLenses with the new one
    vscode.languages.registerCodeLensProvider(
        { scheme: 'file', language: document.languageId },
        {
            provideCodeLenses: () => codeLenses,
            resolveCodeLens: (codeLens: vscode.CodeLens) => codeLens
        }
    );
}

// adding all code lenses

let currentPanel: vscode.WebviewPanel | undefined;
let createChat = true;
insertCodeLensAboveFunctions(vscode.window.activeTextEditor!.document);

function getOrCreateWebviewPanel(
    viewId: string,
    title: string,
    options: vscode.WebviewOptions & vscode.WebviewPanelOptions
): vscode.WebviewPanel {

    if (currentPanel) {
        currentPanel.reveal();
        currentPanel.webview.postMessage({type: 'scrollDown'});
        createChat = false;
        return currentPanel;
    }

    createChat = true;
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

    if(document.languageId === 'java'){
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

    else if(document.languageId === "python"){
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
    
    // CODE CONVERTER
    context.subscriptions.push(vscode.commands.registerCommand('extension.ConvertCode', (text:string) => {
        
        const panel = vscode.window.createWebviewPanel(
            "Convert Code",
            "Convert Code",
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.file(path.join(context.extensionPath, 'src')),
                    vscode.Uri.file(path.join(context.extensionPath, 'media'))
                ]
            }
        )
        
        panel.webview.html = `<iframe src="http://localhost:8502" frameborder="0" style="width:100%; height:100vh"></iframe>`;
    }));

    //FLOWCHART
    context.subscriptions.push(vscode.commands.registerCommand('extension.flowchartExplanation', (text:string) => {
        
        const panel = vscode.window.createWebviewPanel(
            "Flowchart",
            "FLowchart explanantion",
            vscode.ViewColumn.One,
            {
                enableScripts: true,
            }
        )
        
        // panel.webview.html = `<iframe src="https://analyz-roadmap-generator.streamlit.app/ " frameborder="0" style="width:100%; height:100vh"></iframe>`;
        // panel.webview.html = `<h1>Hello</h1>`;
        panel.webview.html = `<iframe src="http://localhost:8501" frameborder="0" style="width:100%; height:100vh"></iframe>`;
    }));

    // Get Complexity command
    context.subscriptions.push(vscode.commands.registerCommand('extension.GetComplexity', (document: vscode.TextDocument, functionName: string, language: string) => {

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
                console.log(message);
                switch (message.command) {
                    case 'alert':
                        vscode.window.showInformationMessage(message.text);
                        return;
                }
            },
            undefined,
            context.subscriptions
        );

        // initiating the Algorithm Complexity chat
        panel.webview.postMessage({ type: 'algorithmComplexity', functionName: `${functionName}`, code: `${functionBody}`, language: `${language}`});
    }));

    context.subscriptions.push(vscode.commands.registerCommand('extension.translateCode', (text: string) => {

        // adding text to clipboard
        vscode.env.clipboard.writeText(text);

        // create new pannel
        let panel = vscode.window.createWebviewPanel(
            'codeConvertor', // Identifies the type of the webview. Used internally
            'Code Convertor', // Title of the panel displayed to the user
            vscode.ViewColumn.One, // Editor column to show the new webview panel in.
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
        
        // And set its HTML content
        panel.webview.html = `<iframe src="https://analyz-code-converter.streamlit.app/" frameborder="0" style="width:100%; height:100vh;"></iframe>`;
    }));

    // extension.flowchartExplanation 
    context.subscriptions.push(vscode.commands.registerCommand('extension.flowchartExplanation', () => {

        let panel = vscode.window.createWebviewPanel(
            'flowchartExplanation', // Identifies the type of the webview. Used internally
            'Flowchart Explanation', // Title of the panel displayed to the user
            vscode.ViewColumn.One, // Editor column to show the new webview panel in.
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

        panel.webview.html = `<iframe src="https://www.example.com" frameborder="0" style="width:100%; height:100vh;"></iframe>`

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
                            const code = message.code ;

                            // creating the file
                            fs.writeFile(`${workspaceFolders![0].uri.fsPath}/${input}`, code, function (err) {
                                if (err) {
                                    throw err;
                                }
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
        
        // sending the current workspace files to script.js
        panel.webview.postMessage({ type: 'files', files: filesArray, workspacePath: workspaceFolders![0].uri.fsPath});
    });


    context.subscriptions.push(disposable);
}


export function deactivate() {}


insertCodeLensAboveFunctions(vscode.window.activeTextEditor!.document)