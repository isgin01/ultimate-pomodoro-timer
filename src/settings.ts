import { type App, PluginSettingTab, Setting } from 'obsidian'
import type BetterPomodoroPlugin from './main'
import { playSound } from './sound'
import { CvColors } from 'custom-view'
import { alterVisibility } from './utils'

export type PluginSettings = {
	workSecs: number
	breakSecs: number
	systemNotificationsPreferred: boolean
	continueAfterTimeHasElapsed: boolean
	autostart: boolean
	showStatusBar: boolean
	showCustomView: boolean
	CvColors: CvColors
	playNotificationSound: boolean
	customNotificationSound: string
}

export const DEFAULT_SETTINGS: PluginSettings = {
	workSecs: 50 * 60,
	breakSecs: 10 * 60,
	systemNotificationsPreferred: false,
	autostart: false,
	continueAfterTimeHasElapsed: true,
	showCustomView: false,
	showStatusBar: true,
	CvColors: { remaining: '#ff1700', elapsed: '#06ff00' },
	playNotificationSound: true,
	customNotificationSound: '',
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

		new Setting(containerEl).setName('Visibility').setHeading()

		new Setting(containerEl)
			.setName('Show status bar')
			.addToggle((component) => {
				component
					.setValue(this.plugin.settings.showStatusBar)
					.onChange(async (val: boolean) => {
						this.plugin.settings.showStatusBar = val
						await this.plugin.saveSettings()

						this.plugin.reflectSettingsChange((ctx) => {
							ctx.interactWithStatusBar((el) => {
								alterVisibility(el, val)
							})
						})
					})
			})

		new Setting(containerEl)
			.setName('Show custom view')
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

		new Setting(containerEl)
			.setName('Custom view')
			.setHeading()
			.setDisabled(!this.plugin.showCustomView)

		new Setting(containerEl)
			.setName('Color for remaining time')
			.addColorPicker((component) => {
				component
					.setValue(this.plugin.settings.CvColors.remaining)
					.setDisabled(!this.plugin.settings.showCustomView)
					.onChange(async (newColor: string) => {
						this.plugin.settings.CvColors.remaining = newColor
						await this.plugin.saveSettings()

						this.plugin.reflectSettingsChange((ctx) => {
							ctx.interactWithCustomView((view) =>
								view.setRemainingCircleColor(
									this.plugin.settings.CvColors.remaining,
								),
							)
						})
					})
			})

		new Setting(containerEl)
			.setName('Color for elapsed time')
			.addColorPicker((component) => {
				component
					.setValue(this.plugin.settings.CvColors.elapsed)
					.setDisabled(!this.plugin.settings.showCustomView)
					.onChange(async (newColor: string) => {
						this.plugin.settings.CvColors.elapsed = newColor
						await this.plugin.saveSettings()

						this.plugin.reflectSettingsChange((ctx) => {
							ctx.interactWithCustomView((view) =>
								view.setElapsedCircleColor(
									this.plugin.settings.CvColors.elapsed,
								),
							)
						})
					})
			})

		new Setting(containerEl)
			.setName('Reset colors')
			.addButton((component) => {
				component
					.setButtonText('Reset')
					.setDisabled(!this.plugin.settings.showCustomView)
					.onClick(async () => {
						this.plugin.settings.CvColors.elapsed =
							DEFAULT_SETTINGS.CvColors.elapsed

						this.plugin.settings.CvColors.remaining =
							DEFAULT_SETTINGS.CvColors.remaining

						await this.plugin.saveSettings()

						this.plugin.reflectSettingsChange((ctx) => {
							ctx.interactWithCustomView((view) => {
								view.setRemainingCircleColor(
									this.plugin.settings.CvColors.remaining,
								)
								view.setElapsedCircleColor(
									this.plugin.settings.CvColors.elapsed,
								)
							})
						})

						this.display()
					})
			})

		new Setting(containerEl).setName('Timer').setHeading()

		new Setting(containerEl).setName('Work duration').addText((text) => {
			text.setPlaceholder('Enter time in minutes')
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

		new Setting(containerEl).setName('Break duration').addText((text) => {
			text.setPlaceholder('Enter time in minutes')
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
			.setName('Continue running after time has elapsed')
			.addToggle((component) => {
				component
					.setValue(this.plugin.settings.continueAfterTimeHasElapsed)
					.setDisabled(this.plugin.settings.autostart)
					.onChange((newValue: boolean) => {
						this.plugin.settings.continueAfterTimeHasElapsed =
							newValue
						void this.plugin.saveSettings()
						this.display()
					})
			})

		new Setting(containerEl)
			.setName('Autostart after timer has elapsed')
			.addToggle((component) => {
				component
					.setValue(this.plugin.settings.autostart)
					.setDisabled(
						this.plugin.settings.continueAfterTimeHasElapsed,
					)
					.onChange((value: boolean) => {
						this.plugin.settings.autostart = value
						void this.plugin.saveSettings()
						this.display()
					})
			})

		new Setting(containerEl).setName('Notifications').setHeading()

		new Setting(containerEl)
			.setName('Prefer system notification')
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
			.setName('Play notification sound')
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
			.setName('Custom notification sound')
			.setDesc('A file inside your vault')
			.addButton((component) => {
				component.setButtonText('Check audio').onClick(() => {
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
					.setPlaceholder('Path')
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
