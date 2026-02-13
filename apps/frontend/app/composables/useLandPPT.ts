/**
 * Composable for LandPPT SSO integration
 * Handles token generation and iframe session management
 */
export function useLandPPT() {
  const config = useRuntimeConfig()
  const userStore = useUserStore()
  const ssoReady = ref(false)
  const ssoError = ref<string | null>(null)
  const sessionId = ref<string | null>(null)

  /**
   * Perform SSO login to LandPPT
   * 1. Request SSO token from backend-main (server-side signing)
   * 2. Send token to LandPPT SSO endpoint
   * 3. Get session cookie for iframe
   */
  async function ssoLogin(): Promise<void> {
    ssoError.value = null
    ssoReady.value = false

    try {
      // Step 1: Get SSO token from backend-main
      const { apiFetch } = useApi()
      const tokenRes = await apiFetch<{ token: string }>('/ppt/sso-token', {
        method: 'POST',
        body: {
          username: userStore.userInfo?.name || `user_${userStore.userInfo?.id}`,
          user_id: String(userStore.userInfo?.id || ''),
          role: String(userStore.userInfo?.role || ''),
        },
      })

      // Step 2: SSO login to LandPPT
      const landpptBase = config.public.landpptBase as string
      const res = await $fetch<{ success: boolean, session_id: string }>(
        `${landpptBase}/api/auth/sso`,
        {
          method: 'POST',
          body: {
            token: tokenRes.token,
            username: userStore.userInfo?.name || `user_${userStore.userInfo?.id}`,
            user_id: String(userStore.userInfo?.id || ''),
            role: String(userStore.userInfo?.role || ''),
          },
          credentials: 'include',
        },
      )

      if (res.success) {
        sessionId.value = res.session_id
        ssoReady.value = true
      }
      else {
        throw new Error('SSO login failed')
      }
    }
    catch (err) {
      ssoError.value = (err as Error).message
      console.error('LandPPT SSO error:', err)
    }
  }

  /**
   * Get the iframe URL with session and embed parameters
   */
  function getIframeUrl(path: string = '/home'): string {
    const landpptBase = config.public.landpptBase as string
    const params = new URLSearchParams({
      embed: 'true',
      ...(sessionId.value ? { session_id: sessionId.value } : {}),
    })
    return `${landpptBase}${path}?${params.toString()}`
  }

  return {
    ssoReady,
    ssoError,
    sessionId,
    ssoLogin,
    getIframeUrl,
  }
}
