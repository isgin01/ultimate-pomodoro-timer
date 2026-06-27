import {
	PomodoroSettingsTab,
	DEFAULT_SETTINGS,
	type PluginSettings,
} from './settings'
import { CustomView, CUSTOM_VIEW_ID } from './custom-view'
import { Plugin, TFile, WorkspaceLeaf } from 'obsidian'
import { Timer, recoverableTimerState } from './timer'
import buildStatusBarItem from './status-bar'
import { notify } from './utils'
import { playSound } from './sound'

const SAVED_SESSION_KEY = 'isgin-timer-saved-session'

export default class PomodoroPlugin extends Plugin {
	settings: PluginSettings
	timer: Timer
	statusBarItem: HTMLElement

	async onload() {
		await this.loadSettings()

		// Timer

		this.timer = new Timer(
			this.settings.modes,
			this.settings,
			this.recoverLastSession(),
		)

		this.timer.on(['elapsed'], () => {
			// TODO: Custom message template
			notify(
				this.settings.systemNotificationPreferred,
				'Time has elapsed',
			)
			// Settings can get changed during the timer run,
			// so it's important to check
			if (this.settings.playNotificationSound) {
				playSound(this.getFile(this.settings.customNotificationSound))
			}
		})

		// Widgets

		this.addSettingTab(new PomodoroSettingsTab(this.app, this))

		this.registerView(CUSTOM_VIEW_ID, leaf => {
			return new CustomView(leaf, this.timer, this.settings.CvColors)
		})

		this.statusBarItem = this.addStatusBarItem()
		buildStatusBarItem(
			this.statusBarItem,
			this.timer,
			this.settings.showStatusBar,
		)

		this.addRibbonIcon('timer', 'Show Pomodoro Timer', () => {
			this.settings.showCustomView = true
			this.saveSettings()
			this.showCustomView()
		})

		// Commands

		this.registerCommands()

		// State preservation

		this.timer.on(['tick', 'reset', 'toggle'], () => {
			this.preserveString(
				SAVED_SESSION_KEY,
				JSON.stringify(this.timer.recoverableState),
			)
		})
	}

	private async loadSettings() {
		this.settings = {
			...DEFAULT_SETTINGS,
			...((await this.loadData()) as Partial<PluginSettings>),
		}
	}

	private registerCommands(): void {
		this.addCommand({
			id: 'toggle',
			name: 'Toggle',
			callback: this.timer.toggle,
		})

		this.addCommand({
			id: 'switch',
			name: 'Switch',
			callback: this.timer.switch,
		})

		this.addCommand({
			id: 'reset',
			name: 'Reset',
			callback: this.timer.reset,
		})
	}

	interactWithStatusBar(cb: (statusBarElement: HTMLElement) => void): void {
		// It is the easiest to simply use a saved reference to the element
		cb(this.statusBarItem)
	}

	interactWithCustomView(cb: (view: CustomView) => void) {
		// Obsidian documentation forbids to manipulate references of views.
		this.app.workspace.getLeavesOfType(CUSTOM_VIEW_ID).forEach(leaf => {
			if (leaf.view instanceof CustomView) {
				cb(leaf.view)
			}
		})
	}

	async showCustomView() {
		var { workspace } = this.app

		var leaf: WorkspaceLeaf | null
		var leaves = workspace.getLeavesOfType(CUSTOM_VIEW_ID)
		if (leaves.length > 0) {
			leaf = leaves[0]!
		} else {
			leaf = workspace.getRightLeaf(false)!
			await leaf.setViewState({
				type: CUSTOM_VIEW_ID,
				active: true,
			})
		}
		workspace.revealLeaf(leaf)
	}

	hideCustomView() {
		var { workspace } = this.app
		// Detaches all leaves in case more than one was created (by mistake)
		workspace.detachLeavesOfType(CUSTOM_VIEW_ID)
	}

	async saveSettings() {
		await this.saveData(this.settings)
	}

	/* eslint-disable */
	private recoverLastSession(): recoverableTimerState | undefined {
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

	private preserveString(k: string, s: string): void {
		this.app.saveLocalStorage(k, s)
	}

	getFile(path: string) {
		var aFile = this.app.vault.getAbstractFileByPath(path)
		if (aFile instanceof TFile) {
			return this.app.vault.getResourcePath(aFile)
		}
		return ''
	}

	onunload() { }
}
