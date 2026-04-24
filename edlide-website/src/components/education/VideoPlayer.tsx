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

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
  }, [])

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true)
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)
    hideTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false)
    }, 3000)
  }, [isPlaying])

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

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div
      ref={containerRef}
      className="relative group bg-black rounded-xl overflow-hidden"
      onContextMenu={handleContextMenu}
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => isPlaying && setShowControls(false)}
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
          <Loader2 className="h-10 w-10 animate-spin text-white/80" />
        </div>
      )}

      {!src && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/90 text-white/60">
          <Play className="h-16 w-16 mb-4" />
          <p className="text-sm">Video coming soon</p>
        </div>
      )}

      <div
        className={`absolute bottom-0 left-0 right-0 z-30 transition-opacity duration-300 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`}
      >
        <div
          className="h-1.5 bg-white/20 cursor-pointer group/progress mx-3"
          ref={progressRef}
          onClick={handleProgressClick}
        >
          <div
            className="h-full bg-primary relative transition-all duration-100"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity" />
          </div>
        </div>

        <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex items-center gap-3">
            <button onClick={togglePlay} className="text-white hover:text-primary transition-colors">
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </button>
            <button onClick={toggleMute} className="text-white hover:text-primary transition-colors">
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
            <span className="text-white/80 text-xs font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleFullscreen} className="text-white hover:text-primary transition-colors">
              <Maximize className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div
        className={`absolute top-0 left-0 right-0 z-30 transition-opacity duration-300 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`}
      >
        <div className="px-4 py-3 bg-gradient-to-b from-black/60 to-transparent">
          <p className="text-white text-sm font-medium truncate">{title}</p>
        </div>
      </div>
    </div>
  )
}
