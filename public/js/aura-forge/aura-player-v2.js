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

            // 🔥 FRENTE #2: ARSENAL DINÁMICO - Cargar instrumentos desde config.json
            console.log(`🔧 Loading preset: ${presetName}...`)
            this.currentPreset = presetName
            
            // 1. Cargar config del preset
            await this.sampleLoader.loadPreset(presetName)
            const config = this.sampleLoader.presets[presetName]

            if (!config) {
                console.error(`[MIDIPlayer] ❌ Fallo al cargar config del preset: ${presetName}`)
                this.isInitialized = false
                return
            }

            console.log(`[MIDIPlayer] 🎛️ Inicializando arsenal dinámico para preset: ${presetName}`)

            // 2. Iterar sobre los tracks definidos en el config
            const trackNames = Object.keys(config.tracks)
            let totalSamplesLoaded = 0
            let totalInstrumentsLoaded = 0

            // 🔥 FRENTE #5.1: ARSENAL COMPLETO - Cargar TODOS los instrumentos (no solo el primero)
            for (const trackName of trackNames) {
                const trackConfig = config.tracks[trackName]
                
                // 3. Obtener TODOS los instrumentos definidos para ese track
                const instrumentKeys = Object.keys(trackConfig.instruments)

                if (instrumentKeys.length === 0) {
                    console.warn(`[MIDIPlayer] ⚠️ No se encontraron instrumentos para el track: ${trackName}`)
                    continue
                }

                // 🎨 IMPROVISACIÓN: Estructura anidada this.instruments[trackName][instrumentKey]
                this.instruments[trackName] = {}

                console.log(`[MIDIPlayer] 🔧 Cargando ${instrumentKeys.length} instrumentos para track '${trackName}'...`)

                for (const instrumentKey of instrumentKeys) {
                    try {
                        // 4. Cargar CADA sampler dinámicamente
                        const sampler = await this.sampleLoader.getInstrument(trackName, instrumentKey)
                        this.instruments[trackName][instrumentKey] = sampler
                        
                        const sampleCount = Object.keys(trackConfig.instruments[instrumentKey].samples).length
                        totalSamplesLoaded += sampleCount
                        totalInstrumentsLoaded++
                        
                        console.log(`[MIDIPlayer]   ✅ Instrumento '${instrumentKey}': ${sampleCount} samples cargados`)

                    } catch (error) {
                        console.error(`[MIDIPlayer]   ❌ Fallo al cargar instrumento '${instrumentKey}' para track '${trackName}'`, error)
                    }
                }

                console.log(`[MIDIPlayer] 🎸 Track '${trackName}' completo: ${Object.keys(this.instruments[trackName]).length} instrumentos disponibles`)
            }

            // 5. Validar y actualizar el DrumEngine
            if (this.instruments['rhythm']) {
                // 🔥 FRENTE #5.1: Usar el PRIMER instrumento de rhythm para DrumEngine
                // this.instruments['rhythm'] ahora es un objeto { instrumentKey: sampler }
                const rhythmInstrumentKeys = Object.keys(this.instruments['rhythm'])
                
                if (rhythmInstrumentKeys.length > 0) {
                    const firstRhythmInstrument = rhythmInstrumentKeys[0]
                    const rhythmSampler = this.instruments['rhythm'][firstRhythmInstrument]
                    
                    // Inicializar DrumPatternEngine con el sampler de rhythm cargado dinámicamente
                    const globalTempo = 70 // TODO: obtener del config o StylePreset
                    this.drumEngine = new DrumPatternEngine(rhythmSampler, globalTempo)
                    console.log(`[MIDIPlayer] 🥁 DrumPatternEngine inicializado con sampler '${firstRhythmInstrument}' a ${globalTempo} BPM`)
                } else {
                    console.warn("[MIDIPlayer] ⚠️ El track 'rhythm' no tiene instrumentos cargados. DrumEngine no inicializado.")
                }
            } else {
                console.warn("[MIDIPlayer] ⚠️ El track 'rhythm' no se cargó. DrumEngine no inicializado.")
            }

            console.log(`🎛️ [MIDIPlayer] Arsenal dinámico cargado. ${totalInstrumentsLoaded} instrumentos (${totalSamplesLoaded}+ samples) listos.`)
            console.log(`📊 [MIDIPlayer] Tracks cargados: ${Object.keys(this.instruments).join(', ')}`)

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

            // 🔧 FASE 3.12 (CONTRATO POR ÍNDICE): MAPEO VÍA ÍNDICE DE TRACK
            // 
            // ARQUITECTURA (Blueprint actualizado - Workaround para @tonejs/midi bug):
            // 1. Validar que track tiene notas (skip si vacío)
            // 2. Obtener trackType usando ÍNDICE DEL TRACK (no canal ni nombre)
            // 3. Verificar si reconocemos este trackType
            // 4. Seleccionar primer instrumento disponible
            // 5. Skip si no reconocido
            // 
            // MAPPING POR ÍNDICE:
            // - Track 0 = tempo (skip - no tiene notas)
            // - Track 1 = melody
            // - Track 2 = harmony
            // - Track 3 = bass
            // - Track 4 = rhythm (drums)
            // - Track 5 = pad
            //
            // NOTA: @tonejs/midi y midi-writer-js son incompatibles.
            // midi-writer-js escribe 6 tracks (1 tempo + 5 música) pero
            // @tonejs/midi los parsea como 8 tracks con algunos vacíos.
            // Solución: mapear por índice y skip tracks vacíos.
            // 
            // ROBUSTEZ:
            // - NUNCA crashea
            // - Logging claro para debugging
            
            let instrument = null
            
            // 1️⃣ VALIDACIÓN: Skip si track vacío
            if (!track.notes || track.notes.length === 0) {
                console.log(`⚠️ Track ${trackIndex} (${track.name || 'Vacío'}) no tiene notas, saltando.`)
                return
            }
            
            // 2️⃣ OBTENER TRACK TYPE usando el ÍNDICE del track (orden predecible)
            // @tonejs/midi parsea de forma rara: algunos tracks vacíos intercalados
            // Empiricamente observado (logs del navegador):
            // Track 0 → melody (115 notes)
            // Track 1 → vacío (skip)
            // Track 2 → harmony (456 notes)
            // Track 3 → vacío (skip)
            // Track 4 → bass (86 notes)
            // Track 5 → rhythm (242 notes)
            // Track 6 → vacío (skip)
            // Track 7 → pad (100 notes)
            let trackType = ''
            const trackMapping = [
                'melody',   // Track 0 (primer track con notas)
                'skip',     // Track 1 (vacío)
                'harmony',  // Track 2
                'skip',     // Track 3 (vacío)
                'bass',     // Track 4
                'rhythm',   // Track 5
                'skip',     // Track 6 (vacío)
                'pad'       // Track 7
            ]
            
            trackType = trackMapping[trackIndex] || 'melody' // fallback a melody
            
            // Skip si es un track fantasma
            if (trackType === 'skip') {
                console.log(`⚠️ Track ${trackIndex} es un track fantasma (bug @tonejs/midi), saltando.`)
                return
            }
            
            console.log(`🔍 Track ${trackIndex} detected by INDEX → trackType "${trackType}" (${track.notes.length} notes)`)
            
            // 3️⃣ VERIFICAR SI RECONOCEMOS ESTE TRACKTYPE
            if (this.instruments[trackType]) {
                
                // 4️⃣ SELECCIONAR EL INSTRUMENTO (Lógica FRENTE #5)
                // Por ahora, seleccionamos el *primero* disponible.
                // (El backend aún no nos dice cuál usar, FRENTE #5.3 falló)
                
                const instrumentKey = Object.keys(this.instruments[trackType])[0]

                if (instrumentKey) {
                    instrument = this.instruments[trackType][instrumentKey]
                    console.log(`🎵 Track ${trackIndex} (${track.name}) → ${instrumentKey} (Mapeo Simple)`)
                } else {
                    console.error(`❌ Track ${trackIndex} (${track.name}) reconocido, pero no tiene instrumentos cargados.`)
                }

            } else {
                // 5️⃣ SI NO SE RECONOCE, SALTAR
                console.warn(`⚠️ Track ${trackIndex} (${track.name || 'Vacío'}) no reconocido o no mapeado. Saltando.`)
            }
            
            // 6️⃣ SKIP SI NO HAY INSTRUMENTO
            if (!instrument) {
                return
            }
            
            // 🔥 Determinar si es track de rhythm (para conversión MIDI → note name)
            const mappedTrack = trackType || 'melody' // Fallback a melody si no se determinó

            // Crear Tone.Part para este track
            const part = new Tone.Part((time, event) => {
                // 🔥 BUG #24 FIX: Si es Rhythm track, convertir MIDI a NOTE NAME
                // Drums usan General MIDI mapping (36=kick, 38=snare, 42=hihat)
                // Tone.Sampler espera NOTE NAMES ("C2", "D2") para mapear correctamente
                // MIDI numbers o strings causan pitch-shifting y todos suenan como kick
                if (mappedTrack === 'rhythm') {
                    // Convertir MIDI number a note name
                    const noteName = Tone.Frequency(event.midi, 'midi').toNote()
                    
                    // 🔊 BOOST: Amplificar velocity de drums (snare/hihat muy bajos en samples)
                    // Mantener kick (36) normal, amplificar otros drums x2.5 (FASE 3.12 - más volumen!)
                    let velocityBoost = event.velocity
                    if (event.midi !== 36) {
                        velocityBoost = Math.min(1.0, event.velocity * 2.5) // Max 1.0 (normalizado)
                    }
                    // Solo log primeros 5 drums para no spammear consola
                    if (events.indexOf(event) < 5) {
                        console.log(`🥁 Rhythm track - Drum MIDI ${event.midi} → ${noteName} → velocity ${velocityBoost.toFixed(2)} (boost x2.5)`)
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
