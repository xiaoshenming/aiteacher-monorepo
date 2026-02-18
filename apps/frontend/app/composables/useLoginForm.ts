import gsap from 'gsap'

export function useLoginForm(loginFormRef: Ref<HTMLElement | undefined>) {
  const toast = useToast()
  const userStore = useUserStore()
  const { apiFetch } = useApi()

  const loginForm = reactive({
    account: '',
    password: '',
    rememberMe: false,
  })

  const loading = ref(false)

  function shakeForm() {
    if (!loginFormRef.value) return
    gsap.fromTo(loginFormRef.value, { x: 0 }, {
      x: 10,
      duration: 0.08,
      repeat: 3,
      yoyo: true,
      ease: 'power2.inOut',
    })
  }

  async function handleLogin() {
    if (!loginForm.account || !loginForm.password) {
      toast.add({ title: '请填写账号和密码', color: 'error' })
      shakeForm()
      return
    }

    loading.value = true
    try {
      const res = await apiFetch<{ code: number, data: { token: string, role?: string }, msg?: string }>('/pc/login', {
        method: 'POST',
        body: {
          account: loginForm.account,
          password: loginForm.password,
        },
      })

      if (res.code === 200 && res.data?.token) {
        userStore.setToken(res.data.token)
        toast.add({ title: '登录成功', color: 'success' })

        if (loginFormRef.value) {
          gsap.to(loginFormRef.value, {
            y: -20,
            opacity: 0,
            duration: 0.5,
            ease: 'power2.out',
            onComplete: () => {
              const roleMap: Record<string, string> = {
                '0': '/student',
                '1': '/home',
                '2': '/user',
                '3': '/admin',
                '4': '/superadmin',
              }
              navigateTo(roleMap[res.data.role || ''] || '/dashboard')
            },
          })
        }
        else {
          navigateTo('/dashboard')
        }
      }
      else {
        toast.add({ title: res.msg || '登录失败', color: 'error' })
        shakeForm()
      }
    }
    catch {
      toast.add({ title: '网络错误，请稍后重试', color: 'error' })
      shakeForm()
    }
    finally {
      loading.value = false
    }
  }

  return {
    loginForm,
    loading,
    handleLogin,
  }
}
