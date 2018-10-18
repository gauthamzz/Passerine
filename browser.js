'use strict';
const electron = require('electron');
const config = require('./config');

const {ipcRenderer: ipc} = electron;

function setDarkMode() {
	document.documentElement.classList.toggle('dark-mode', config.get('darkMode'));
	ipc.send('set-vibrancy');
}

function setVibrancy() {
	document.documentElement.classList.toggle('vibrancy', config.get('vibrancy'));
	ipc.send('set-vibrancy');
}

function renderOverlayIcon(messageCount) {
	const canvas = document.createElement('canvas');
	canvas.height = 128;
	canvas.width = 128;
	canvas.style.letterSpacing = '-5px';
	const ctx = canvas.getContext('2d');
	ctx.fillStyle = '#f42020';
	ctx.beginPath();
	ctx.ellipse(64, 64, 64, 64, 0, 0, 2 * Math.PI);
	ctx.fill();
	ctx.textAlign = 'center';
	ctx.fillStyle = 'white';
	ctx.font = '90px sans-serif';
	ctx.fillText(String(Math.min(99, messageCount)), 64, 96);
	return canvas;
}

//	eslint-disable-line capitalized-comments
// ipc.on('toggle-sidebar', () => {
// 	config.set('sidebarHidden', !config.get('sidebarHidden'));
// 	setSidebarVisibility();
// });

ipc.on('toggle-dark-mode', () => {
	config.set('darkMode', !config.get('darkMode'));
	setDarkMode();
});

ipc.on('toggle-vibrancy', () => {
	config.set('vibrancy', !config.get('vibrancy'));
	setVibrancy();

	document.documentElement.style.backgroundColor = 'transparent';
});

// Inject a global style node to maintain custom appearance after conversation change or startup
document.addEventListener('DOMContentLoaded', () => {
	const style = document.createElement('style');
	style.id = 'zoomFactor';
	document.body.appendChild(style);

	// Set the zoom factor if it was set before quitting
	const zoomFactor = config.get('zoomFactor') || 1.0;
	setZoom(zoomFactor);

	// Hide sidebar if it was hidden before quitting
	setSidebarVisibility();

	// Activate Dark Mode if it was set before quitting
	setDarkMode();

	// Prevent flash of white on startup when in dark mode
	// TODO: find a CSS-only solution
	if (config.get('darkMode')) {
		document.documentElement.style.backgroundColor = '#192633';
	}

	// Activate vibrancy effect if it was set before quitting
	setVibrancy();
});

// It's not possible to add multiple accelerators
// so this needs to be done the old-school way
document.addEventListener('keydown', event => {
	const combineKey = process.platform === 'darwin' ? event.metaKey : event.ctrlKey;

	if (!combineKey) {
		return;
	}

	if (event.key === ']') {
		nextConversation();
	}

	if (event.key === '[') {
		previousConversation();
	}

	const num = parseInt(event.key, 10);

	if (num >= 1 && num <= 9) {
		jumpToConversation(num);
	}
});
