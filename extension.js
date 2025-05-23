const vscode = require('vscode');
const path = require('path');

let intervalId;

function activate(context) {
  const startReminder = (minutes) => {
    const showReminder = () => {
      const panel = vscode.window.createWebviewPanel(
        'drinkReminder',
        '💧 Waktunya Minum!',
        vscode.ViewColumn.One,
        {
          enableScripts: true,
          localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'media'))]
        }
      );

      const logoPath = panel.webview.asWebviewUri(
        vscode.Uri.file(path.join(context.extensionPath, 'media', 'drinkwater.png'))
      );
      const alarmPath = panel.webview.asWebviewUri(
        vscode.Uri.file(path.join(context.extensionPath, 'media', 'bangun.mp3'))
      );

      panel.webview.html = `
        <!DOCTYPE html>
        <html>
        <body style="text-align:center; font-family:sans-serif; padding-top: 20px;">
          <img src="${logoPath}" width="100" height="100" />
          <h2>💧 Udah minum air belum?</h2>
          <button onclick="sendMessage()" style="font-size:16px;padding:10px 20px;">✅ Udah Minum</button>
          <audio autoplay>
            <source src="${alarmPath}" type="audio/mpeg" />
          </audio>
          <script>
            const vscode = acquireVsCodeApi();
            function sendMessage() {
              vscode.postMessage({ command: 'minum' });
            }
          </script>
        </body>
        </html>
      `;

      panel.webview.onDidReceiveMessage(
        message => {
          if (message.command === 'minum') {
            panel.dispose();
          }
        },
        undefined,
        context.subscriptions
      );
    };

    const intervalMs = minutes * 60 * 1000;
    showReminder(); // langsung tampil pertama
    intervalId = setInterval(showReminder, intervalMs);
    vscode.window.showInformationMessage(`💧 Reminder aktif setiap ${minutes} menit.`);
  };

  const disposable = vscode.commands.registerCommand('drink-water-reminder.start', async () => {
    const input = await vscode.window.showInputBox({
      prompt: 'Masukkan interval waktu (menit)',
      placeHolder: 'Contoh: 20',
      validateInput: value => {
        const num = parseInt(value);
        return isNaN(num) || num <= 0 ? 'Harus angka lebih dari 0' : null;
      }
    });

    const minutes = parseInt(input);
    if (!isNaN(minutes) && minutes > 0) {
      if (intervalId) clearInterval(intervalId);
      startReminder(minutes);
    }
  });

  context.subscriptions.push(disposable);

  // Create status bar item
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.command = 'drinkwater-extension.start';
  statusBarItem.text = '💧 Hydrate';
  statusBarItem.tooltip = 'Start Drink Water Reminder';
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  vscode.commands.executeCommand('drinkwater-extension.start');
}

function deactivate() {
  if (intervalId) clearInterval(intervalId);
}

module.exports = {
  activate,
  deactivate
};
