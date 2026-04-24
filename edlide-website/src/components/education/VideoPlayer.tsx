'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize, Loader2 } from 'lucide-react'

interface VideoPlayerProps {
  src?: string
  title: string
  onComplete?: () => void
}

export function VideoPlayer({ src, title, onComplete }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [showControls, setShowControls] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const AUTO_HIDE_MS = typeof window !== 'undefined' && window.innerWidth < 1024 ? 2000 : 3000

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const togglePlay = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      video.play()
      setIsPlaying(true)
    } else {
      video.pause()
      setIsPlaying(false)
    }
  }, [])

  const toggleMute = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setIsMuted(video.muted)
  }, [])

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current
    const video = videoRef.current
    if (!container) return

    const isAnyFullscreen =
      !!document.fullscreenElement ||
      !!(document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement

    if (isAnyFullscreen) {
      if (document.exitFullscreen) {
        void document.exitFullscreen()
      } else {
        const webkitDoc = document as Document & { webkitExitFullscreen?: () => Promise<void> | void }
        webkitDoc.webkitExitFullscreen?.()
      }
      return
    }

    if (container.requestFullscreen) {
      void container.requestFullscreen()
      return
    }

    const webkitContainer = container as HTMLDivElement & { webkitRequestFullscreen?: () => Promise<void> | void }
    if (webkitContainer.webkitRequestFullscreen) {
      webkitContainer.webkitRequestFullscreen()
      return
    }

    const webkitVideo = video as HTMLVideoElement & { webkitEnterFullscreen?: () => void }
    webkitVideo.webkitEnterFullscreen?.()
  }, [])

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current
    const bar = progressRef.current
    if (!video || !bar) return
    const rect = bar.getBoundingClientRect()
    const pos = (e.clientX - rect.left) / rect.width
    video.currentTime = pos * video.duration
  }, [])

  const handleProgressTouch = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const video = videoRef.current
    const bar = progressRef.current
    if (!video || !bar) return
    const rect = bar.getBoundingClientRect()
    const touch = e.touches[0]
    const pos = (touch.clientX - rect.left) / rect.width
    video.currentTime = Math.max(0, Math.min(pos, 1)) * video.duration
  }, [])

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
  }, [])

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true)
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)
    hideTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false)
    }, AUTO_HIDE_MS)
  }, [isPlaying, AUTO_HIDE_MS])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => setCurrentTime(video.currentTime)
    const handleLoadedMetadata = () => {
      setDuration(video.duration)
      setIsLoading(false)
    }
    const handleEnded = () => {
      setIsPlaying(false)
      onComplete?.()
    }
    const handleWaiting = () => setIsLoading(true)
    const handleCanPlay = () => setIsLoading(false)

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('ended', handleEnded)
    video.addEventListener('waiting', handleWaiting)
    video.addEventListener('canplay', handleCanPlay)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('waiting', handleWaiting)
      video.removeEventListener('canplay', handleCanPlay)
    }
  }, [onComplete])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const video = videoRef.current
      if (!video) return
      if (e.key === ' ' || e.key === 'k') {
        e.preventDefault()
        togglePlay()
      } else if (e.key === 'm') {
        toggleMute()
      } else if (e.key === 'f') {
        toggleFullscreen()
      } else if (e.key === 'ArrowLeft') {
        video.currentTime = Math.max(0, video.currentTime - 10)
      } else if (e.key === 'ArrowRight') {
        video.currentTime = Math.min(video.duration, video.currentTime + 10)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [togglePlay, toggleMute, toggleFullscreen])

  useEffect(() => {
    const updateFullscreenState = () => {
      const fullEl =
        document.fullscreenElement ||
        (document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement ||
        null
      setIsFullscreen(fullEl === containerRef.current)
    }

    document.addEventListener('fullscreenchange', updateFullscreenState)
    document.addEventListener('webkitfullscreenchange', updateFullscreenState as EventListener)

    return () => {
      document.removeEventListener('fullscreenchange', updateFullscreenState)
      document.removeEventListener('webkitfullscreenchange', updateFullscreenState as EventListener)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)
    }
  }, [])

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div
      ref={containerRef}
      className="relative group bg-black rounded-xl overflow-hidden"
      onContextMenu={handleContextMenu}
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onTouchStart={showControlsTemporarily}
    >
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{ userSelect: 'none' }}
        onContextMenu={handleContextMenu}
      />

      <video
        ref={videoRef}
        src={src || undefined}
        className={isFullscreen ? 'w-full h-full object-contain bg-black' : 'w-full aspect-video'}
        playsInline
        disablePictureInPicture
        disableRemotePlayback
        controlsList="nodownload nofullscreen noremoteplayback"
        onContextMenu={handleContextMenu}
        onClick={togglePlay}
      />

      {isLoading && src && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-white/80" />
        </div>
      )}

      {!src && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/90 text-white/60">
          <Play className="h-12 w-12 sm:h-16 sm:w-16 mb-3 sm:mb-4" />
          <p className="text-xs sm:text-sm">Video coming soon</p>
        </div>
      )}

      <div
        className={`absolute bottom-0 left-0 right-0 z-30 transition-opacity duration-300 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`}
      >
        <div
          className="h-2 sm:h-1.5 bg-white/20 cursor-pointer group/progress mx-2 sm:mx-3 py-1"
          ref={progressRef}
          onClick={handleProgressClick}
          onTouchMove={handleProgressTouch}
        >
          <div
            className="h-1 sm:h-1.5 bg-primary relative transition-all duration-100 -mt-0.5 sm:mt-0"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-3 sm:h-3 bg-primary rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity" />
          </div>
        </div>

        <div className="flex items-center justify-between px-2 sm:px-3 py-1.5 sm:py-2 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={togglePlay}
              className="text-white hover:text-primary transition-colors w-11 h-11 sm:w-auto sm:h-auto flex items-center justify-center"
            >
              {isPlaying ? <Pause className="h-6 w-6 sm:h-5 sm:w-5" /> : <Play className="h-6 w-6 sm:h-5 sm:w-5" />}
            </button>
            <button
              onClick={toggleMute}
              className="text-white hover:text-primary transition-colors w-11 h-11 sm:w-auto sm:h-auto flex items-center justify-center"
            >
              {isMuted ? <VolumeX className="h-6 w-6 sm:h-5 sm:w-5" /> : <Volume2 className="h-6 w-6 sm:h-5 sm:w-5" />}
            </button>
            <span className="text-white/80 text-xs sm:text-xs font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-primary transition-colors w-11 h-11 sm:w-auto sm:h-auto flex items-center justify-center"
            >
              <Maximize className="h-6 w-6 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>
      </div>

      <div
        className={`absolute top-0 left-0 right-0 z-30 transition-opacity duration-300 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`}
      >
        <div className="px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-b from-black/60 to-transparent">
          <p className="text-white text-xs sm:text-sm font-medium truncate">{title}</p>
        </div>
      </div>
    </div>
  )
}
