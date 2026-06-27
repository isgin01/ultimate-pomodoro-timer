import { type App, PluginSettingTab, Setting } from 'obsidian'
import type PomodoroPlugin from './main'
import { playSound } from './sound'
import { CvColors } from 'custom-view'
import { alterVisibility, notify, isProperNumber } from './utils'
import { Mode } from './timer'

export type PluginSettings = {
	modes: Mode[]
	systemNotificationPreferred: boolean
	keepRunning: boolean
	autostart: boolean
	showStatusBar: boolean
	showCustomView: boolean
	CvColors: CvColors
	playNotificationSound: boolean
	customNotificationSound: string
}

export const DEFAULT_SETTINGS: PluginSettings = {
	// TODO: is it really needed?
	// Use get to avoid the array from being used as a reference
	get modes() {
		return [
			{ name: 'work', secs: 50 * 60 },
			{ name: 'break', secs: 10 * 60 },
			{ name: 'work', secs: 50 * 60 },
			{ name: 'break', secs: 10 * 60 },
			{ name: 'work', secs: 50 * 60 },
			{ name: 'break', secs: 10 * 60 },
			{ name: 'work', secs: 50 * 60 },
			{ name: 'long', secs: 20 * 60 },
		]
	},
	systemNotificationPreferred: false,
	autostart: false,
	keepRunning: true,
	showCustomView: false,
	showStatusBar: true,
	CvColors: { remaining: '#ff1700', elapsed: '#06ff00' },
	playNotificationSound: true,
	customNotificationSound: '',
}

export class PomodoroSettingsTab extends PluginSettingTab {
	private plugin: PomodoroPlugin
	private settings: PluginSettings

	constructor(app: App, plugin: PomodoroPlugin) {
		super(app, plugin)
		this.plugin = plugin
		this.settings = plugin.settings
	}

