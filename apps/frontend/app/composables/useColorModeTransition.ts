/**
 * Composable for color mode switching with circular ripple View Transition animation.
 * Shared between ColorModeToggle button and dashboard dropdown menu.
 */
export function useColorModeTransition() {
  const colorMode = useColorMode()
  const nextTheme = computed(() => (colorMode.value === 'dark' ? 'light' : 'dark'))

  function switchTheme() {
    colorMode.preference = nextTheme.value
  }

  /**
   * Start a circular ripple view transition from the given coordinates.
   * Falls back to instant switch if View Transition API is not supported.
   */
  function startViewTransition(x: number, y: number) {
    if (!document.startViewTransition) {
      switchTheme()
      return
    }

    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    )

    const transition = document.startViewTransition(() => {
      switchTheme()
    })

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 600,
          easing: 'cubic-bezier(.76,.32,.29,.99)',
          pseudoElement: '::view-transition-new(root)',
        },
      )
    })
  }

  /**
   * Handle a MouseEvent click — extracts coordinates and triggers transition.
   */
  function startViewTransitionFromEvent(event: MouseEvent) {
    startViewTransition(event.clientX, event.clientY)
  }

  /**
   * Trigger transition from viewport center (for cases without a MouseEvent, e.g. dropdown menus).
   */
  function startViewTransitionFromCenter() {
    startViewTransition(window.innerWidth / 2, window.innerHeight / 2)
  }

  return {
    colorMode,
    nextTheme,
    switchTheme,
    startViewTransition,
    startViewTransitionFromEvent,
    startViewTransitionFromCenter,
  }
}
