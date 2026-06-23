import { DEFAULT_SETTINGS } from '../src/settings'
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

it('initialization', () => {
	let settings = { ...DEFAULT_SETTINGS }
	settings.workSecs = 40 * 60

	var timer = new Timer(settings)
	var element = new FakeStatusBar()
	buildStatusBarElement(element, timer, true)

	expect(element.innerHTML).toBe('')
	expect(element.innerText).toBe('00:40:00')

	timer.toggle()
	expect(timer.mode).toBe('work')
	expect(timer.running).toBe(true)

	jest.advanceTimersByTime(1000 * 60)
	expect(element.innerText).toBe('00:39:00')
	jest.advanceTimersByTime(1000 * 60 * 39)
	expect(element.innerText).toBe('00:00:00')
	jest.advanceTimersByTime(1000 * 60 * 10)
	expect(element.innerText).toBe('-00:10:00')
})

it('clicks', () => {
	let settings = { ...DEFAULT_SETTINGS }
	settings.workSecs = 40 * 60

	var timer = new Timer(settings)
	var element = new FakeStatusBar()

	buildStatusBarElement(element, timer, true)

	expect(element.className).toContain('mod-clickable')

	let fakeToggle = jest.spyOn(timer, 'toggle')
	let clickEvent = new Event('click')
	element.dispatchEvent(clickEvent)
	expect(fakeToggle).toHaveBeenCalledTimes(1)
})
