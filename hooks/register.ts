import type { Register, ThemeSetArgs } from 'claude-code'

import { makeColors } from './make-colors.js'

// Light = cream paper, dark = warm charcoal. Terracotta leads, purple for "pro".
const { theme, problems } = makeColors({
  label: 'Claude Cream',
  roles: { accent: '#D97757', danger: '#C15F3C', success: '#788C5D', warning: '#B16803', pro: '#8B6CB0' },
  light: {
    gray: {
      anchors: {
        // One color for the sidebar, the chat and the side panels.
        'surface-0': '#FAF8F3',
        'surface-1': '#FAF8F3',
        'surface-2': '#FAF8F3',
        'text-primary': '#141413',
        'text-secondary': '#3D3D3A',
        'text-muted': '#6B6963',
      },
    },
    git: { added: '#5A6E42', removed: '#A34A2B', modified: '#8F5502', merged: '#71539A' },
  },
  dark: {
    roles: { danger: '#D97757', success: '#8FA86B', warning: '#D4952B', pro: '#A080C8' },
    gray: {
      anchors: {
        // One color for the sidebar, the chat and the side panels; menus a step lighter.
        'surface-0': '#262624',
        'surface-1': '#262624',
        'surface-2': '#262624',
        'surface-3': '#2B2B29',
        'text-primary': '#F0EEE6',
        'text-secondary': '#CFCDC4',
        'text-muted': '#B0AEA5',
      },
    },
  },
})

const LOOK: ThemeSetArgs = { colors: theme }

// The choice is kept in $.store, so it lasts across sessions. On by default.
async function isOn($: { store: { get(key: string): Promise<unknown> } }): Promise<boolean> {
  return (await $.store.get('enabled')) !== false
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'cream',
      description: 'Toggle the Claude Cream theme (or: /cream on, /cream off)',
    })
    if (await isOn($)) {
      const unpainted = problems.find(line => line.startsWith("Desktop won't paint"))
      if (unpainted !== undefined) {
        $.ui.toast(unpainted)
      }
      const set = await $.theme.set(LOOK)
      if (!set.isDrawn) {
        $.ui.status(set.reason)
      }
    }
    return next(e)
  })

  on('command.run', { command: 'cream' }, async ($, e) => {
    const arg = String(e.args ?? '').trim().toLowerCase()
    const want = arg === 'on' ? true : arg === 'off' ? false : !(await isOn($))
    await $.store.set('enabled', want)
    if (want) {
      await $.theme.set(LOOK)
      return { text: 'Claude Cream theme on.' }
    }
    await $.theme.clear()
    return { text: 'Default theme restored.' }
  })
}
