export class AudioManager {
  private audioContext: AudioContext | null = null;
  private soundCache: Map<string, AudioBuffer> = new Map();
  private bgmAudio: HTMLAudioElement | null = null;

  private masterVolume: number = 1.0;
  private sfxVolume: number = 1.0;
  private bgmVolume: number = 0.8;
  private muted: boolean = false;

  private initContext(): void {
    if (!this.audioContext && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
      }
    }
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  public async loadSound(url: string): Promise<AudioBuffer | null> {
    this.initContext();
    if (!this.audioContext) return null;

    if (this.soundCache.has(url)) {
      return this.soundCache.get(url)!;
    }

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.soundCache.set(url, audioBuffer);
      return audioBuffer;
    } catch (err) {
      console.warn(`AudioManager: Failed to load sound at ${url}`, err);
      return null;
    }
  }

  public playSound(url: string, volume: number = 1.0): void {
    if (this.muted) return;
    this.initContext();
    if (!this.audioContext) return;

    const buffer = this.soundCache.get(url);
    if (!buffer) {
      // Lazy load and play
      this.loadSound(url).then(buf => {
        if (buf) this.playSoundBuffer(buf, volume);
      });
      return;
    }

    this.playSoundBuffer(buffer, volume);
  }

  private playSoundBuffer(buffer: AudioBuffer, volume: number): void {
    if (!this.audioContext) return;

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;

    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = volume * this.sfxVolume * this.masterVolume;

    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    source.start(0);
  }

  public playBGM(url: string, loop: boolean = true): void {
    if (this.bgmAudio) {
      this.bgmAudio.pause();
      this.bgmAudio = null;
    }

    const audio = new Audio(url);
    audio.loop = loop;
    audio.volume = this.muted ? 0 : this.bgmVolume * this.masterVolume;
    audio.play().catch(err => {
      console.warn(`AudioManager: BGM autoplay blocked or failed for ${url}`, err);
    });

    this.bgmAudio = audio;
  }

  public stopBGM(): void {
    if (this.bgmAudio) {
      this.bgmAudio.pause();
      this.bgmAudio = null;
    }
  }

  public setMasterVolume(vol: number): void {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    this.updateBGMVolume();
  }

  public setBGMVolume(vol: number): void {
    this.bgmVolume = Math.max(0, Math.min(1, vol));
    this.updateBGMVolume();
  }

  public setSFXVolume(vol: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    this.updateBGMVolume();
    return this.muted;
  }

  private updateBGMVolume(): void {
    if (this.bgmAudio) {
      this.bgmAudio.volume = this.muted ? 0 : this.bgmVolume * this.masterVolume;
    }
  }
}
