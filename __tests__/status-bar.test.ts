import { DEFAULT_SETTINGS } from "../src/settings"
import { buildStatusBar } from "../src/status-bar"
import { Timer, type updateCallback } from "../src/timer"

// http://stackoverflow.com/questions/61881027/ddg#61883392
class MyTestElement extends HTMLElement {
	constructor() {
		super()
	}
}

jest.useFakeTimers()

window.customElements.define("my-test-element", MyTestElement)

var timer = new Timer(DEFAULT_SETTINGS, jest.fn())
var statusBarHTMLElement = new MyTestElement()
var statusBar = buildStatusBar(statusBarHTMLElement, timer)

it.only("default time displaying", () => {
	expect(statusBarHTMLElement.innerHTML).toContain("<span>00:50:00</span>")

	timer.toggle()
	expect(timer.getCurrentMode()).toBe("work")
	expect(timer.getIsRunning()).toBe(true)

	jest.advanceTimersByTime(1000 * 60)
	expect(statusBarHTMLElement.innerHTML).toContain("<span>00:49:00</span>")
	jest.advanceTimersByTime(1000 * 60 * 49)
	expect(statusBarHTMLElement.innerHTML).toContain("<span>00:00:00</span>")
	jest.advanceTimersByTime(1000 * 60 * 10)
	expect(statusBarHTMLElement.innerHTML).toContain("<span>-00:10:00</span>")
})

describe("updating", () => {
	it("correctly register on tick updaters", () => {
		var timeUpdateHandlers: updateCallback[] = []

		timer = {
			...timer,
			registerUpdateCallback: jest.fn(
				(timeUpdateHandler: updateCallback) => {
					timeUpdateHandlers.push(timeUpdateHandler)
				},
			),
		}

		buildStatusBar(statusBarHTMLElement, timer as any)
		expect(timer.registerUpdateCallback).toHaveBeenCalled()
		expect(timeUpdateHandlers).toHaveLength(1)
	})

	it("update time", () => {
		var onTickTestCallback: updateCallback = () => { }

		var registerUpdateCallback = jest.fn((newUpdater: updateCallback) => {
			onTickTestCallback = newUpdater
		})

		timer = {
			...timer,
			registerUpdateCallback,
		}

		buildStatusBar(statusBarHTMLElement, timer as any)

		HFTime = "00:00:00"
		onTickTestCallback(HFTime)
		expect(statusBarHTMLElement.innerHTML).toContain(HFTime)

		HFTime = "11:11:11"
		onTickTestCallback(HFTime)
		expect(statusBarHTMLElement.innerHTML).toContain(HFTime)

		HFTime = "-11:11:11"
		onTickTestCallback(HFTime)
		expect(statusBarHTMLElement.innerHTML).toContain(HFTime)
	})
})

describe("interactions", () => {
	it("check if clickable", () => {
		buildStatusBar(statusBarHTMLElement, timer as any)

		let indicatorThatElementIsClickable = "mod-clickable"
		console.log(statusBarHTMLElement)
		expect(statusBarHTMLElement.className).toContain(
			indicatorThatElementIsClickable,
		)
	})

	it("regular and auxiliary click interaction", () => {
		timer = {
			...timer,
			toggle: jest.fn(),
			reset: jest.fn(),
		}
		buildStatusBar(statusBarHTMLElement, timer as any)

		let clickEvent = new Event("click")
		statusBarHTMLElement.dispatchEvent(clickEvent)
		// Must be called once
		expect(timer.toggle).toHaveBeenCalledTimes(1)

		let auxiliaryClickEvent = new Event("auxclick")
		statusBarHTMLElement.dispatchEvent(auxiliaryClickEvent)
		// TODO: ensure that addItem is called twice or something
		// expect(timer.reset).toHaveBeenCalledTimes(1);
	})
})
