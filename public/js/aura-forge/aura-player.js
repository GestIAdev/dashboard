/**
 * 🎸 SELENE MIDI PLAYER - TONE.JS INTEGRATION
 * "CÓDIGO = ARTE = BELLEZA = FUNCIONALIDAD"
 */

class MIDIPlayer {
    constructor() {
        this.isInitialized = false
        this.isPlaying = false
        this.isPaused = false
        this.currentMidi = null
        this.synth = null
        this.startTime = 0
        this.pauseTime = 0
        this.duration = 0
        this.animationFrame = null
        this.currentPlaybackObject = null
    }

    /**
     * Initialize Tone.js audio context
     */
    async init() {
        if (this.isInitialized) return

        try {
            // Remove automatic Tone.start() call - will be called on user interaction
            console.log('🎹 Tone.js initialized (AudioContext deferred)')

            // Create polyphonic synth for piano
            this.synth = new Tone.PolySynth(Tone.Synth, {
                oscillator: {
                    type: 'triangle'
                },
                envelope: {
                    attack: 0.005,
                    decay: 0.1,
                    sustain: 0.3,
                    release: 1
                }
            }).toDestination()

            this.isInitialized = true
        } catch (error) {
            console.error('❌ Failed to initialize Tone.js:', error)
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
     * Load MIDI data from base64 buffer or ArrayBuffer
     * @param {string|ArrayBuffer} input - Base64 encoded MIDI file or raw ArrayBuffer
     */
    async loadMIDI(input) {
        try {
            let bytes;

            // Handle different input types
            if (input instanceof ArrayBuffer) {
                // Direct binary data
                bytes = new Uint8Array(input);
                console.log('🔍 MIDI buffer received as ArrayBuffer:', {
                    byteLength: input.byteLength,
                    firstBytes: Array.from(bytes.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(' ')
                });
            } else if (typeof input === 'string') {
                // Base64 encoded string
                const binaryString = atob(input);
                const len = binaryString.length;
                bytes = new Uint8Array(len);
                for (let i = 0; i < len; i++) {
                    bytes[i] = binaryString.charCodeAt(i) & 0xFF;
                }
                console.log('🔍 MIDI buffer decoded from base64:', {
                    base64Length: input.length,
                    binaryLength: len,
                    firstBytes: Array.from(bytes.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(' ')
                });
            } else {
                throw new Error('Invalid input type. Expected string (base64) or ArrayBuffer.');
            }

            // Log full buffer structure for deep debugging
            console.log('🔬 [MIDIPlayer] Full MIDI Buffer Analysis:')
            console.log('═'.repeat(80))
            
            const len = bytes.length;
            
            // Log first 128 bytes
            const first128 = Array.from(bytes.slice(0, Math.min(128, len)))
            console.log('First 128 bytes:')
            for (let i = 0; i < first128.length; i += 16) {
                const chunk = first128.slice(i, i + 16)
                const hex = chunk.map(b => b.toString(16).padStart(2, '0')).join(' ')
                const ascii = chunk.map(b => (b >= 32 && b < 127) ? String.fromCharCode(b) : '.').join('')
                console.log(`  ${i.toString(16).padStart(4, '0')}: ${hex.padEnd(48, ' ')} | ${ascii}`)
            }
            
            // Log last 64 bytes
            if (len > 128) {
                const last64 = Array.from(bytes.slice(Math.max(0, len - 64), len))
                console.log('\nLast 64 bytes:')
                for (let i = 0; i < last64.length; i += 16) {
                    const chunk = last64.slice(i, i + 16)
                    const hex = chunk.map(b => b.toString(16).padStart(2, '0')).join(' ')
                    const ascii = chunk.map(b => (b >= 32 && b < 127) ? String.fromCharCode(b) : '.').join('')
                    const offset = len - 64 + i
                    console.log(`  ${offset.toString(16).padStart(4, '0')}: ${hex.padEnd(48, ' ')} | ${ascii}`)
                }
            }
            
            console.log('═'.repeat(80))

            // Validate MIDI header before parsing
            if (bytes.length < 14 || bytes[0] !== 0x4D || bytes[1] !== 0x54 || bytes[2] !== 0x68 || bytes[3] !== 0x64) {
                throw new Error(`Invalid MIDI header. Expected "MThd" (4D 54 68 64), got: ${Array.from(bytes.slice(0, 4)).map(b => b.toString(16)).join(' ')}`)
            }

            // Parse MIDI using @tonejs/midi (NOT Tone.Midi from Tone.js)
            console.log('🎼 [MIDIPlayer] Attempting to parse MIDI with @tonejs/midi...')
            let midiData
            try {
                // Use @tonejs/midi parser (window.Midi from separate CDN package)
                if (typeof window.Midi === 'undefined') {
                    throw new Error('@tonejs/midi library not loaded! Add: <script src="https://unpkg.com/@tonejs/midi@2.0.28/build/Midi.js"></script>')
                }
                
                midiData = new window.Midi(bytes.buffer)
                
                console.log('✅ [MIDIPlayer] MIDI parsed successfully with @tonejs/midi:', {
                    name: midiData.name,
                    tracks: midiData.tracks.length,
                    duration: midiData.duration,
                    durationTicks: midiData.durationTicks,
                    header: {
                        name: midiData.header.name,
                        ppq: midiData.header.ppq,
                        tempos: midiData.header.tempos.length,
                        timeSignatures: midiData.header.timeSignatures.length
                    }
                })
                
                // Log track details
                midiData.tracks.forEach((track, idx) => {
                    console.log(`  Track ${idx}: ${track.name || 'Unnamed'} - ${track.notes.length} notes, instrument: ${track.instrument.name}`)
                })
                
            } catch (parseError) {
                console.error('❌ [MIDIPlayer] @tonejs/midi parsing failed:', parseError)
                console.error('   Error name:', parseError.name)
                console.error('   Error message:', parseError.message)
                console.error('   Error stack:', parseError.stack)
                
                throw new Error(`@tonejs/midi parsing failed: ${parseError.message}`)
            }
            
            // Validate parsed data
            if (!midiData || !midiData.tracks || midiData.tracks.length === 0) {
                throw new Error('Tone.Midi parsing resulted in 0 tracks - invalid MIDI data')
            }

            this.currentMidi = midiData
            this.duration = midiData.duration

            console.log(`🎵 MIDI loaded: ${midiData.tracks.length} tracks, ${this.duration}s duration`)

            return {
                success: true,
                duration: this.duration,
                trackCount: midiData.tracks.length,
                totalNotes: midiData.tracks.reduce((sum, track) => sum + track.notes.length, 0)
            }
        } catch (error) {
            console.error('❌ Failed to load MIDI:', error)
            throw error
        }
    }

    /**
     * Play the loaded MIDI
     */
    async play() {
        if (!this.isInitialized) {
            throw new Error('Player not initialized. Call init() first.')
        }

        if (!this.currentMidi || !this.currentMidi.tracks || this.currentMidi.tracks.length === 0) {
            throw new Error('No MIDI loaded. Call loadMIDI() first.')
        }

        if (this.isPlaying) return

        this.isPlaying = true
        this.isPaused = false

        // Resume from pause or start fresh
        const offset = this.pauseTime || 0
        const now = Tone.now()
        this.startTime = now - offset

        // Limpiar objeto de reproducción anterior si existe
        if (this.currentPlaybackObject) {
            try {
                this.currentPlaybackObject.stop()
                this.currentPlaybackObject.dispose()
                console.log('✅ Previous playback object cleaned up')
            } catch (e) {
                console.error('Error cleaning up previous playback object:', e)
            }
            this.currentPlaybackObject = null
        }

        // Asegurar que Tone.Transport esté corriendo
        if (Tone.Transport.state !== 'started') {
            Tone.Transport.start()
            console.log('🎼 Tone.Transport started')
        }

        // Crear array de eventos para Tone.Part
        const events = []

        // Schedule all notes from all tracks
        this.currentMidi.tracks.forEach((track, trackIndex) => {
            track.notes.forEach(note => {
                // Only schedule notes that haven't been played yet (after offset)
                if (note.time >= offset) {
                    const eventTime = note.time - offset
                    
                    // Añadir evento al array con pitch MIDI y tiempo absoluto
                    events.push({
                        time: Tone.Transport.seconds + eventTime,
                        midi: note.midi,
                        duration: note.duration,
                        velocity: note.velocity
                    })
                }
            })
        })

        // Crear Tone.Part para controlar la reproducción
        this.currentPlaybackObject = new Tone.Part((time, event) => {
            // Convertir MIDI a frecuencia en el callback
            const frequency = Tone.Frequency(event.midi, 'midi').toFrequency()
            this.synth.triggerAttackRelease(
                frequency,
                event.duration,
                time,
                event.velocity
            )
        }, events)

        // Iniciar la reproducción inmediatamente
        this.currentPlaybackObject.start()

        this.startProgressTracking()

        console.log('▶️ Playback started with Tone.Part')
    }

    /**
     * Start tracking playback progress
     */
    startProgressTracking() {
        const updateProgress = () => {
            if (!this.isPlaying) return

            const currentTime = Tone.now() - this.startTime
            const progress = Math.min(currentTime / this.duration, 1)

            // Emit progress event
            if (this.onProgress) {
                this.onProgress({
                    currentTime: currentTime,
                    totalTime: this.duration,
                    progress: progress
                })
            }

            // Auto-stop at end
            if (progress >= 1) {
                this.stopPlayback()
                if (this.onEnded) {
                    this.onEnded()
                }
                return
            }

            this.animationFrame = requestAnimationFrame(updateProgress)
        }

        this.animationFrame = requestAnimationFrame(updateProgress)
    }

    /**
     * Pause playback
     */
    pause() {
        if (!this.isPlaying) return

        this.isPlaying = false
        this.isPaused = true
        this.pauseTime = Tone.now() - this.startTime

        // Cancel all scheduled events
        Tone.Transport.cancel()

        // DETENER el transporte
        Tone.Transport.stop()

        // Detener el objeto de reproducción actual
        if (this.currentPlaybackObject) {
            try {
                this.currentPlaybackObject.stop()
                console.log('✅ Playback object paused')
            } catch (e) {
                console.error('Error pausing playback object:', e)
            }
        }

        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame)
        }

        console.log('⏸️ Playback paused')
    }

    /**
     * Stop playback and reset
     */
    stopPlayback() {
        this.isPlaying = false
        this.isPaused = false
        this.pauseTime = 0

        // Cancel all scheduled events
        Tone.Transport.cancel()

        // DETENER y resetear el transporte
        Tone.Transport.stop()

        // Detener y destruir la secuencia/parte activa
        if (this.currentPlaybackObject) {
            try {
                this.currentPlaybackObject.stop() // Detener la secuencia/parte
                this.currentPlaybackObject.dispose() // Liberar recursos
                console.log('✅ Playback object stopped and disposed')
            } catch (e) {
                console.error('Error stopping/disposing playback object:', e)
            }
            this.currentPlaybackObject = null // Limpiar referencia
        }

        // Release all synth voices to stop any hanging notes
        if (this.synth) {
            this.synth.releaseAll()
        }

        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame)
        }

        console.log('⏹️ Playback stopped completely')
    }

    /**
     * Seek to specific time
     * @param {number} time - Time in seconds
     */
    seek(time) {
        const wasPlaying = this.isPlaying

        if (wasPlaying) {
            this.stopPlayback()
        }

        this.pauseTime = Math.min(Math.max(time, 0), this.duration)

        if (wasPlaying) {
            this.play()
        }
    }

    /**
     * Get current playback state
     * @returns {Object} State object
     */
    getState() {
        return {
            isInitialized: this.isInitialized,
            isPlaying: this.isPlaying,
            isPaused: this.isPaused,
            currentTime: this.isPlaying ? Tone.now() - this.startTime : this.pauseTime,
            duration: this.duration,
            hasMidi: this.currentMidi !== null
        }
    }

    /**
     * Format time as MM:SS
     * @param {number} seconds - Time in seconds
     * @returns {string} Formatted time
     */
    static formatTime(seconds) {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }
}

// Export for use in other scripts
window.MIDIPlayer = MIDIPlayer
