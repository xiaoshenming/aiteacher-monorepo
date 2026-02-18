import gsap from 'gsap'

interface ParticleRefs {
  particle1: Ref<HTMLElement | undefined>
  particle2: Ref<HTMLElement | undefined>
  particle3: Ref<HTMLElement | undefined>
  particle4: Ref<HTMLElement | undefined>
  particle5: Ref<HTMLElement | undefined>
}

export function useLoginAnimation(
  containerRef: Ref<HTMLElement | undefined>,
  particleRefs: ParticleRefs,
) {
  let particleAnimations: gsap.core.Timeline[] = []

  function setupParticles() {
    const particles = [
      particleRefs.particle1.value,
      particleRefs.particle2.value,
      particleRefs.particle3.value,
      particleRefs.particle4.value,
      particleRefs.particle5.value,
    ]

    particles.forEach((particle) => {
      if (!particle) return

      gsap.set(particle, {
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        opacity: Math.random() * 0.5 + 0.2,
      })

      const tl = gsap.timeline({ repeat: -1, yoyo: true })
      const duration = 12 + Math.random() * 18

      tl.to(particle, {
        x: `+=${Math.random() * 250 - 125}`,
        y: `+=${Math.random() * 250 - 125}`,
        opacity: Math.random() * 0.3 + 0.1,
        duration: duration / 2,
        ease: 'sine.inOut',
      }).to(particle, {
        x: `+=${Math.random() * 250 - 125}`,
        y: `+=${Math.random() * 250 - 125}`,
        opacity: Math.random() * 0.5 + 0.2,
        duration: duration / 2,
        ease: 'sine.inOut',
      })

      particleAnimations.push(tl)
    })
  }

  function animateContainerEntrance() {
    if (containerRef.value) {
      gsap.from(containerRef.value, {
        y: 60,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
      })
    }
  }

  function init() {
    setupParticles()
    animateContainerEntrance()
  }

  function cleanup() {
    particleAnimations.forEach(tl => tl.kill())
    particleAnimations = []
  }

  return {
    init,
    cleanup,
  }
}
