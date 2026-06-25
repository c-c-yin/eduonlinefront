import { defineStore } from 'pinia'
import type { Video, StudyRecord } from '@/types'
import { useStudyRecordApi } from '@/composables/useStudyRecordApi'

interface VideoState {
  currentVideo: Video | null
  watchHistory: StudyRecord[]
  lastPosition: number
  isPlaying: boolean
  duration: number
}

export const useVideoStore = defineStore('video', {
  state: (): VideoState => ({
    currentVideo: null,
    watchHistory: [],
    lastPosition: 0,
    isPlaying: false,
    duration: 0
  }),
  
  getters: {
    progress: (state) => {
      if (!state.duration || state.duration === 0) return 0
      return Math.min(Math.round((state.lastPosition / state.duration) * 100), 100)
    },
    formattedProgress: (state) => {
      const minutes = Math.floor(state.lastPosition / 60)
      const seconds = Math.floor(state.lastPosition % 60)
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
  },
  
  actions: {
    setCurrentVideo(video: Video) {
      this.currentVideo = video
      this.duration = video.duration || 0
      this.lastPosition = 0
      this.isPlaying = false
    },
    
    updatePosition(position: number) {
      this.lastPosition = position
    },
    
    setPlaying(status: boolean) {
      this.isPlaying = status
    },
    
    async saveProgress() {
      if (!this.currentVideo) return
      const { updateStudyProgress } = useStudyRecordApi()
      await updateStudyProgress({
        videoId: this.currentVideo.videoId,
        videoType: 'vod',
        watchDuration: this.lastPosition,
        lastPosition: this.lastPosition,
        progress: this.progress
      })
    },
    
    setWatchHistory(history: StudyRecord[]) {
      this.watchHistory = history
    },
    
    clearCurrentVideo() {
      this.currentVideo = null
      this.lastPosition = 0
      this.isPlaying = false
      this.duration = 0
    }
  },

  persist: {
    key: 'edu-video',
    storage: typeof window !== 'undefined' ? localStorage : undefined,
    paths: ['currentVideo', 'lastPosition', 'duration']
  }
})
