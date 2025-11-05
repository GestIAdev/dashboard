/**
 * 🎸 SELENE MIDI PLAYER V3 - SCHERZO SÓNICO (Fase 4.2)
 * 
 * ARQUITECTURA METADATA JSON:
 * - ✅ Parsea metadata JSON del backend
 * - ✅ Mapea tracks MIDI usando empiricalIndex (workaround Bug C)
 * - ✅ Carga instrumentos dinámicos (multisample/oneshot)
 * - ✅ Fallbacks en 3 capas (metadata → nombre → empírico)
 * 
 * AUTHOR: PunkClaude + Radwulf + PunkArchytect
 * DATE: 2025-11-04
 * VERSION: 3.0 (Scherzo Sónico)
 */

import { SampleLoaderV4 } from './SampleLoader-v4.js'

class MIDIPlayerV3 {
    constructor() {
        this.isInitialized = false
        this.isPlaying = false
        this.isPaused = false
        this.currentMidi = null
        this.currentMetadata = null  // 🎨 SCHERZO SÓNICO: Metadata JSON
        this.sampleLoader = new SampleLoaderV4()
        this.currentPlaybackObjects = []
        this.currentPreset = 'cyberpunkpreset'
        
        // 🎸 FASE 5.2: Callbacks para UI (barra de progreso)
        this.onProgress = null        // Callback: (data) => { currentTime, progress }
        this.onEnded = null           // Callback: () => {}
        this.progressLoopId = null    // ID del requestAnimationFrame
    }

    /**
     * 🎯 INIT: Preparar SampleLoader con preset activo
     * @param {string} presetName - Nombre del preset (ej: 'cyberpunkpreset')
     */
    async init(presetName = 'cyberpunkpreset') {
        if (this.isInitialized) return

        try {
            console.log(`🎹 [MIDIPlayer V3] Initializing with preset: ${presetName}`)
            
            // Set active preset en SampleLoader
            this.sampleLoader.setActivePreset(presetName)
            this.currentPreset = presetName
            
            this.isInitialized = true
            console.log(`✅ [MIDIPlayer V3] Initialized`)
        } catch (error) {
            console.error('❌ [MIDIPlayer V3] Failed to initialize:', error)
            throw error
        }
    }

    /**
     * Ensure AudioContext is started (call on user interaction)
     */
    async ensureAudioStarted() {
        if (!this.isInitialized) {
            throw new Error('Player not initialized. Call init() first.')
        }

        try {
            if (Tone.context.state !== 'running') {
                await Tone.start()
                console.log('🎵 AudioContext started on user interaction')
            }
        } catch (error) {
            console.error('❌ Failed to start AudioContext:', error)
            throw error
        }
    }

    /**
     * 🎯 LOAD MIDI: Parsea MIDI + Metadata JSON
     * 
     * @param {Object} input - Objeto con { midi, metadata }
     *   - midi: string (base64) o ArrayBuffer
     *   - metadata: Object con trackMetadata[] (opcional)
     */
    async loadMIDI(input) {
        try {
            let midiData
            let metadata = null

            // 🔄 Parse input (puede ser solo MIDI o { midi, metadata })
            if (input.midi) {
                // Nuevo formato: { midi, metadata }
                console.log('📦 [MIDIPlayer V3] Received MIDI + Metadata JSON')
                midiData = input.midi
                metadata = input.metadata || null
            } else {
                // Legacy formato: solo MIDI buffer
                console.log('📦 [MIDIPlayer V3] Received MIDI only (legacy)')
                midiData = input
            }

            // 🎵 Decode MIDI
            let bytes
            if (midiData instanceof ArrayBuffer) {
                bytes = new Uint8Array(midiData)
            } else if (typeof midiData === 'string') {
                const binaryString = atob(midiData)
                bytes = new Uint8Array(binaryString.length)
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i) & 0xFF
                }
            } else {
                throw new Error('Invalid MIDI input type')
            }

            console.log(`🎵 [MIDIPlayer V3] MIDI decoded: ${bytes.length} bytes`)

            // 🎼 Parse MIDI con @tonejs/midi
            const midi = new Midi(bytes)
            this.currentMidi = midi
            this.currentMetadata = metadata

            console.log(`🎼 [MIDIPlayer V3] MIDI parsed: ${midi.tracks.length} tracks, ${midi.duration.toFixed(2)}s duration`)

