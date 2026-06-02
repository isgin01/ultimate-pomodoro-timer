import { WorkspaceLeaf } from "obsidian"
import { CustomView } from "../src/custom-view"
import { Timer } from "../src/timer"
import { DEFAULT_SETTINGS } from "../src/settings"

it("init", () => {
	var timer = new Timer(DEFAULT_SETTINGS, jest.fn())
	var v = new CustomView({} as WorkspaceLeaf, timer, DEFAULT_SETTINGS)

	expect(v.getDisplayText()).toBe("Xxx pomodoro view")
	expect(v.getViewType()).toBe("xxx-pomodoro-view")
	expect(v.icon).toBe("timer")
	expect(timer.getIsRunning()).toBe(false)
})
