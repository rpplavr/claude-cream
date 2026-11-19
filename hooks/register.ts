import type { EngineInterface, Register, ThemeSetArgs } from 'claude-code'

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

// A flat ground in the page color, so the frosted sidebar and panels match the chat.
const LOOK: ThemeSetArgs = { colors: theme, backdrop: { color: 'surface-0' } }

// The choice is kept in $.store, so it lasts across sessions. On by default.
async function isOn($: EngineInterface): Promise<boolean> {
  return (await $.store.get('enabled')) !== false
}

// Sets the look. No status note when it is not drawn (a session with no app attached says so for good);
// the status call clears any note an earlier version left.
async function applyLook($: EngineInterface): Promise<void> {
  await $.theme.set(LOOK)
  $.ui.status(undefined)
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
      await applyLook($)
    }
    return next(e)
  })

  // A session started before any app attached: paint it once one does, and drop the "not drawn" note.
  on('session.attach', async ($, e, next) => {
    const result = await next(e)
    if (await isOn($)) {
      await applyLook($)
    }
    return result
  })

  on('command.run', { command: 'cream' }, async ($, e) => {
    const arg = String(e.args ?? '').trim().toLowerCase()
    const want = arg === 'on' ? true : arg === 'off' ? false : !(await isOn($))
    await $.store.set('enabled', want)
    if (want) {
      await applyLook($)
      return { text: 'Claude Cream theme on.' }
    }
    await $.theme.clear()
    $.ui.status(undefined)
    return { text: 'Default theme restored.' }
  })
}
