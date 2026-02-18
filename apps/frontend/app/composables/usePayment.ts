import type { SubscriptionPlan, PaymentState } from '~/types/subscription'

export function usePayment() {
  const payment = reactive<PaymentState>({
    status: 'idle',
  })

  const qrCanvas = ref<HTMLCanvasElement | null>(null)

  async function selectPlan(plan: SubscriptionPlan) {
    if (plan.price === 0) return
    payment.status = 'pending'
    payment.orderId = `ORD${Date.now()}`

    await nextTick()
    if (qrCanvas.value && import.meta.client) {
      const QRCode = (await import('qrcode')).default
      await QRCode.toCanvas(qrCanvas.value, `aiteacher://pay?order=${payment.orderId}&plan=${plan.id}&amount=${plan.price}`, {
        width: 200,
        margin: 2,
      })
    }
  }

  function cancelPayment() {
    payment.status = 'idle'
    payment.orderId = undefined
  }

  return {
    payment,
    qrCanvas,
    selectPlan,
    cancelPayment,
  }
}
