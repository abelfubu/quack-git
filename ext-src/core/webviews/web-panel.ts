import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { PostMessage } from '../git/models/post-message.model';
import { GitApi } from '../git/git-api';

export class WebPanel {
  public static currentPanel: WebPanel | undefined;

  private static readonly viewType = 'angular';

  private readonly panel: vscode.WebviewPanel;
  private readonly extensionPath: string;
  private readonly builtAppFolder: string;
  private disposables: vscode.Disposable[] = [];

  private readonly gitApi = new GitApi(vscode);

  public static async createOrShow(extensionPath: string) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it.
    // Otherwise, create angular panel.
    if (WebPanel.currentPanel) {
      WebPanel.currentPanel.panel.reveal(column);
    } else {
      WebPanel.currentPanel = new WebPanel(
        extensionPath,
        column || vscode.ViewColumn.One
      );
    }

    return WebPanel.currentPanel;
  }

  private constructor(extensionPath: string, column: vscode.ViewColumn) {
    this.extensionPath = extensionPath;
    this.builtAppFolder = 'dist';

    try {
      this.gitApi.activate();
    } catch (error) {
      vscode.window.showErrorMessage(String(error));
    }
    // Create and show a new webview panel
    this.panel = vscode.window.createWebviewPanel(
      WebPanel.viewType,
      'My Angular Webview',
      column,
      {
        // Enable javascript in the webview
        enableScripts: true,

        // And restrict the webview to only loading content from our extension's `media` directory.
        localResourceRoots: [
          vscode.Uri.file(path.join(this.extensionPath, this.builtAppFolder)),
        ],
      }
    );

    // Set the webview's initial html content
    this.panel.webview.html = this._getHtmlForWebview();

    // Listen for when the panel is disposed
    // This happens when the user closes the panel or when the panel is closed programatically
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

    // Handle messages from the webview
    this.panel.webview.onDidReceiveMessage(
      async ({ command, text }: PostMessage) => {
        switch (command) {
          case 'load-data':
            await this.loadData();
            return;
          case 'delete':
            await this.gitApi.deleteBranch(text);
            await this.loadData();
            return;
          case 'new':
            await vscode.commands.executeCommand('git.branch');
            await this.loadData();
            return;
          case 'checkout':
            await this.gitApi.checkout(text);
            await this.loadData();
            return;
        }
      },
      null,
      this.disposables
    );
  }

  private async loadLogs(): Promise<void> {
    const data = await this.gitApi.getLogs();
    this.postMessage({ command: 'logs', data });
  }

  private async loadData(): Promise<void> {
    const data = await this.gitApi.getData();
    this.postMessage({ command: 'load-data', data });
  }

  public postMessage<T>(message: { command: string; data: T }): void {
    this.panel.webview.postMessage(message);
  }

  public dispose() {
    WebPanel.currentPanel = undefined;

    // Clean up our resources
    this.panel.dispose();

    while (this.disposables.length) {
      const x = this.disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  /**
   * Returns html of the start page (index.html)
   */
  private _getHtmlForWebview() {
    // path to dist folder
    const appDistPath = path.join(this.extensionPath, 'dist');
    const appDistPathUri = vscode.Uri.file(appDistPath);

    // path as uri
    const baseUri = this.panel.webview.asWebviewUri(appDistPathUri);

    // get path to index.html file from dist folder
    const indexPath = path.join(appDistPath, 'index.html');

    // read index file from file system
    let indexHtml = fs.readFileSync(indexPath, { encoding: 'utf8' });

    // update the base URI tag
    indexHtml = indexHtml.replace(
      '<base href="/">',
      `<base href="${String(baseUri)}/">`
    );

    return indexHtml;
  }
}
