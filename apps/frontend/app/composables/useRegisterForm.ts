import gsap from 'gsap'

export function useRegisterForm(
  registerFormRef: Ref<HTMLElement | undefined>,
  onSuccess: () => void,
) {
  const toast = useToast()
  const { apiFetch } = useApi()

  const registerForm = reactive({
    username: '',
    email: '',
    password: '',
    verifyCode: '',
  })

  const loading = ref(false)
  const countdown = ref(0)
  let countdownTimer: ReturnType<typeof setInterval> | null = null

  function shakeForm() {
    if (!registerFormRef.value) return
    gsap.fromTo(registerFormRef.value, { x: 0 }, {
      x: 10,
      duration: 0.08,
      repeat: 3,
      yoyo: true,
      ease: 'power2.inOut',
    })
  }

  async function sendVerifyCode() {
    if (!registerForm.email) {
      toast.add({ title: '请输入邮箱', color: 'error' })
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerForm.email)) {
      toast.add({ title: '请输入有效的邮箱地址', color: 'warning' })
      return
    }
    if (countdown.value > 0) return

    try {
      const res = await apiFetch<{ code: number, msg?: string }>('/send-verification-code', {
        method: 'POST',
        body: { email: registerForm.email },
      })

      if (res.code === 200) {
        toast.add({ title: '验证码已发送', color: 'success' })
        countdown.value = 60
        countdownTimer = setInterval(() => {
          countdown.value--
          if (countdown.value <= 0 && countdownTimer) {
            clearInterval(countdownTimer)
            countdownTimer = null
          }
        }, 1000)
      }
      else {
        toast.add({ title: res.msg || '发送失败', color: 'error' })
      }
    }
    catch {
      toast.add({ title: '网络错误', color: 'error' })
    }
  }

  async function handleRegister() {
    if (!registerForm.username || !registerForm.email || !registerForm.password || !registerForm.verifyCode) {
      toast.add({ title: '请填写所有字段', color: 'error' })
      shakeForm()
      return
    }
    if (registerForm.password.length < 6) {
      toast.add({ title: '密码长度不能少于6个字符', color: 'error' })
      shakeForm()
      return
    }

    loading.value = true
    try {
      const res = await apiFetch<{ code: number, msg?: string }>('/register', {
        method: 'POST',
        body: {
          name: registerForm.username,
          email: registerForm.email,
          password: registerForm.password,
          code: registerForm.verifyCode,
        },
      })

      if (res.code === 201 || res.code === 200) {
        toast.add({ title: '注册成功，请登录', color: 'success' })

        if (registerFormRef.value) {
          gsap.to(registerFormRef.value, {
            y: -10,
            opacity: 0.8,
            duration: 0.3,
            ease: 'power2.out',
            onComplete: () => {
              gsap.to(registerFormRef.value!, {
                y: 0,
                opacity: 1,
                duration: 0.3,
                delay: 0.1,
              })
              setTimeout(() => onSuccess(), 600)
            },
          })
        }

        registerForm.username = ''
        registerForm.email = ''
        registerForm.password = ''
        registerForm.verifyCode = ''
      }
      else {
        toast.add({ title: res.msg || '注册失败', color: 'error' })
        shakeForm()
      }
    }
    catch {
      toast.add({ title: '网络错误', color: 'error' })
      shakeForm()
    }
    finally {
      loading.value = false
    }
  }

  function cleanup() {
    if (countdownTimer) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
  }

  return {
    registerForm,
    loading,
    countdown,
    sendVerifyCode,
    handleRegister,
    cleanup,
  }
}
