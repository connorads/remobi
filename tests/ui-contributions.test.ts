import { describe, expect, test } from 'bun:test'
import { createUIContributionCollector } from '../src/plugins/ui-contributions'
import type { ControlButton } from '../src/types'

function btn(id: string): ControlButton {
	return { id, label: id, description: id, action: { type: 'send', data: id } }
}

describe('createUIContributionCollector', () => {
	test('returns empty array for slot with no contributions', () => {
		const collector = createUIContributionCollector()
		expect(collector.getForSlot('toolbar.row1')).toEqual([])
		expect(collector.getForSlot('toolbar.row2')).toEqual([])
		expect(collector.getForSlot('drawer')).toEqual([])
	})

	test('returns contributed button for correct slot', () => {
		const collector = createUIContributionCollector()
		const a = btn('a')
		collector.add('toolbar.row1', a)
		expect(collector.getForSlot('toolbar.row1')).toEqual([a])
		expect(collector.getForSlot('toolbar.row2')).toEqual([])
	})

	test('multiple contributions to same slot are returned in order', () => {
		const collector = createUIContributionCollector()
		const a = btn('a')
		const b = btn('b')
		collector.add('drawer', a)
		collector.add('drawer', b)
		expect(collector.getForSlot('drawer')).toEqual([a, b])
	})

	test('contributions to different slots are independent', () => {
		const collector = createUIContributionCollector()
		const a = btn('a')
		const b = btn('b')
		collector.add('toolbar.row1', a)
		collector.add('toolbar.row2', b)
		expect(collector.getForSlot('toolbar.row1')).toEqual([a])
		expect(collector.getForSlot('toolbar.row2')).toEqual([b])
	})

	test('priority ordering: lower priority appears first', () => {
		const collector = createUIContributionCollector()
		const a = btn('a')
		const b = btn('b')
		const c = btn('c')
		collector.add('drawer', b, 10)
		collector.add('drawer', c, 20)
		collector.add('drawer', a, 1)
		expect(collector.getForSlot('drawer')).toEqual([a, b, c])
	})

	test('default priority is 0', () => {
		const collector = createUIContributionCollector()
		const a = btn('a')
		const b = btn('b')
		collector.add('drawer', b, 5)
		collector.add('drawer', a) // default priority 0
		expect(collector.getForSlot('drawer')).toEqual([a, b])
	})

	test('equal priority preserves insertion order', () => {
		const collector = createUIContributionCollector()
		const a = btn('a')
		const b = btn('b')
		const c = btn('c')
		collector.add('drawer', a, 0)
		collector.add('drawer', b, 0)
		collector.add('drawer', c, 0)
		expect(collector.getForSlot('drawer')).toEqual([a, b, c])
	})

	test('getForSlot returns new array each time (immutable)', () => {
		const collector = createUIContributionCollector()
		collector.add('drawer', btn('a'))
		const first = collector.getForSlot('drawer')
		const second = collector.getForSlot('drawer')
		expect(first).not.toBe(second)
		expect(first).toEqual(second)
	})

	test('plugin contributes button via context.ui', () => {
		const collector = createUIContributionCollector()
		const myButton = btn('my-btn')

		// Simulate plugin using the context
		const pluginSetup = (ui: typeof collector) => {
			ui.add('toolbar.row2', myButton)
		}
		pluginSetup(collector)

		expect(collector.getForSlot('toolbar.row2')).toEqual([myButton])
	})
})
