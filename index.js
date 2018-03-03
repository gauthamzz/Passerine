'use strict';
const path = require('path');
const fs = require('fs');
const URL = require('url').URL;
const electron = require('electron');
// -const electronLocalShortcut = require('electron-localshortcut');
const log = require('electron-log');
const {autoUpdater} = require('electron-updater');
const isDev = require('electron-is-dev');
const appMenu = require('./menu');
const config = require('./config');
// const tray = require('./tray');

require('electron-debug')({enabled: true});
require('electron-dl')();
require('electron-context-menu')();

const domain = 'producthunt.com'	;
const {app, ipcMain, Menu} = electron;

app.setAppUserModelId('com.gauthamzz.legacy');
app.disableHardwareAcceleration();

if (!isDev) {
	autoUpdater.logger = log;
	autoUpdater.logger.transports.file.level = 'info';
	autoUpdater.checkForUpdates();
}

let mainWindow;
let isQuitting = false;
let prevMessageCount = 0;
let dockMenu;

const isAlreadyRunning = app.makeSingleInstance(() => {
	if (mainWindow) {
		if (mainWindow.isMinimized()) {
			mainWindow.restore();
		}

		mainWindow.show();
	}
});

if (isAlreadyRunning) {
	app.quit();
}


function createMainWindow() {
	const lastWindowState = config.get('lastWindowState');
	const isDarkMode = config.get('darkMode');
	// Messenger or Work Chat
	const mainURL = 'https://www.producthunt.com';
	const titlePrefix = 'Product Hunt';

	const win = new electron.BrowserWindow({
		title: app.getName(),
		show: false,
		x: lastWindowState.x,
		y: lastWindowState.y,
		width: lastWindowState.width,
		height: lastWindowState.height,
		icon: process.platform === 'linux' && path.join(__dirname, 'static/Icon.png'),
		minWidth: 400,
		minHeight: 200,
		alwaysOnTop: config.get('alwaysOnTop'),
		// Temp workaround for macOS High Sierra, see #295
		titleBarStyle: process.platform === 'darwin' && Number(require('os').release().split('.')[0]) >= 17 ? null : 'hidden-inset',
		autoHideMenuBar: config.get('autoHideMenuBar'),
		darkTheme: isDarkMode, // GTK+3
		webPreferences: {
			preload: path.join(__dirname, 'browser.js'),
			nodeIntegration: false,
			plugins: true
		}
	});

	if (process.platform === 'darwin') {
		win.setSheetOffset(40);
	}

	win.loadURL(mainURL);

	win.on('close', e => {
		if (!isQuitting) {
			e.preventDefault();

			// Workaround for electron/electron#10023
			win.blur();

			if (process.platform === 'darwin') {
				app.hide();
			} else {
				win.hide();
			}
		}
	});

	win.on('page-title-updated', (e, title) => {
		e.preventDefault();

	});

	win.on('focus', () => {
		if (config.get('flashWindowOnMessage')) {
			// This is a security in the case where messageCount is not reset by page title update
			win.flashFrame(false);
		}
	});

	return win;
}

app.on('ready', () => {
	const trackingUrlPrefix = `https://l.${domain}/l.php`;
	electron.Menu.setApplicationMenu(appMenu);
	mainWindow = createMainWindow();
	// tray.create(mainWindow);

	if (process.platform === 'darwin') {
		dockMenu = electron.Menu.buildFromTemplate([
			{
				label: 'Mute Notifications',
				type: 'checkbox',
				checked: config.get('notificationsMuted'),
				click() {
					mainWindow.webContents.send('toggle-mute-notifications');
				}
			}
		]);
		app.dock.setMenu(dockMenu);
	}


	const {webContents} = mainWindow;


	webContents.on('dom-ready', () => {
		webContents.insertCSS(fs.readFileSync(path.join(__dirname, 'browser.css'), 'utf8'));
		webContents.insertCSS(fs.readFileSync(path.join(__dirname, 'dark-mode.css'), 'utf8'));


		if (config.get('launchMinimized')) {
			mainWindow.hide();
		} else {
			mainWindow.show();
		}

		mainWindow.webContents.send('toggle-mute-notifications', config.get('notificationsMuted'));
	});

	webContents.on('new-window', (event, url, frameName, disposition, options) => {
		event.preventDefault();

		if (url === 'about:blank') {
			if (frameName !== 'about:blank') { // Voice/video call popup
				options.show = true;
				options.titleBarStyle = 'default';
				options.webPreferences.nodeIntegration = false;
				options.webPreferences.preload = path.join(__dirname, 'browser-call.js');
				event.newGuest = new electron.BrowserWindow(options);
			}
		} else {
			if (url.startsWith(trackingUrlPrefix)) {
				url = new URL(url).searchParams.get('u');
			}

			electron.shell.openExternal(url);
		}
	});
});

ipcMain.on('set-vibrancy', () => {
	if (config.get('vibrancy')) {
		mainWindow.setVibrancy(config.get('darkMode') ? 'ultra-dark' : 'light');
	} else {
		mainWindow.setVibrancy(null);
	}
});

ipcMain.on('mute-notifications-toggled', (event, status) => {
	setNotificationsMute(status);
});

app.on('activate', () => {
	mainWindow.show();
});

app.on('before-quit', () => {
	isQuitting = true;

	if (!mainWindow.isFullScreen()) {
		config.set('lastWindowState', mainWindow.getBounds());
	}
});
