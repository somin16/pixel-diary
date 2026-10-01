// stores/useSoundEffectStore.js 
// 앱 효과음 설정
import { create } from 'zustand'
import { persist } from 'zustand/middleware' // 효과음 on/off 설정 영구 저장

const useSoundEffectStore = create(
  persist(
    (set, get) => ({
      // --- 상태 ---
      isSoundEffectOn: true, // 효과음 켜짐 여부
      volume: 0.5,           // 효과음 볼륨 (0.0 ~ 1.0)

      // --- 액션 ---

      // 켜기/끄기 토글
      toggleSoundEffect: () => set({ isSoundEffectOn: !get().isSoundEffectOn }),

      // 효과음 재생 (꺼져 있으면 아무것도 안 함)
      // 사용 예: useSoundEffectStore.getState().play('/sound-effects/click.mp3')
      play: (src) => {
        const { isSoundEffectOn, volume } = get()
        if (!isSoundEffectOn) return

        const soundEffect = new Audio(src) // 효과음은 겹쳐서 날 수 있으니 매번 새로 생성
        soundEffect.volume = volume
        soundEffect.play().catch(() => {}) // 브라우저 자동재생 정책 대응
      },
    }),
    {
      name: 'pixel-diary-sound-effect', // localStorage 키
    }
  )
)

export default useSoundEffectStore