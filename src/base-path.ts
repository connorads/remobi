export function normalizeBasePath(value: string): string | null {
	if (value.length === 0 || !value.startsWith('/')) {
		return null
	}

	if (value.includes('?') || value.includes('#')) {
		return null
	}

	if (value === '/') {
		return '/'
	}

	const trimmed = value.replace(/\/+$/g, '')
	if (trimmed.length === 0 || trimmed === '/') {
		return '/'
	}

	if (trimmed.includes('//')) {
		return null
	}

	return trimmed
}

export function joinBasePath(basePath: string, path: string): string {
	if (basePath === '/') {
		return path
	}

	if (path === '/') {
		return `${basePath}/`
	}

	return `${basePath}${path}`
}

export function documentRoute(basePath: string): string {
	return basePath === '/' ? '/' : `${basePath}/`
}

export function bareDocumentRoute(basePath: string): string | null {
	return basePath === '/' ? null : basePath
}
