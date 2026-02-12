<script setup lang="ts">
import type { SubscriptionPlan, PaymentState } from '~/types/subscription'

const plans: SubscriptionPlan[] = [
  {
    id: 'free',
    name: '免费版',
    price: 0,
    duration: 0,
    features: ['基础课程管理', '5GB 云盘空间', '基础AI助手'],
  },
  {
    id: 'basic',
    name: '基础版',
    price: 29,
    duration: 30,
    features: ['全部课程功能', '20GB 云盘空间', 'AI 智能助手', '题库管理'],
  },
  {
    id: 'pro',
    name: '专业版',
    price: 79,
    duration: 30,
    features: ['全部基础版功能', '100GB 云盘空间', 'AI 高级功能', '课堂录制转录', '数据分析报告'],
    recommended: true,
  },
  {
    id: 'enterprise',
    name: '企业版',
    price: 199,
    duration: 30,
    features: ['全部专业版功能', '无限云盘空间', '专属客服', '定制化功能', 'API 接口'],
  },
]

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
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="VIP订阅">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6">
        <div v-if="payment.status === 'idle'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <UCard
            v-for="plan in plans"
            :key="plan.id"
            :class="plan.recommended ? 'ring-2 ring-primary' : ''"
          >
            <div class="space-y-4 text-center">
              <UBadge v-if="plan.recommended" color="primary" variant="subtle" class="mb-2">推荐</UBadge>
              <h3 class="text-lg font-semibold text-highlighted">{{ plan.name }}</h3>
              <div>
                <span class="text-3xl font-bold text-highlighted">{{ plan.price === 0 ? '免费' : `¥${plan.price}` }}</span>
                <span v-if="plan.price > 0" class="text-sm text-muted">/月</span>
              </div>
              <ul class="space-y-2 text-sm text-left">
                <li v-for="feature in plan.features" :key="feature" class="flex items-center gap-2">
                  <UIcon name="i-lucide-check" class="text-green-500 shrink-0" />
                  <span>{{ feature }}</span>
                </li>
              </ul>
              <UButton
                :label="plan.price === 0 ? '当前方案' : '选择方案'"
                :disabled="plan.price === 0"
                :variant="plan.recommended ? 'solid' : 'outline'"
                block
                @click="selectPlan(plan)"
              />
            </div>
          </UCard>
        </div>

        <div v-else class="flex flex-col items-center py-12 space-y-4">
          <h3 class="text-lg font-semibold text-highlighted">扫码支付</h3>
          <p class="text-sm text-muted">订单号：{{ payment.orderId }}</p>
          <ClientOnly>
            <div class="p-4 bg-white rounded-lg">
              <canvas ref="qrCanvas" />
            </div>
          </ClientOnly>
          <p class="text-sm text-muted">请使用微信或支付宝扫码支付</p>
          <UButton variant="ghost" label="取消支付" @click="cancelPayment" />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
