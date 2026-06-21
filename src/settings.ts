import { type App, type HexString, PluginSettingTab, Setting } from "obsidian"
import type BetterPomodoroPlugin from "./main"
import { playSound } from "./sound"

export type PluginSettings = {
	workSecs: number
	breakSecs: number
	systemNotificationsPreferred: boolean
	continueAfterTimeHasElapsed: boolean
	showStatusBar: boolean
	showCustomView: boolean
	customViewColors: { remaining: HexString; elapsed: HexString }
	playNotificationSound: boolean
	customNotificationSound: string
}

export const DEFAULT_SETTINGS: PluginSettings = {
	workSecs: 50 * 60,
	breakSecs: 10 * 60,
	systemNotificationsPreferred: false,
	continueAfterTimeHasElapsed: true,
	showCustomView: true,
	showStatusBar: true,
	customViewColors: { remaining: "#ff1700", elapsed: "#06ff00" },
	playNotificationSound: true,
	customNotificationSound: "",
}

export class BetterPomodoroSettingsTab extends PluginSettingTab {
	private plugin: BetterPomodoroPlugin

	constructor(app: App, plugin: BetterPomodoroPlugin) {
		super(app, plugin)
		this.plugin = plugin
	}

	display(): void {
		const { containerEl } = this

		containerEl.empty()

		new Setting(containerEl).setName("Visibility").setHeading()

		new Setting(containerEl)
			.setName("Show status bar")
			.addToggle((component) => {
				component
					.setValue(this.plugin.settings.showStatusBar)
					.onChange(async (val: boolean) => {
						this.plugin.settings.showStatusBar = val
						await this.plugin.saveSettings()

						this.plugin.reflectSettingsChange((ctx) => {
							ctx.statusBar.alterVisibility(val)
						})
					})
			})

		new Setting(containerEl)
			.setName("Show custom view")
			.addToggle((component) => {
				component
					.setValue(this.plugin.settings.showCustomView)
					.onChange(async (newValue: boolean) => {
						this.plugin.settings.showCustomView = newValue
						await this.plugin.saveSettings()

						this.plugin.reflectSettingsChange((ctx) => {
							if (newValue) {
								ctx.showCustomView()
							} else {
								ctx.hideCustomView()
							}
							this.display()
						})
					})
			})

		// TODO: render inactive

		new Setting(containerEl).setName("Custom view").setHeading()

		new Setting(containerEl)
			.setName("Color for remaining time")
			.addColorPicker((component) => {
				component
					.setValue(this.plugin.settings.customViewColors.remaining)
					.setDisabled(!this.plugin.settings.showCustomView)
					.onChange(async (newColor: string) => {
						this.plugin.settings.customViewColors.remaining =
							newColor
						await this.plugin.saveSettings()

						this.plugin.reflectSettingsChange((ctx) => {
							ctx.hideCustomView()
							ctx.showCustomView()
						})
					})
			})

		new Setting(containerEl)
			.setName("Color for elapsed time")
			.addColorPicker((component) => {
				component
					.setValue(this.plugin.settings.customViewColors.elapsed)
					.setDisabled(!this.plugin.settings.showCustomView)
					.onChange(async (newColor: string) => {
						this.plugin.settings.customViewColors.elapsed = newColor
						await this.plugin.saveSettings()

						this.plugin.reflectSettingsChange((ctx) => {
							ctx.hideCustomView()
							ctx.showCustomView()
						})
					})
			})

		new Setting(containerEl)
			.setName("Reset colors")
			.addButton((component) => {
				component
					.setButtonText("Reset")
					.setDisabled(!this.plugin.settings.showCustomView)
					.onClick(async () => {
						this.plugin.settings.customViewColors.elapsed =
							DEFAULT_SETTINGS.customViewColors.elapsed

						this.plugin.settings.customViewColors.remaining =
							DEFAULT_SETTINGS.customViewColors.remaining

						await this.plugin.saveSettings()

						this.plugin.reflectSettingsChange((ctx) => {
							ctx.hideCustomView()
							ctx.showCustomView()
						})

						this.display()
					})
			})

		new Setting(containerEl).setName("Timer").setHeading()

		new Setting(containerEl).setName("Work duration").addText((text) => {
			text.setPlaceholder("Enter time in minutes")
				.setValue(String(this.plugin.settings.workSecs / 60))
				.onChange(async (i: string) => {
					let minutes = validateNumericInput(i)
					if (minutes) {
						this.plugin.settings.workSecs = minutes * 60
						await this.plugin.saveSettings()

						this.plugin.reflectSettingsChange((ctx) => {
							if (!ctx.timer.running) {
								ctx.timer.reset()
							}
						})
					}
				})
		})

		new Setting(containerEl).setName("Break duration").addText((text) => {
			text.setPlaceholder("Enter time in minutes")
				.setValue(String(this.plugin.settings.breakSecs / 60))
				.onChange(async (i: string) => {
					let minutes = validateNumericInput(i)
					if (minutes) {
						this.plugin.settings.breakSecs = minutes * 60
						await this.plugin.saveSettings()

						this.plugin.reflectSettingsChange((ctx) => {
							if (!ctx.timer.running) {
								ctx.timer.reset()
							}
						})
					}
				})
		})

		new Setting(containerEl)
			.setName("Continue running after time has elapsed")
			.addToggle((component) => {
				component
					.setValue(this.plugin.settings.continueAfterTimeHasElapsed)
					.onChange(async (newValue: boolean) => {
						this.plugin.settings.continueAfterTimeHasElapsed =
							newValue
						await this.plugin.saveSettings()
					})
			})

		new Setting(containerEl).setName("Notifications").setHeading()

		new Setting(containerEl)
			.setName("Prefer system notification")
			.addToggle((component) => {
				component
					.setValue(this.plugin.settings.systemNotificationsPreferred)
					.onChange(async (newValue: boolean) => {
						this.plugin.settings.systemNotificationsPreferred =
							newValue
						await this.plugin.saveSettings()
					})
			})

		new Setting(containerEl)
			.setName("Play notification sound")
			.addToggle((component) => {
				component
					.setValue(this.plugin.settings.systemNotificationsPreferred)
					.onChange(async (newValue: boolean) => {
						this.plugin.settings.systemNotificationsPreferred =
							newValue
						await this.plugin.saveSettings()
					})
			})

		new Setting(containerEl)
			.setName("Custom notification sound")
			.setDesc("A file inside your vault")
			.addButton((component) => {
				component.setButtonText("Check audio").onClick(() => {
					var sound = this.plugin.getFile(
						this.plugin.settings.customNotificationSound,
					)

					// avoid playing the default sound
					if (sound) {
						playSound(sound)
					}
				})
			})
			.addText((component) => {
				component
					.setPlaceholder("Path")
					.setValue(this.plugin.settings.customNotificationSound)
					.onChange(async (newValue: string) => {
						this.plugin.settings.customNotificationSound = newValue
						await this.plugin.saveSettings()
					})
			})
	}
}

export function validateNumericInput(i: string): false | number {
	let num = Number(i)
	if (isNaN(num)) {
		return false
	}
	return num
}
