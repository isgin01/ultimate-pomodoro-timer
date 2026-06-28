import { CUSTOM_VIEW_ID, CustomView } from './custom-view'
import {
	DEFAULT_SETTINGS,
	type PluginSettings,
	PomodoroSettingsTab,
} from './settings'
import { Plugin, TFile, WorkspaceLeaf } from 'obsidian'
import { Timer, recoverableTimerState } from './timer'
import buildStatusBarItem from './status-bar'
import { notify } from './utils'
import { playSound } from './sound'

const SAVED_SESSION_KEY = 'ultimate-pomodoro-saved-session'

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
				playSound(this.getFile(this.settings.notificationSoundPath))
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

		this.addRibbonIcon('timer', 'Toggle timer view', () => {
			if (this.settings.showCustomView) {
				this.settings.showCustomView = false
				void this.saveSettings()
				this.hideCustomView()
			} else {
				this.settings.showCustomView = true
				void this.saveSettings()
				void this.showCustomView()
			}
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
			callback: () => this.timer.toggle(),
		})

		this.addCommand({
			id: 'switch',
			name: 'Switch',
			callback: () => this.timer.switch(),
		})

		this.addCommand({
			id: 'reset',
			name: 'Reset',
			callback: () => this.timer.reset(),
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
		void workspace.revealLeaf(leaf)
	}

	hideCustomView(): void {
		var { workspace } = this.app
		// Detaches all leaves in case more than one was created (by mistake)
		workspace.detachLeavesOfType(CUSTOM_VIEW_ID)
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings)
	}

	private recoverLastSession(): recoverableTimerState | undefined {
		let res: string | null = this.retrieveStored(SAVED_SESSION_KEY)
		if (res) {
			return JSON.parse(res) as recoverableTimerState
		}
		return
	}

	private retrieveStored(k: string): string | null {
		return this.app.loadLocalStorage(k) as string | null
	}

	private preserveString(k: string, s: string): void {
		this.app.saveLocalStorage(k, s)
	}

	getFile(path: string): string {
		var aFile = this.app.vault.getAbstractFileByPath(path)
		if (aFile instanceof TFile) {
			return this.app.vault.getResourcePath(aFile)
		}
		return ''
	}

	onunload() {
		this.timer.unload()
	}
}
