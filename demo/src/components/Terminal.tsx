import type React from 'react'
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion'
import { FONT_FAMILY } from '../fonts'
import { claude, colours } from '../theme'

/** A single styled span within a terminal line */
export type TerminalSpan = {
	readonly text: string
	readonly colour?: string
	readonly bold?: boolean
	readonly dim?: boolean
	/** Background colour — used for diff line highlighting */
	readonly background?: string
	/** If set, types out character by character (tracked per-span with cumulative offset) */
	readonly typewriter?: boolean
}

/** A line of terminal output */
export type TerminalLine = {
	readonly spans: readonly TerminalSpan[]
	/** Delay in frames before this line appears (from the start of the sequence) */
	readonly appearAt?: number
	/** Oscillates text colour between terracotta and terracottaLight (for "Thinking..." lines) */
	readonly shimmer?: boolean
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
					<TerminalLineRow
						// biome-ignore lint/suspicious/noArrayIndexKey: static terminal lines
						key={i}
						line={line}
						isLast={i === screen.lines.length - 1}
						cursorAtEnd={screen.cursorAtEnd ?? false}
						fontSize={fontSize}
						lineHeight={lineHeight}
					/>
				)
			})}
		</div>
	)
}

/** Single terminal line with stagger animation, shimmer, and span-level typewriter */
const TerminalLineRow: React.FC<{
	line: TerminalLine
	isLast: boolean
	cursorAtEnd: boolean
	fontSize: number
	lineHeight: number
}> = ({ line, isLast, cursorAtEnd, fontSize, lineHeight }) => {
	const frame = useCurrentFrame()
	const appearFrame = line.appearAt ?? 0

	// Line stagger: 3-frame fade-in + 6px slide-up
	const age = frame - appearFrame
	const staggerOpacity = interpolate(age, [0, 3], [0, 1], { extrapolateRight: 'clamp' })
	const staggerY = interpolate(age, [0, 3], [6, 0], { extrapolateRight: 'clamp' })

	// Shimmer: oscillate between terracotta and terracottaLight
	const shimmerColour = line.shimmer
		? interpolateColour(frame, claude.terracotta, claude.terracottaLight, 40)
		: undefined

	return (
		<div
			style={{
				minHeight: fontSize * lineHeight,
				opacity: staggerOpacity,
				transform: `translateY(${staggerY}px)`,
			}}
		>
			{line.spans.map((span, j) => {
				let text = span.text

				// Span-level typewriter: type from 0 relative to the line's appearAt
				if (span.typewriter && line.appearAt !== undefined) {
					const elapsed = frame - line.appearAt
					const charsPerFrame = 0.5
					const visibleChars = Math.floor(elapsed * charsPerFrame)
					text = span.text.slice(0, Math.max(0, visibleChars))
				}

				const colour = shimmerColour ?? span.colour ?? colours.fg

				return (
					<span
						// biome-ignore lint/suspicious/noArrayIndexKey: static terminal spans
						key={j}
						style={{
							color: colour,
							fontWeight: span.bold ? 700 : 400,
							opacity: span.dim ? 0.5 : 1,
							background: span.background,
						}}
					>
						{text}
					</span>
				)
			})}
			{/* Cursor at end of last line */}
			{cursorAtEnd && isLast && <BlinkingCursor fontSize={fontSize} />}
		</div>
	)
}

/** Interpolate between two colours using a sine wave */
function interpolateColour(
	frame: number,
	colourA: string,
	colourB: string,
	period: number,
): string {
	const t = (Math.sin((frame / period) * Math.PI * 2) + 1) / 2
	const [rA, gA, bA] = parseRgb(colourA)
	const [rB, gB, bB] = parseRgb(colourB)
	const r = Math.round(rA + (rB - rA) * t)
	const g = Math.round(gA + (gB - gA) * t)
	const b = Math.round(bA + (bB - bA) * t)
	return `rgb(${r},${g},${b})`
}

function parseRgb(rgb: string): [number, number, number] {
	const match = rgb.match(/(\d+),\s*(\d+),\s*(\d+)/)
	if (!match) return [255, 255, 255]
	return [Number(match[1]), Number(match[2]), Number(match[3])]
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
