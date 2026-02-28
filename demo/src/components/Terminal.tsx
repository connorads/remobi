import type React from 'react'
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion'
import { FONT_FAMILY } from '../fonts'
import { colours } from '../theme'

/** A single styled span within a terminal line */
export type TerminalSpan = {
	readonly text: string
	readonly colour?: string
	readonly bold?: boolean
	readonly dim?: boolean
}

/** A line of terminal output */
export type TerminalLine = {
	readonly spans: readonly TerminalSpan[]
	/** Delay in frames before this line appears (from the start of the sequence) */
	readonly appearAt?: number
	/** If set, types out character by character starting at appearAt */
	readonly typewriter?: boolean
}

/** Complete terminal screen content */
export type TerminalScreen = {
	readonly lines: readonly TerminalLine[]
	readonly cursorAtEnd?: boolean
}

/** Fake terminal: monospace grid with coloured spans and blinking cursor */
export const Terminal: React.FC<{
	screen: TerminalScreen
	fontSize?: number
	lineHeight?: number
	padding?: number
}> = ({ screen, fontSize = 13, lineHeight = 1.5, padding = 10 }) => {
	const frame = useCurrentFrame()
	const { fps } = useVideoConfig()

	return (
		<div
			style={{
				fontFamily: `"${FONT_FAMILY}", monospace`,
				fontSize,
				lineHeight,
				color: colours.fg,
				background: colours.bg,
				padding,
				flex: 1,
				whiteSpace: 'pre',
				overflow: 'hidden',
			}}
		>
			{screen.lines.map((line, i) => {
				const appearFrame = line.appearAt ?? 0
				if (frame < appearFrame) return null

				return (
					<div key={i} style={{ minHeight: fontSize * lineHeight }}>
						{line.spans.map((span, j) => {
							let text = span.text

							// Typewriter effect
							if (line.typewriter && line.appearAt !== undefined) {
								const elapsed = frame - line.appearAt
								const charsPerFrame = 0.5
								const visibleChars = Math.floor(elapsed * charsPerFrame)
								text = span.text.slice(0, Math.max(0, visibleChars))
							}

							return (
								<span
									key={j}
									style={{
										color: span.colour ?? colours.fg,
										fontWeight: span.bold ? 700 : 400,
										opacity: span.dim ? 0.5 : 1,
									}}
								>
									{text}
								</span>
							)
						})}
						{/* Cursor at end of last line */}
						{screen.cursorAtEnd && i === screen.lines.length - 1 && (
							<BlinkingCursor fontSize={fontSize} />
						)}
					</div>
				)
			})}
		</div>
	)
}

const BlinkingCursor: React.FC<{ fontSize: number }> = ({ fontSize }) => {
	const frame = useCurrentFrame()
	// Blink every 30 frames
	const opacity = Math.floor(frame / 15) % 2 === 0 ? 1 : 0.3

	return (
		<span
			style={{
				display: 'inline-block',
				width: fontSize * 0.6,
				height: fontSize * 1.2,
				background: colours.cursor,
				opacity,
				verticalAlign: 'text-bottom',
				marginLeft: 1,
			}}
		/>
	)
}

/**
 * Terminal with slide animation — used for swipe transitions.
 * `offsetX` drives horizontal position via Remotion interpolate().
 */
export const SlidingTerminal: React.FC<{
	screen: TerminalScreen
	offsetX: number
	fontSize?: number
}> = ({ screen, offsetX, fontSize = 13 }) => {
	return (
		<div
			style={{
				position: 'absolute',
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				transform: `translateX(${offsetX}px)`,
			}}
		>
			<Terminal screen={screen} fontSize={fontSize} />
		</div>
	)
}
