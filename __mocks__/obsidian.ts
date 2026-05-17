export class Notice {}
export class Menu {
	addItem() {}
	showAtMouseEvent() {}
}
export class ItemView {
	public containerEl: any

	constructor() {
		// return mock funcs returning reference to the object itself;
		// used to simulate DOM manipulations
		let mock: any = {
			empty: jest.fn(() => mock),
			createDiv: jest.fn(() => mock),
			createSpan: jest.fn(() => mock),
			createSvg: jest.fn(() => mock),
			createEl: jest.fn(() => mock),
			addEventListener: jest.fn(() => mock),
		}

		this.containerEl = mock
	}
}
export class PluginSettingTab {}
export function setIcon() {}