            // 📊 Log metadata si existe
            if (metadata && metadata.trackMetadata) {
                console.log(`📊 [MIDIPlayer V3] Metadata received:`)
                metadata.trackMetadata.forEach(track => {
                    console.log(`  - Track ${track.empiricalIndex} (${track.trackType}): ${track.instrumentKey} (${track.instrumentType})`)
                })
            } else {
                console.log(`⚠️ [MIDIPlayer V3] No metadata received, using fallback mapping`)
            }

        } catch (error) {
            console.error('❌ [MIDIPlayer V3] Error loading MIDI:', error)
            throw error
        }
    }

    /**
     * 🎸 PLAY: Reproduce MIDI usando Metadata JSON
     */
    async play() {
        if (!this.currentMidi) {
            throw new Error('No MIDI loaded. Call loadMIDI() first.')
        }

        await this.ensureAudioStarted()

        console.log('🎸 [MIDIPlayer V3] Starting playback with metadata architecture')

        // Stop any previous playback
        this.stop()

        // 🔄 CAPA 1: Metadata JSON (Scherzo Sónico)
        if (this.currentMetadata && this.currentMetadata.trackMetadata) {
            await this.playWithMetadata()
        }
        // 🔄 CAPA 2: Fallback a mapping empírico (Fase 3.12)
        else {
            await this.playWithEmpiricalMapping()
        }

        this.isPlaying = true
        this.isPaused = false
        this.startTime = Tone.now()

        // 🎸 FASE 5.2: Iniciar loop de actualización de progreso
        this.startProgressLoop()

        console.log('▶️ [MIDIPlayer V3] Playback started')
    }

    /**
     * 🎨 CAPA 1: Play con Metadata JSON
     */
    async playWithMetadata() {
        console.log('🎨 [MIDIPlayer V3] Using Metadata JSON for instrument mapping')

        for (const trackMeta of this.currentMetadata.trackMetadata) {
            const { empiricalIndex, trackType, instrumentKey, instrumentType, samples } = trackMeta

            // Get track MIDI usando empiricalIndex
            const track = this.currentMidi.tracks[empiricalIndex]

            if (!track) {
                console.warn(`⚠️ [MIDIPlayer V3] Track ${empiricalIndex} not found in MIDI`)
                continue
            }

            if (!track.notes || track.notes.length === 0) {
                console.log(`⚠️ [MIDIPlayer V3] Track ${empiricalIndex} (${trackType}) has no notes, skipping`)
                continue
            }

            console.log(`🎵 [MIDIPlayer V3] Track ${empiricalIndex} (${trackType}): ${track.notes.length} notes → ${instrumentKey} (${instrumentType})`)

            try {
                // 🔧 FASE 5.2: Cargar instrumento dinámicamente (con samples para drumkit)
                const instrument = await this.sampleLoader.getInstrument(trackType, instrumentKey, instrumentType, samples)

                // 📅 Schedular notas
                const part = new Tone.Part((time, note) => {
                    instrument.triggerAttackRelease(
                        note.name,
                        note.duration,
                        time,
                        note.velocity
                    )
                }, track.notes.map(note => ({
                    time: note.time,
                    name: note.name,
                    duration: note.duration,
                    velocity: note.velocity
                })))

                part.start(0)
                this.currentPlaybackObjects.push(part)

                console.log(`✅ [MIDIPlayer V3] Track ${empiricalIndex} scheduled with ${track.notes.length} events`)

            } catch (error) {
                console.error(`❌ [MIDIPlayer V3] Error loading instrument for track ${empiricalIndex}:`, error)
            }
        }

        // Start Tone.Transport
        Tone.Transport.start()
    }

    /**
     * 🔄 CAPA 2: Fallback a Mapping Empírico (Fase 3.12)
     */
    async playWithEmpiricalMapping() {
        console.log('🔄 [MIDIPlayer V3] Using empirical mapping (Fase 3.12 fallback)')

        // Mapping empírico hardcodeado
        const trackMapping = [
            'melody',   // Track 0
            'skip',     // Track 1 (phantom)
            'harmony',  // Track 2
            'skip',     // Track 3 (phantom)
            'bass',     // Track 4
            'rhythm',   // Track 5
            'skip',     // Track 6 (phantom)
            'pad'       // Track 7
        ]

        // Mapeo de trackType a instrumentos por defecto
        const defaultInstruments = {
            'melody': { key: 'melody-vocal-chops-ahum_reverb', type: 'oneshot' },
            'harmony': { key: 'pads-crystalline-crystalline-1', type: 'oneshot' },
            'bass': { key: 'Bass-sub-bass-Subs-01', type: 'oneshot' },
            'rhythm': { key: 'rythm-soft-kick1', type: 'oneshot' },
            'pad': { key: 'pads-crystalline-crystalline-5', type: 'oneshot' }
        }

        for (let trackIndex = 0; trackIndex < this.currentMidi.tracks.length; trackIndex++) {
            const trackType = trackMapping[trackIndex]

            if (trackType === 'skip') {
                console.log(`⚠️ [MIDIPlayer V3] Track ${trackIndex} is phantom (Bug C), skipping`)
                continue
            }

            const track = this.currentMidi.tracks[trackIndex]

            if (!track || !track.notes || track.notes.length === 0) {
                console.log(`⚠️ [MIDIPlayer V3] Track ${trackIndex} (${trackType}) has no notes, skipping`)
                continue
            }

            console.log(`🎵 [MIDIPlayer V3] Track ${trackIndex} (${trackType}): ${track.notes.length} notes → default instrument`)

            try {
                const defaultInst = defaultInstruments[trackType]
                if (!defaultInst) {
                    console.warn(`⚠️ [MIDIPlayer V3] No default instrument for ${trackType}`)
                    continue
                }

                const instrument = await this.sampleLoader.getInstrument(trackType, defaultInst.key, defaultInst.type)

                const part = new Tone.Part((time, note) => {
                    instrument.triggerAttackRelease(
                        note.name,
                        note.duration,
                        time,
                        note.velocity
                    )
                }, track.notes.map(note => ({
                    time: note.time,
                    name: note.name,
                    duration: note.duration,
                    velocity: note.velocity
                })))

                part.start(0)
                this.currentPlaybackObjects.push(part)

                console.log(`✅ [MIDIPlayer V3] Track ${trackIndex} scheduled (fallback)`)

            } catch (error) {
                console.error(`❌ [MIDIPlayer V3] Error loading fallback instrument for track ${trackIndex}:`, error)
            }
        }

        Tone.Transport.start()
    }

    /**
     * ⏸️ PAUSE
     */
    pause() {
        if (this.isPlaying && !this.isPaused) {
            Tone.Transport.pause()
            this.pauseTime = Tone.now()
            this.isPaused = true
            
            // 🎸 FASE 5.2: Detener loop de progreso durante pausa
            this.stopProgressLoop()
            
            console.log('⏸️ Playback paused')
        }
    }

    /**
     * ▶️ RESUME
     */
    resume() {
        if (this.isPlaying && this.isPaused) {
            Tone.Transport.start()
            this.isPaused = false
            
            // 🎸 FASE 5.2: Reiniciar loop de progreso al resumir
            this.startProgressLoop()
            
            console.log('▶️ Playback resumed')
        }
    }

    /**
     * ⏹️ STOP
     */
    stop() {
        if (this.isPlaying || this.isPaused) {
            Tone.Transport.stop()
            Tone.Transport.cancel()

            // Dispose parts
            this.currentPlaybackObjects.forEach(part => {
                part.stop()
                part.dispose()
            })
            this.currentPlaybackObjects = []

            // 🎸 FASE 5.2: Detener loop de progreso
            this.stopProgressLoop()

            this.isPlaying = false
            this.isPaused = false
            console.log('⏹️ Playback stopped')
        }
    }

    /**
     * 🎸 FASE 5.2: Iniciar loop de actualización de progreso
     */
    startProgressLoop() {
        if (!this.isPlaying) return

        const updateProgress = () => {
            if (!this.isPlaying || this.isPaused) return

            const currentTime = Tone.Transport.seconds
            const duration = this.duration
            const progress = duration > 0 ? currentTime / duration : 0

            // Disparar callback si existe
            if (this.onProgress) {
                this.onProgress({ currentTime, progress })
            }

            // Verificar si llegó al final
            if (currentTime >= duration && duration > 0) {
                this.stop()
                if (this.onEnded) {
                    this.onEnded()
                }
                return
            }

            // Continuar loop
            this.progressLoopId = requestAnimationFrame(updateProgress)
        }

        // Iniciar loop
        this.progressLoopId = requestAnimationFrame(updateProgress)
    }

    /**
     * 🎸 FASE 5.2: Detener loop de actualización de progreso
     */
    stopProgressLoop() {
        if (this.progressLoopId) {
            cancelAnimationFrame(this.progressLoopId)
            this.progressLoopId = null
        }
    }

    /**
     * 🧹 DISPOSE
     */
    dispose() {
        this.stop()
        this.sampleLoader.clearCache()
        this.currentMidi = null
        this.currentMetadata = null
        console.log('🧹 Player disposed')
    }

    /**
     * 🎵 Get MIDI duration (getter for V2 compatibility)
     */
    get duration() {
        return this.currentMidi ? this.currentMidi.duration : 0
    }

    /**
     * 🕐 Format seconds to MM:SS
     * @param {number} seconds - Time in seconds
     * @returns {string} Formatted time (e.g., "3:45")
     */
    static formatTime(seconds) {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }
}

/**
 * 📚 USAGE EXAMPLE:
 * 
 * ```javascript
 * const player = new MIDIPlayerV3()
 * await player.init('cyberpunkpreset')
 * 
 * // Fetch MIDI + Metadata from backend
 * const response = await fetch('/api/music/generate', {
 *     method: 'POST',
 *     body: JSON.stringify({ style: 'cyberpunkpreset', duration: 120 })
 * })
 * const data = await response.json()
 * 
 * // Load and play
 * await player.loadMIDI({
 *     midi: data.midi,
 *     metadata: data.metadata
 * })
 * await player.play()
 * ```
 */

export { MIDIPlayerV3 }
