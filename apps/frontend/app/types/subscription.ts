export interface SubscriptionPlan {
  id: string
  name: string
  price: number
  duration: number
  features: string[]
  recommended?: boolean
}

export interface PaymentState {
  orderId?: string
  status: 'idle' | 'pending' | 'paid' | 'failed'
  qrCodeUrl?: string
}
