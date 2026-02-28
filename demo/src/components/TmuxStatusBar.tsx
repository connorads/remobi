import type React from 'react'
import { FONT_FAMILY } from '../fonts'
import { colours } from '../theme'

export type TmuxWindow = {
	readonly index: number
	readonly name: string
	readonly active?: boolean
}

export type TmuxStatusBarProps = {
	readonly session: string
	readonly windows: readonly TmuxWindow[]
}

/** Catppuccin-green tmux status bar at the bottom of the terminal */
export const TmuxStatusBar: React.FC<TmuxStatusBarProps> = ({
	session,
	windows,
}) => {
	return (
		<div
			style={{
				background: colours.green,
				color: '#1e1e2e',
				fontFamily: `"${FONT_FAMILY}", monospace`,
				fontSize: 11,
				fontWeight: 700,
				padding: '3px 8px',
				display: 'flex',
				gap: 12,
				whiteSpace: 'pre',
				flexShrink: 0,
			}}
		>
			<span>[{session}]</span>
			{windows.map((w) => (
				<span key={w.index} style={{ fontWeight: w.active ? 700 : 400 }}>
					{w.index}:{w.name}
					{w.active ? '*' : ''}
				</span>
			))}
		</div>
	)
}