	display(): void {
		const { containerEl } = this

		containerEl.empty()

		new Setting(containerEl).setName('Visibility').setHeading()

		new Setting(containerEl)
			.setName('Show status bar')
			.addToggle(component => {
				component
					.setValue(this.settings.showStatusBar)
					.onChange(async (val: boolean) => {
						this.settings.showStatusBar = val
						await this.plugin.saveSettings()

						this.plugin.interactWithStatusBar(el => {
							alterVisibility(el, val)
						})
					})
			})

		new Setting(containerEl)
			.setName('Show custom view')
			.addToggle(component => {
				component
					.setValue(this.settings.showCustomView)
					.onChange(async (newValue: boolean) => {
						this.settings.showCustomView = newValue
						await this.plugin.saveSettings()

						if (newValue) {
							this.plugin.showCustomView()
						} else {
							this.plugin.hideCustomView()
						}
						this.display()
					})
			})

		new Setting(containerEl)
			.setName('Custom view')
			.setHeading()
			.setDisabled(!this.plugin.showCustomView)

		new Setting(containerEl)
			.setName('Color for remaining time')
			.addColorPicker(component => {
				component
					.setValue(this.settings.CvColors.remaining)
					.setDisabled(!this.settings.showCustomView)
					.onChange(async (newColor: string) => {
						this.settings.CvColors.remaining = newColor
						await this.plugin.saveSettings()

						this.plugin.interactWithCustomView(view =>
							view.setRemainingCircleColor(
								this.settings.CvColors.remaining,
							),
						)
					})
			})

		new Setting(containerEl)
			.setName('Color for elapsed time')
			.addColorPicker(component => {
				component
					.setValue(this.settings.CvColors.elapsed)
					.setDisabled(!this.settings.showCustomView)
					.onChange(async (newColor: string) => {
						this.settings.CvColors.elapsed = newColor
						await this.plugin.saveSettings()

						this.plugin.interactWithCustomView(view =>
							view.setElapsedCircleColor(
								this.settings.CvColors.elapsed,
							),
						)
					})
			})

		new Setting(containerEl)
			.setName('Reset colors')
			.addButton(component => {
				component
					.setButtonText('Reset')
					.setDisabled(!this.settings.showCustomView)
					.onClick(async () => {
						this.settings.CvColors.elapsed =
							DEFAULT_SETTINGS.CvColors.elapsed

						this.settings.CvColors.remaining =
							DEFAULT_SETTINGS.CvColors.remaining

						await this.plugin.saveSettings()

						this.plugin.interactWithCustomView(view => {
							view.setRemainingCircleColor(
								this.settings.CvColors.remaining,
							)
							view.setElapsedCircleColor(
								this.settings.CvColors.elapsed,
							)
						})

						this.display()
					})
			})

		new Setting(containerEl).setName('Timer').setHeading()

		new Setting(containerEl)
			.setName('Continue running after time has elapsed')
			.addToggle(component => {
				component
					.setValue(this.settings.keepRunning)
					.setDisabled(this.settings.autostart)
					.onChange((newValue: boolean) => {
						this.settings.keepRunning = !newValue
						void this.plugin.saveSettings()
						this.display()
					})
			})

		new Setting(containerEl).setName('Autostart').addToggle(component => {
			component
				.setValue(this.settings.autostart)
				.setDisabled(this.settings.keepRunning)
				.onChange((value: boolean) => {
					this.settings.autostart = value
					void this.plugin.saveSettings()
					this.display()
				})
		})

		new Setting(containerEl).setName('Notifications').setHeading()

		new Setting(containerEl)
			.setName('Prefer system notification')
			.addToggle(component => {
				component
					.setValue(this.settings.systemNotificationPreferred)
					.onChange(async (newValue: boolean) => {
						this.settings.systemNotificationPreferred = newValue
						await this.plugin.saveSettings()
					})
			})

		new Setting(containerEl)
			.setName('Play notification sound')
			.addToggle(component => {
				component
					.setValue(this.settings.systemNotificationPreferred)
					.onChange(async (newValue: boolean) => {
						this.settings.systemNotificationPreferred = newValue
						await this.plugin.saveSettings()
					})
			})

		new Setting(containerEl)
			.setName('Custom notification sound')
			.setDesc('A file inside your vault')
			.addButton(component => {
				component.setButtonText('Check audio').onClick(() => {
					var sound = this.plugin.getFile(
						this.settings.customNotificationSound,
					)

					// avoid playing the default sound
					if (sound) {
						playSound(sound)
					}
				})
			})
			.addText(component => {
				component
					.setPlaceholder('Path')
					.setValue(this.settings.customNotificationSound)
					.onChange(async s => {
						this.settings.customNotificationSound = s
						await this.plugin.saveSettings()
					})
			})

		new Setting(containerEl).setName('Modes').setHeading()

		// Define a variable outside the setting scope in order to use it in the saving cb
		let tempValue = this.settings.modes.map(m => m.name).join(',')
		new Setting(containerEl)
			.setName('Mode sequence')
			.setDesc('Manage duration below after saving')
			.addTextArea(component => {
				component
					.setPlaceholder('work,break,work,break,long')
					.setValue(tempValue)
					.onChange(s => {
						tempValue = s
					})
			})
			.addButton(component => {
				component.setButtonText('Save').onClick(() => {
					let modeNames = tempValue
						.split(',')
						.map(s => s.trim().toLowerCase())
						.filter(v => v.length > 0)

					if (modeNames.length > 0) {
						this.settings.modes = modeNames.map(s => {
							let duration = this.settings.modes.find(
								m => m.name === s,
							)
							return {
								name: s,
								secs: duration ? duration.secs : 0,
							}
						})
						this.plugin.saveSettings()
						this.plugin.timer.setModes(this.settings.modes)
						this.display()
					} else {
						notify(
							this.settings.systemNotificationPreferred,
							'Malformed input; unsaved',
						)
					}
				})
			})

		this.settings.modes
			// Filter out non-unique values
			.filter(
				(current, idx, arr) =>
					arr.findIndex(
						firstEncountered =>
							firstEncountered.name == current.name,
					) == idx,
			)
			.forEach(m1 => {
				new Setting(containerEl)
					.setName(
						// Capitalize
						`${m1.name.charAt(0).toUpperCase() + m1.name.slice(1)} duration`,
					)
					.addText(text => {
						text.setPlaceholder('Enter time in minutes')
							.setValue(String(m1.secs / 60))
							.onChange(async (i: string) => {
								let minutes = isProperNumber(i)
								if (minutes) {
									let secs = minutes * 60

									// Find each mode with this name and change its seconds count
									this.settings.modes.map(m2 => {
										return m2.name == m1.name
											? (m2.secs = secs)
											: m1.secs
									})

									await this.plugin.saveSettings()
									this.plugin.timer.setModes(
										this.settings.modes,
									)
								}
							})
					})
			})

		new Setting(containerEl)
			.setName('Reset mode settings')
			.setDesc(
				`Be careful because using this button would reset all your preferences related
				to modes to default values`,
			)
			.addButton(component => {
				component.setButtonText('Reset').onClick(() => {
					this.settings.modes = DEFAULT_SETTINGS.modes
					this.plugin.saveSettings()
					this.plugin.timer.setModes(this.settings.modes)
					this.display()
				})
			})
	}
}
