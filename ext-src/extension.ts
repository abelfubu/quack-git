import * as vscode from 'vscode';
import { WebPanel } from './core/webviews/web-panel';

/**
 * Activates extension
 * @param context vscode extension context
 */
export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('quackGit.start', async () => {
      WebPanel.createOrShow(context.extensionPath);
    })
  );
}
