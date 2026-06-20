import {
	BetterPomodoroSettingsTab,
	DEFAULT_SETTINGS,
	type PluginSettings,
} from "./settings"
import { CustomView, PLUGIN_CUSTOM_VIEW_ID } from "./custom-view"
import { Notice, Plugin, TFile } from "obsidian"
import StatusBar from "./status-bar"
import { Timer } from "./timer"
import { playSound } from "./sound"

export default class BetterPomodoroPlugin extends Plugin {
	settings: PluginSettings
	timer: Timer
	sb: StatusBar

	async onload() {
		await this.loadSettings()

		this.timer = new Timer(this.settings)

		this.timer.registerEventHandler("elapsed", () => {
			// Use a conditional expression because settings can changed during run
			// and the onload function would not be reloaded
			if (this.settings.playNotificationSound) {
				playSound(this.getFile(this.settings.customNotificationSound))
			}
		})

		// TODO: Custom message template
		this.timer.registerEventHandler("elapsed", () => {
			this.notify(`Time has elapsed`)
		})

		this.registerView(PLUGIN_CUSTOM_VIEW_ID, (leaf) => {
			return new CustomView(leaf, this.timer, this.settings)
		})

		this.sb = new StatusBar(this.addStatusBarItem(), this.timer)
		this.sb.alterVisibility(this.settings.showStatusBar)

		this.addCommand({
			id: "toggle",
			name: "Toggle",
			callback: () => {
				this.timer.toggle()
			},
		})

		this.addCommand({
			id: "switch",
			name: "Switch",
			callback: () => {
				this.timer.switch()
			},
		})

		this.addCommand({
			id: "reset",
			name: "Reset",
			callback: () => {
				this.timer.reset()
			},
		})

		this.addSettingTab(new BetterPomodoroSettingsTab(this.app, this))
	}

	onunload() {
		// TODO:
	}

	private async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<PluginSettings>,
		)
	}

	showCustomView() {
		var { workspace } = this.app
		var leaves = workspace.getLeavesOfType(PLUGIN_CUSTOM_VIEW_ID)
		if (!leaves.length) {
			var leaf = workspace.getRightLeaf(false)
			void leaf?.setViewState({
				type: PLUGIN_CUSTOM_VIEW_ID,
				active: true,
			})
		}
	}

	hideCustomView() {
		var { workspace } = this.app
		// Detaches all leaves in case more than one was created (by mistake)
		workspace.detachLeavesOfType(PLUGIN_CUSTOM_VIEW_ID)
	}

	reflectSettingsChange(cb: (ctx: BetterPomodoroPlugin) => void) {
		cb(this)
	}

	async saveSettings() {
		await this.saveData(this.settings)
	}

	getFile(path: string) {
		var aFile = this.app.vault.getAbstractFileByPath(path)
		if (aFile instanceof TFile) {
			return this.app.vault.getResourcePath(aFile)
		}
		return ""
	}

	notify(text: string): void {
		if (this.settings.systemNotificationsPreferred) {
			systemNotify(text)
		} else {
			obsidianNotify(text)
		}
	}
}

/* eslint-disable */
function systemNotify(text: string) {
	var { Notification } = require("electron").remote

	new Notification({
		title: "Timer",
		body: text,
	}).show()
}
/* eslint-enable */

function obsidianNotify(text: string) {
	new Notice(text)
}
