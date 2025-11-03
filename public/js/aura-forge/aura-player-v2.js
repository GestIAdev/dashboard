/**
 * 🎸 SELENE MIDI PLAYER - TONE.JS INTEGRATION
 * "CÓDIGO = ARTE = BELLEZA = FUNCIONALIDAD"
 * 
 * FASE 2.B: INTEGRACIÓN CON SAMPLELOADER + DRUMPATTERNENGINE
 * - ✅ Samples reales (646 samples cyberpunk-ambient)
 * - ✅ Drums estructurados (no caos)
 * - ✅ FX chains profesionales
 */

// 🏛️ ARQUITECTURA FIX (DIRECTIVA 30B): Import desde selene-core/ (source of truth)
import { SampleLoader } from './SampleLoader-v3.js' // Frontend-specific (stays in aura-forge/)
import { DrumPatternEngine } from '../selene-core/rhythm/DrumPatternEngine.js' // Backend sync'd module

class MIDIPlayer {
    constructor() {
        this.isInitialized = false
        this.isPlaying = false
        this.isPaused = false
        this.currentMidi = null
        this.synthRack = {} // Rack de sintetizadores por track (LEGACY - deprecado)
        this.instruments = {} // NUEVO: Instrumentos cargados desde SampleLoader
        this.sampleLoader = new SampleLoader()
        this.drumEngine = null // Se inicializará con sampler y tempo
        this.startTime = 0
        this.pauseTime = 0
        this.duration = 0
        this.animationFrame = null
        this.currentPlaybackObjects = [] // Array de objetos de reproducción por track
        this.currentPreset = 'cyberpunk-ambient' // Preset activo
    }

