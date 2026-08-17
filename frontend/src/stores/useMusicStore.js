// stores/musicStore.js
import { create } from 'zustand'
import { persist } from 'zustand/middleware'  // 볼륨/뮤트 설정 영구 저장

// 테마별 음악 파일 매핑
const THEME_MUSIC = {
  default:        '/music/winter_light.mp3',
  winter_light:   '/music/winter_light.mp3',
  // ...테마 추가 시 여기만 수정
}

// 스토어 밖 싱글톤 Audio 객체 (컴포넌트 리렌더에 영향 없음)
const audio = new Audio()
audio.loop = true

const useMusicStore = create(
  persist(
    (set, get) => ({
      // --- 상태 ---
      isMuted: false,   // 뮤트 여부
      volume: 0.0,      // 볼륨 (0.0 ~ 1.0)
      currentTheme: '', // 현재 재생 중인 테마

      // --- 액션 ---

      // 테마에 맞는 음악으로 전환
      playForTheme: (theme) => {
        const src = THEME_MUSIC[theme] ?? THEME_MUSIC.default
        const { currentTheme, isMuted, volume } = get()

        // 같은 테마면 재시작 안 함
        if (currentTheme === theme) return

        audio.pause()
        audio.src = src
        audio.volume = isMuted ? 0 : volume
        audio.play().catch(() => {}) // 브라우저 자동재생 정책 대응
        set({ currentTheme: theme })
      },

      // 켜기/끄기 토글
      toggleMute: () => {
        const { isMuted, volume } = get()
        const next = !isMuted
        audio.volume = next ? 0 : volume
        set({ isMuted: next })
      },

      // 볼륨 조절 (뮤트 중이 아닐 때만 실제 반영)
      setVolume: (v) => {
        const { isMuted } = get()
        if (!isMuted) audio.volume = v
        set({ volume: v })
      },

      // 미니게임 진입 시 일시정지 / 복귀 시 재개
      pause: () => audio.pause(),
      resume: () => {
        const { isMuted, volume } = get()
        audio.volume = isMuted ? 0 : volume
        audio.play().catch(() => {})
      },
    }),
    {
      name: 'pixel-diary-music', // localStorage 키
      partialize: (s) => ({      // 저장할 항목만 선택 (현재 테마는 저장 불필요)
        isMuted: s.isMuted,
        volume: s.volume,
      }),
    }
  )
)

export default useMusicStore