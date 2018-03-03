'use strict';
const os = require('os');
const path = require('path');
const electron = require('electron');
const config = require('./config');

const {app, BrowserWindow, shell} = electron;
const appName = app.getName();

function sendAction(action) {
	const [win] = BrowserWindow.getAllWindows();

	if (process.platform === 'darwin') {
		win.restore();
	}

	win.webContents.send(action);
}

const viewSubmenu = [

	{
		label: 'Toggle Dark Mode',
		accelerator: 'CmdOrCtrl+D',
		click() {
			sendAction('toggle-dark-mode');
		}
	}
];

const helpSubmenu = [
	{
		label: `Source Code`,
		click() {
			shell.openExternal('https://github.com/aviary-apps/Passerine');
		}
	},
	{
		label: 'Report an Issue…',
		click() {
			const body = `
<!-- Please succinctly describe your issue and steps to reproduce it. -->


---

${app.getName()} ${app.getVersion()}
Electron ${process.versions.electron}
${process.platform} ${process.arch} ${os.release()}`;

			shell.openExternal(`https://github.com/aviary-apps/Passerine/issues/new?body=${encodeURIComponent(body)}`);
		}
	}
];

if (process.platform === 'darwin') {
	viewSubmenu.push({
		label: 'Toggle Vibrancy',
		click() {
			sendAction('toggle-vibrancy');
		}
	});
} else {
	helpSubmenu.push({
		type: 'separator'
	}, {
		role: 'about',
		click() {
			electron.dialog.showMessageBox({
				title: `About ${appName}`,
				message: `${appName} ${app.getVersion()}`,
				detail: 'Created by Aviary Apps',
				icon: path.join(__dirname, 'static/Icon.png')
			});
		}
	});

	viewSubmenu.push({
		type: 'separator'
	}, {
		type: 'checkbox',
		label: 'Always on Top',
		accelerator: 'Ctrl+Shift+T',
		checked: config.get('alwaysOnTop'),
		click(item, focusedWindow) {
			config.set('alwaysOnTop', item.checked);
			focusedWindow.setAlwaysOnTop(item.checked);
		}
	});
}

const macosTpl = [
	{
		label: appName,
		submenu: [
			{
				role: 'about'
			},
			{
				role: 'quit'
			}
		]
	},
	{
		label: 'File',
		submenu: [
			
		]
	},
	{
		role: 'editMenu'
	},
	{
		label: 'View',
		submenu: viewSubmenu
	},
	{
		role: 'window',
		submenu: [
			{
				role: 'minimize'
			},
			{
				role: 'close'
			},
			{
				type: 'separator'
			},
			{
				role: 'front'
			},
			{
				role: 'togglefullscreen'
			},
			{
				type: 'separator'
			},
			{
				type: 'checkbox',
				label: 'Always on Top',
				accelerator: 'Cmd+Shift+T',
				checked: config.get('alwaysOnTop'),
				click(item, focusedWindow) {
					config.set('alwaysOnTop', item.checked);
					focusedWindow.setAlwaysOnTop(item.checked);
				}
			}
		]
	},
	{
		role: 'help',
		submenu: helpSubmenu
	}
];

const otherTpl = [
	{
		label: 'File',
		submenu: [

		
			{
				type: 'separator'
			},
			{
				role: 'quit'
			}
		]
	},
	{
		label: 'Edit',
		submenu: [
			{
				role: 'undo'
			},
			{
				role: 'redo'
			},
			{
				type: 'separator'
			},
			{
				role: 'cut'
			},
			{
				role: 'copy'
			},
			{
				role: 'paste'
			},
			{
				role: 'delete'
			},
			{
				type: 'separator'
			},
			{
				role: 'selectall'
			},
			{
				type: 'separator'
			}
		]
	},
	{
		label: 'View',
		submenu: viewSubmenu
	},
	{
		role: 'help',
		submenu: helpSubmenu
	}
];

const tpl = process.platform === 'darwin' ? macosTpl : otherTpl;

module.exports = electron.Menu.buildFromTemplate(tpl);