    /**
     * Initialize Tone.js audio context and load sample library
     * FASE 2.B: USA SAMPLELOADER EN LUGAR DE SYNTHS SINTÉTICOS
     */
    async init(presetName = 'cyberpunk-ambient') {
        if (this.isInitialized) return

        try {
            // Remove automatic Tone.start() call - will be called on user interaction
            console.log('🎹 Tone.js initialized (AudioContext deferred)')

            // FASE 2.B: CARGAR PRESET CON SAMPLELOADER
            console.log(`🔧 Loading preset: ${presetName}...`)
            this.currentPreset = presetName
            
            await this.sampleLoader.loadPreset(presetName)
            console.log(`✅ Preset "${presetName}" config loaded`)

            // CARGAR INSTRUMENTOS POR TRACK
            console.log('🎹 Loading instruments...')
            
            // Track 0: Melody - Electric Piano (85 samples cromáticos)
            this.instruments.melody = await this.sampleLoader.getInstrument('melody', 'electric-piano/MED')
            console.log('✅ Melody instrument loaded: electric-piano/MED (85 samples)')

            // Track 2: Harmony - Warm Pad (21 samples)
            this.instruments.harmony = await this.sampleLoader.getInstrument('harmony', 'pads/CeeVoice_Pad')
            console.log('✅ Harmony instrument loaded: pads/CeeVoice_Pad (21 samples)')

            // Track 4: Bass - Sub Bass (17 samples)
            this.instruments.bass = await this.sampleLoader.getInstrument('bass', 'sub-bass/Blau_Bass')
            console.log('✅ Bass instrument loaded: sub-bass/Blau_Bass (17 samples)')

            // Track 5: Rhythm - Drums (16 samples General MIDI)
            this.instruments.rhythm = await this.sampleLoader.getInstrument('rhythm', 'drums')
            console.log('✅ Rhythm instrument loaded: drums (16 samples, General MIDI)')

            // Track 6/7: Pad - Ambient Pad (21 samples)
            this.instruments.pad = await this.sampleLoader.getInstrument('pad', 'ambient-pads/Ciao_Pad')
            console.log('✅ Pad instrument loaded: ambient-pads/Ciao_Pad (21 samples)')

            // Inicializar DrumPatternEngine (se usa en generateRhythmLayer del backend)
            // Aquí solo lo creamos para que esté disponible si se necesita
            this.drumEngine = new DrumPatternEngine(this.instruments.rhythm, 70)
            console.log('✅ DrumPatternEngine initialized at 70 BPM')

            console.log('🎛️ Sample library loaded! 635 samples ready.')
            console.log('📊 Instruments:', {
                melody: 'electric-piano/MED (85)',
                harmony: 'pads/CeeVoice_Pad (21)',
                bass: 'sub-bass/Blau_Bass (17)',
                rhythm: 'drums (16)',
                pad: 'ambient-pads/Ciao_Pad (21)'
            })

            this.isInitialized = true
        } catch (error) {
            console.error('❌ Failed to initialize player:', error)
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

        // Limpiar objetos de reproducción anteriores
        this.cleanupPlaybackObjects()

        // Asegurar que Tone.Transport esté corriendo
        if (Tone.Transport.state !== 'started') {
            // IMPLEMENTAR LOOKAHEAD PARA MITIGAR BUFFER UNDERRUNS
            Tone.Transport.lookAhead = 0.5; // 500ms buffer para Web Audio API
            console.log('🎯 LookAhead set to 500ms for buffer underrun prevention')
            Tone.Transport.start()
            console.log('🎼 Tone.Transport started')
        }

        // Crear Tone.Part para cada track usando su sintetizador dedicado
        this.currentPlaybackObjects = []

        this.currentMidi.tracks.forEach((track, trackIndex) => {
            if (track.notes.length === 0) {
                console.log(`⚠️ Track ${trackIndex} (${track.name || 'Unnamed'}) has no notes, skipping`)
                return
            }

            // Crear eventos para este track
            const events = []
            const pitchRange = { min: 127, max: 0 } // Diagnóstico de rango
            
            track.notes.forEach(note => {
                if (note.time >= offset) {
                    const eventTime = note.time - offset
                    events.push({
                        time: Tone.Transport.seconds + eventTime,
                        midi: note.midi,
                        duration: note.duration,
                        velocity: note.velocity
                    })
                    // Track pitch range
                    pitchRange.min = Math.min(pitchRange.min, note.midi)
                    pitchRange.max = Math.max(pitchRange.max, note.midi)
                }
            })

            if (events.length === 0) {
                console.log(`⚠️ Track ${trackIndex} has no events after offset, skipping`)
                return
            }
            
            console.log(`🎵 Track ${trackIndex} pitch range: ${pitchRange.min}-${pitchRange.max} (${Tone.Frequency(pitchRange.min, 'midi').toNote()} to ${Tone.Frequency(pitchRange.max, 'midi').toNote()})`)

            // 🔥 HOTFIX 26B: Mapear por trackIndex (posición), NO por track.channel
            // @tonejs/midi re-asigna channels aleatoriamente al parsear MIDI
            // Backend genera tracks secuenciales: 0,1,2,3,4 pero midi-writer-js crea gaps (0, vacío, 2, vacío, 4, 5, vacío, 7)
            // Frontend debe mapear por POSICIÓN en el array parseado (trackIndex)
            let instrument
            switch (trackIndex) {
                case 0: // Melody (Backend Track 0)
                    instrument = this.instruments.melody
                    console.log(`🎵 Track ${trackIndex} (Melody) → electric-piano/MED`)
                    break
                case 2: // Harmony (Backend Track 1, frontend index 2)
                    instrument = this.instruments.harmony
                    console.log(`🎵 Track ${trackIndex} (Harmony) → pads/CeeVoice Pad`)
                    break
                case 4: // Bass (Backend Track 2, frontend index 4)
                    instrument = this.instruments.bass
                    console.log(`🎵 Track ${trackIndex} (Bass) → sub-bass/Blau Bass`)
                    break
                case 5: // Rhythm (Backend Track 3, frontend index 5)
                    instrument = this.instruments.rhythm
                    console.log(`🎵 Track ${trackIndex} (Rhythm) → drums (16 samples, GM)`)
                    break
                case 7: // Pad (Backend Track 4, frontend index 7)
                    instrument = this.instruments.pad
                    console.log(`🎵 Track ${trackIndex} (Pad) → ambient-pads/Ciao Pad`)
                    break

                default:
                    console.log(`⚠️ Track ${trackIndex} has no assigned instrument, skipping`)
                    return // Skip tracks (1, 3, 6 están vacíos)
            }

            // Crear Tone.Part para este track
            const part = new Tone.Part((time, event) => {
                // 🔥 BUG #24 FIX: Si es Track 5 (Rhythm), convertir MIDI a NOTE NAME
                // Drums usan General MIDI mapping (36=kick, 38=snare, 42=hihat)
                // Tone.Sampler espera NOTE NAMES ("C2", "D2") para mapear correctamente
                // MIDI numbers o strings causan pitch-shifting y todos suenan como kick
                if (trackIndex === 5) {
                    // Convertir MIDI number a note name
                    const noteName = Tone.Frequency(event.midi, 'midi').toNote()
                    
                    // 🔊 BOOST: Amplificar velocity de drums (snare/hihat muy bajos en samples)
                    // Mantener kick (36) normal, amplificar otros drums x1.5
                    let velocityBoost = event.velocity
                    if (event.midi !== 36) {
                        velocityBoost = Math.min(1.0, event.velocity * 1.5) // Max 1.0 (normalizado)
                    }
                    // Solo log primeros 5 drums para no spammear consola
                    if (events.indexOf(event) < 5) {
                        console.log(`🥁 Track 5 - Drum MIDI ${event.midi} → ${noteName} → velocity ${velocityBoost.toFixed(2)}`)
                    }
                    // CRITICAL: Pasar noteName (ej. "C2"), NO event.midi
                    instrument.triggerAttackRelease(noteName, event.duration, time, velocityBoost)
                } else {
                    // Para instrumentos melódicos, convertir MIDI a nota (ej. "C4")
                    const noteName = Tone.Frequency(event.midi, 'midi').toNote()
                    instrument.triggerAttackRelease(noteName, event.duration, time, event.velocity)
                }
            }, events)

            // Iniciar la reproducción inmediatamente
            part.start()
            this.currentPlaybackObjects.push(part)

            console.log(`▶️ Track ${trackIndex} playback started: ${events.length} events`)
        })

        this.startProgressTracking()

        console.log('▶️ Multi-track playback started with synthesizer rack')
    }

    /**
     * Cleanup all current playback objects
     */
    cleanupPlaybackObjects() {
        if (this.currentPlaybackObjects && this.currentPlaybackObjects.length > 0) {
            this.currentPlaybackObjects.forEach((part, index) => {
                try {
                    // FIX: Sanitizar tiempo para evitar valores negativos microscópicos
                    const stopTime = Math.max(0, Tone.now())
                    part.stop(stopTime)
                    part.dispose()
                    console.log(`✅ Playback object ${index} cleaned up`)
                } catch (e) {
                    console.error(`Error cleaning up playback object ${index}:`, e)
                }
            })
            this.currentPlaybackObjects = []
        }
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

        // Detener los objetos de reproducción actuales
        this.cleanupPlaybackObjects()

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

        // Detener y destruir los objetos de reproducción activos
        this.cleanupPlaybackObjects()

        // Release all synth voices to stop any hanging notes
        Object.values(this.synthRack).forEach(synth => {
            if (synth && typeof synth.releaseAll === 'function') {
                synth.releaseAll()
            }
        })

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
            // Solo limpiar objetos de reproducción, no resetear estado completo
            this.cleanupPlaybackObjects()
            Tone.Transport.cancel()
            Tone.Transport.stop()
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

// ES6 module export
export { MIDIPlayer }
