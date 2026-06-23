import { WorkspaceLeaf } from 'obsidian'
import { CustomView } from '../src/custom-view'
import { Timer } from '../src/timer'
import { DEFAULT_SETTINGS } from '../src/settings'

test('init', () => {
	var timer = new Timer(DEFAULT_SETTINGS)
	var v = new CustomView(
		{} as WorkspaceLeaf,
		timer,
		DEFAULT_SETTINGS.CvColors,
	)

	expect(v.getDisplayText()).toBe('Pomodoro timer view')
	expect(v.getViewType()).toBe('isgin-pomodoro-timer-view')
	expect(v.icon).toBe('timer')
	expect(timer.running).toBe(false)
})
