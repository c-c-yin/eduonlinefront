import { defineStore } from 'pinia'
import type { Question, UserAnswer, PracticeSession } from '@/types'
import { useQuestionApi } from '@/composables/useQuestionApi'

interface QuestionState {
  currentQuestion: Question | null
  practiceSession: PracticeSession | null
  questions: Question[]
  currentIndex: number
  answers: Record<number, string>
  results: Record<number, UserAnswer>
  elapsedTime: number
  isFinished: boolean
}

export const useQuestionStore = defineStore('question', {
  state: (): QuestionState => ({
    currentQuestion: null,
    practiceSession: null,
    questions: [],
    currentIndex: 0,
    answers: {},
    results: {},
    elapsedTime: 0,
    isFinished: false
  }),
  
  getters: {
    totalQuestions: (state) => state.questions.length,
    answeredCount: (state) => Object.keys(state.answers).length,
    correctCount: (state) => Object.values(state.results).filter(r => r.isCorrect).length,
    wrongCount: (state) => Object.values(state.results).filter(r => !r.isCorrect).length,
    correctRate: (state) => {
      const total = Object.keys(state.results).length
      if (total === 0) return 0
      return Math.round((Object.values(state.results).filter(r => r.isCorrect).length / total) * 100)
    },
    progressPercent: (state) => {
      if (state.questions.length === 0) return 0
      return Math.round(((state.currentIndex + 1) / state.questions.length) * 100)
    },
    isAnswered: (state) => (questionId: number) => {
      return !!state.answers[questionId]
    },
    getQuestionResult: (state) => (questionId: number) => {
      return state.results[questionId]
    }
  },
  
  actions: {
    async startPractice(params: { count?: number; knowledgeId?: number; videoId?: number }) {
      const { startPractice, getPracticeQuestions } = useQuestionApi()
      const session = await startPractice(params)
      this.practiceSession = session
      this.questions = session.questions || []
      this.currentIndex = 0
      this.answers = session.answers || {}
      this.results = {}
      this.elapsedTime = session.elapsedTime || 0
      this.isFinished = false
      
      if (this.questions.length > 0) {
        this.currentQuestion = this.questions[0] ?? null
      }
      
      return session
    },
    
    setQuestions(questions: Question[]) {
      this.questions = questions
      if (questions.length > 0) {
        this.currentQuestion = questions[0] ?? null
        this.currentIndex = 0
      }
    },
    
    setAnswer(questionId: number, answer: string) {
      this.answers[questionId] = answer
    },
    
    async submitCurrentAnswer() {
      if (!this.currentQuestion) return null
      const answer = this.answers[this.currentQuestion.questionId]
      if (!answer) return null
      
      const { submitAnswer } = useQuestionApi()
      const result = await submitAnswer({
        questionId: this.currentQuestion.questionId,
        answer
      })
      this.results[this.currentQuestion.questionId] = result
      return result
    },
    
    nextQuestion() {
      if (this.currentIndex < this.questions.length - 1) {
        this.currentIndex++
        this.currentQuestion = this.questions[this.currentIndex] ?? null
        return true
      }
      return false
    },
    
    prevQuestion() {
      if (this.currentIndex > 0) {
        this.currentIndex--
        this.currentQuestion = this.questions[this.currentIndex] ?? null
        return true
      }
      return false
    },
    
    jumpToQuestion(index: number) {
      if (index >= 0 && index < this.questions.length) {
        this.currentIndex = index
        this.currentQuestion = this.questions[index] ?? null
      }
    },
    
    updateElapsedTime(time: number) {
      this.elapsedTime = time
    },
    
    finishPractice() {
      this.isFinished = true
    },
    
    resetPractice() {
      this.practiceSession = null
      this.questions = []
      this.currentIndex = 0
      this.answers = {}
      this.results = {}
      this.elapsedTime = 0
      this.isFinished = false
      this.currentQuestion = null
    }
  },

  persist: {
    key: 'edu-question',
    storage: typeof window !== 'undefined' ? localStorage : undefined,
    paths: ['practiceSession', 'questions', 'currentIndex', 'answers', 'elapsedTime']
  }
})
