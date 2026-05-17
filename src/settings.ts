import {
	type App,
	PluginSettingTab,
	Setting,
	type ToggleComponent,
} from "obsidian"
import type BetterPomodoroPlugin from "./main"
import * as statusBar from "./status-bar"

export type PluginSettings = {
	workDurationSecs: number
	breakDurationSecs: number
	systemNotificationsPreferred: boolean
	playSound: boolean
	continueAfterTimeIsUp: boolean
	showStatusBar: boolean
	showCustomView: boolean
	notificationSoundPath: string
}

export const DEFAULT_SETTINGS: PluginSettings = {
	workDurationSecs: 50 * 60,
	breakDurationSecs: 10 * 60,
	systemNotificationsPreferred: false,
	playSound: true,
	continueAfterTimeIsUp: true,
	showCustomView: true,
	showStatusBar: true,
	notificationSoundPath: "",
}

export class BetterPomodoroSettingsTab extends PluginSettingTab {
	plugin: BetterPomodoroPlugin

	constructor(app: App, plugin: BetterPomodoroPlugin) {
		super(app, plugin)
		this.plugin = plugin
	}

	display(): void {
		const { containerEl } = this

		containerEl.empty()

		new Setting(containerEl).setName("Status bar").setHeading()

		new Setting(containerEl)
			.setName("Show status bar")
			.addToggle((component: ToggleComponent) => {
				component
					.setValue(this.plugin.settings.showStatusBar)
					.onChange(async (val: boolean) => {
						this.plugin.settings.showStatusBar = val
						await this.plugin.saveSettings()

						// TODO:
						this.plugin.reflectSettingsChange((ctx) => {
							statusBar.alterVisibility(val, ctx.statusBarItem)
						})
					})
			})

		new Setting(containerEl).setName("Timer view").setHeading()

		new Setting(containerEl)
			.setName("Show custom view")
			.addToggle((component: ToggleComponent) => {
				component
					.setValue(this.plugin.settings.showCustomView)
					.onChange(async (newValue: boolean) => {
						this.plugin.settings.showCustomView = newValue
						await this.plugin.saveSettings()

						this.plugin.reflectSettingsChange((ctx) => {
							if (newValue) {
								ctx.loadCustomView()
							} else {
								ctx.hideCustomView()
							}
						})
					})
			})

		new Setting(containerEl).setName("Timer").setHeading()

		new Setting(containerEl).setName("Work duration").addText((text) => {
			text.setPlaceholder("Enter time in minutes")
				.setValue(String(this.plugin.settings.workDurationSecs / 60))
				.onChange(async (i: string) => {
					let minutes = validateNumericInput(i)
					if (minutes) {
						this.plugin.settings.workDurationSecs = minutes * 60
						await this.plugin.saveSettings()

						this.plugin.reflectSettingsChange((ctx) => {
							if (!ctx.timer.getIsRunning()) {
								ctx.timer.reset()
							}
						})
					}
				})
		})

		new Setting(containerEl).setName("Break duration").addText((text) => {
			text.setPlaceholder("Enter time in minutes")
				.setValue(String(this.plugin.settings.breakDurationSecs / 60))
				.onChange(async (i: string) => {
					let minutes = validateNumericInput(i)
					if (minutes) {
						this.plugin.settings.breakDurationSecs = minutes * 60
						await this.plugin.saveSettings()

						this.plugin.reflectSettingsChange((ctx) => {
							if (!ctx.timer.getIsRunning()) {
								ctx.timer.reset()
							}
						})
					}
				})
		})

		new Setting(containerEl)
			.setName("Continue running after time is up")
			.addToggle((component: ToggleComponent) => {
				component
					.setValue(this.plugin.settings.continueAfterTimeIsUp)
					.onChange(async (newValue: boolean) => {
						this.plugin.settings.continueAfterTimeIsUp = newValue
						await this.plugin.saveSettings()
					})
			})

		new Setting(containerEl).setName("Notifications").setHeading()

		new Setting(containerEl)
			.setName("Prefer system notification")
			.addToggle((component: ToggleComponent) => {
				component
					.setValue(this.plugin.settings.systemNotificationsPreferred)
					.onChange(async (newValue: boolean) => {
						this.plugin.settings.systemNotificationsPreferred =
							newValue
						await this.plugin.saveSettings()
					})
			})

		// TODO: "time is up" sounds weird
		new Setting(containerEl)
			.setName("Play sound when time is up")
			.addToggle((component: ToggleComponent) => {
				component
					.setValue(this.plugin.settings.playSound)
					.onChange(async (newValue: boolean) => {
						this.plugin.settings.playSound = newValue
						await this.plugin.saveSettings()
					})
			})

		// TODO: sound path
		// new Settings(containerEl)
		// 	.setName("Custom notification sound")
		// 	.setValue("")
		// 	.setPlaceholder("path to the sound")

		// TODO: add button to check the sound
	}
}

// Check if given value is a valid amount of minutes
export function validateNumericInput(i: string): false | number {
	let num = Number(i)
	if (isNaN(num)) {
		return false
	}
	return num
}
