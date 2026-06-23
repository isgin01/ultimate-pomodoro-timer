import {
	BetterPomodoroSettingsTab,
	DEFAULT_SETTINGS,
	type PluginSettings,
} from "./settings"
import { CustomView, PLUGIN_CUSTOM_VIEW_ID } from "./custom-view"
import { Plugin, TFile } from "obsidian"
import { Timer, recoverableTimerState } from "./timer"
import StatusBar from "./status-bar"
import { notify } from "utils"
import { playSound } from "./sound"

const SAVED_SESSION_KEY = "isgin-timer-saved-session"

export default class BetterPomodoroPlugin extends Plugin {
	settings: PluginSettings
	timer: Timer
	statusBar: StatusBar

	async onload() {
		await this.loadSettings()

		// Timer

		this.timer = new Timer(this.settings, this.recoverLastSession())

		this.timer.registerEventHandler("elapsed", () => {
			// Settings can get changed during the timer run,
			// so it's important to check
			if (this.settings.playNotificationSound) {
				playSound(this.getFile(this.settings.customNotificationSound))
			}
		})

		// TODO: Custom message template
		this.timer.registerEventHandler("elapsed", () => {
			notify(
				this.settings.systemNotificationsPreferred,
				`Time has elapsed`,
			)
		})

		// Widgets

		this.addSettingTab(new BetterPomodoroSettingsTab(this.app, this))

		this.registerView(PLUGIN_CUSTOM_VIEW_ID, (leaf) => {
			return new CustomView(leaf, this.timer, this.settings)
		})

		this.statusBar = new StatusBar(
			this.addStatusBarItem(),
			this.timer,
			this.settings.showStatusBar,
		)

		// Commands

		this.registerCommands()

		this.app.workspace.on("quit", () => {
			this.saveTimerSession(this.timer.recoverableState)
		})
	}

	private registerCommands() {
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
	}

	unload() { }

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

	/* eslint-disable */
	recoverLastSession(): recoverableTimerState | undefined {
		let res = this.retrieveStored(SAVED_SESSION_KEY)
		if (res) {
			return JSON.parse(res)
		}
		return
	}
	/* eslint-enable */

	/* eslint-disable */
	private retrieveStored(k: string): any | null {
		return this.app.loadLocalStorage(k)
	}
	/* eslint-enable */

	saveTimerSession(s: recoverableTimerState): void {
		console.log("save session")
		this.saveArbitrary(SAVED_SESSION_KEY, JSON.stringify(s))
	}

	private saveArbitrary(k: string, s: string): void {
		this.app.saveLocalStorage(k, s)
	}

	getFile(path: string) {
		var aFile = this.app.vault.getAbstractFileByPath(path)
		if (aFile instanceof TFile) {
			return this.app.vault.getResourcePath(aFile)
		}
		return ""
	}
}
