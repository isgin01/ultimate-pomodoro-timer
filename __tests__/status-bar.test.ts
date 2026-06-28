import buildStatusBarElement from '../src/status-bar'
import { Timer } from '../src/timer'

class FakeStatusBar extends HTMLElement {
	constructor() {
		super()
	}

	setCssProps() {}
}

jest.useFakeTimers()

window.customElements.define('fake-status-bar', FakeStatusBar)

var timerModes = [
	{ name: 'work', secs: 50 * 60 },
	{ name: 'break', secs: 10 * 60 },
]

var timerParams = {
	keepRunning: true,
	autostart: false,
}
it('initialization', () => {
	var timer = new Timer(timerModes, timerParams)
	var element = new FakeStatusBar()
	buildStatusBarElement(element, timer, true)

	expect(element.innerHTML).toBe('')
	expect(element.innerText).toBe('00:50:00')

	timer.toggle()
	expect(timer.currentMode.name).toBe('work')
	expect(timer.running).toBe(true)

	jest.advanceTimersByTime(1000 * 60)
	expect(element.innerText).toBe('00:49:00')
	jest.advanceTimersByTime(1000 * 60 * 49)
	expect(element.innerText).toBe('00:00:00')
	jest.advanceTimersByTime(1000 * 60 * 10)
	expect(element.innerText).toBe('-00:10:00')
})

it('clicks', () => {
	var timer = new Timer(timerModes, timerParams)
	var element = new FakeStatusBar()

	buildStatusBarElement(element, timer, true)

	expect(element.className).toContain('mod-clickable')

	let fakeToggle = jest.spyOn(timer, 'toggle')
	let clickEvent = new Event('click')
	element.dispatchEvent(clickEvent)
	expect(fakeToggle).toHaveBeenCalledTimes(1)
})
