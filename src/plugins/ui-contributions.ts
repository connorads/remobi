import type { ControlButton } from '../types'

/** Slots where plugins can contribute UI buttons */
export type UISlot = 'toolbar.row1' | 'toolbar.row2' | 'drawer'

interface Contribution {
	readonly button: ControlButton
	readonly priority: number
}

/** Collects UI button contributions from plugins, sorted by priority */
export interface UIContributionCollector {
	/** Contribute a button to a slot. Lower priority values appear first (default 0). */
	add(slot: UISlot, button: ControlButton, priority?: number): void
	/** Get contributions for a slot, sorted by priority ascending */
	getForSlot(slot: UISlot): readonly ControlButton[]
}

export function createUIContributionCollector(): UIContributionCollector {
	const contributions = new Map<UISlot, Contribution[]>()

	function add(slot: UISlot, button: ControlButton, priority = 0): void {
		const existing = contributions.get(slot)
		if (existing) {
			existing.push({ button, priority })
		} else {
			contributions.set(slot, [{ button, priority }])
		}
	}

	function getForSlot(slot: UISlot): readonly ControlButton[] {
		const list = contributions.get(slot)
		if (!list || list.length === 0) {
			return []
		}
		return list
			.slice()
			.sort((a, b) => a.priority - b.priority)
			.map((c) => c.button)
	}

	return { add, getForSlot }
}
