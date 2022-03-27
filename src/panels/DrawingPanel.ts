import * as vscode from "vscode";
import { getUri } from "../utilities/getUri";

export class DrawingPanel {
  public static currentPanel: DrawingPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._panel.onDidDispose(this.dispose, null, this._disposables);
    this._panel.webview.html = this._getWebviewContent(
      this._panel.webview,
      extensionUri
      );
      this._setWebviewMessageListener(this._panel.webview);
  }

  public static render(extensionUri: vscode.Uri) {
    if (DrawingPanel.currentPanel) {
      DrawingPanel.currentPanel._panel.reveal(vscode.ViewColumn.One);
    } else {
      const panel = vscode.window.createWebviewPanel(
        "super paint",
        "paint",
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
      );

      DrawingPanel.currentPanel = new DrawingPanel(panel, extensionUri);
    }
  }

  public dispose() {
    DrawingPanel.currentPanel = undefined;

    this._panel.dispose();

    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  private _getWebviewContent(
    webview: vscode.Webview,
    extensionUri: vscode.Uri
  ) {
    const mainUri = getUri(webview, extensionUri, ["webview-ui", "main.js"]);
    const scriptUri = getUri(webview, extensionUri, [
      "webview-ui",
      "script.js",
    ]);
    const styleUri = getUri(webview, extensionUri, [
      "webview-ui",
      "styleUri.css",
    ]);
      
    const toolkitUri = getUri(webview, extensionUri, [
      "node_modules",
      "@vscode",
      "webview-ui-toolkit",
      "dist",
      "toolkit.js", // A toolkit.min.js file is also available
    ]);
    // Tip: Install the es6-string-html VS Code extension to enable code highlighting below
    return /*html*/ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width">
            <script type="module" src="${toolkitUri}"></script>
            <link href="${styleUri}" rel="stylesheet" type="text/css" />
          <title>paint</title>
        </head>
        <body>

            <script type="module" src="${scriptUri}"></script>
            <svg xmlns="http://www.w3.org/2000/svg" width="700" height="700" ></svg>
            <img src="https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif" width="300" />
        </body>
      </html>
    `;
  }

  private _setWebviewMessageListener(webview: vscode.Webview) {
    webview.onDidReceiveMessage(
      (message: any) => {
        const command = message.command;
        const text = message.text;

        switch (command) {
          case "hi":
            vscode.window.showInformationMessage(text);
            return;
        }
      },
      undefined,
      this._disposables
    );
  }
}
