import * as statusBar from "./status-bar"
import {
	BetterPomodoroSettingsTab,
	DEFAULT_SETTINGS,
	type PluginSettings,
} from "./settings"
import { CustomView, PLUGIN_CUSTOM_VIEW_ID } from "./custom-view"
import { Plugin, TFile } from "obsidian"
import { Timer } from "./timer"

export default class BetterPomodoroPlugin extends Plugin {
	settings: PluginSettings
	timer: Timer
	statusBarItem: HTMLElement
	// Needed to reflect settings
	customView: CustomView
	getFile: (path: string) => string

	async onload() {
		await this.loadSettings()

		this.getFile = (path: string) => {
			var aFile = this.app.vault.getAbstractFileByPath(path)
			if (aFile instanceof TFile) {
				return this.app.vault.getResourcePath(aFile)
			}
			return ""
		}

		this.timer = new Timer(this.settings, this.getFile)

		this.registerView(PLUGIN_CUSTOM_VIEW_ID, (leaf) => {
			this.customView = new CustomView(leaf, this.timer, this.settings)
			return this.customView
		})

		this.statusBarItem = this.addStatusBarItem()
		statusBar.build(this.statusBarItem, this.timer)
		statusBar.alterVisibility(
			this.settings.showStatusBar,
			this.statusBarItem,
		)

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
		this.timer.destroy()
	}

	private async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<PluginSettings>,
		)
	}

	loadCustomView() {
		if (this.settings.showCustomView) {
			var { workspace } = this.app
			var leaves = workspace.getLeavesOfType(PLUGIN_CUSTOM_VIEW_ID)
			if (!leaves.length) {
				var leaf = workspace.getRightLeaf(false)
				void leaf?.setViewState({
					type: PLUGIN_CUSTOM_VIEW_ID,
				})
			}
		}
	}

	hideCustomView() {
		var { workspace } = this.app
		workspace.detachLeavesOfType(PLUGIN_CUSTOM_VIEW_ID)
	}

	reflectSettingsChange(cb: (ctx: BetterPomodoroPlugin) => void) {
		cb(this)
	}

	async saveSettings() {
		await this.saveData(this.settings)
	}
}
