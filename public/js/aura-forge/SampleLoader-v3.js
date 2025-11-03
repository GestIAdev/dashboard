/**
 * 🎹 SAMPLE LOADER - DYNAMIC PRESET LOADING FOR AURA FORGE
 * 
 * Carga dinámicamente samples de instrumentos por preset (cyberpunk-ambient, lo-fi-chill, etc.)
 * con FX chains profesionales, sistema de cache, y fallbacks inteligentes.
 * 
 * FEATURES:
 * - ✅ Lazy loading por preset (solo cargar el preset activo)
 * - ✅ Cache de samplers (evitar recargas innecesarias)
 * - ✅ FX chains automáticos por track (reverb, delay, compression, etc.)
 * - ✅ Fallback a synth si falta sample
 * - ✅ Soporte para drum kits (mapeo MIDI General MIDI)
 * - ✅ Pitched instruments (piano, strings, pads, etc.)
 * 
 * USAGE:
 * ```javascript
 * const loader = new SampleLoader()
 * await loader.loadPreset('cyberpunk-ambient')
 * const piano = await loader.getInstrument('melody', 'electric-piano/MED')
 * piano.triggerAttackRelease('C4', '2n')
 * ```
 * 
 * INTEGRATION:
 * - En MusicEnginePro.init(): await sampleLoader.loadPreset(preset)
 * - En generateMelodyLayer(): const sampler = await sampleLoader.getInstrument('melody', instrumentName)
 * - En generateRhythmLayer(): const drums = await sampleLoader.getInstrument('rhythm', 'drums')
 * 
 * AUTHOR: PunkClaude + Radwulf + PunkArchytect
 * DATE: 2025-11-02
 * 
 * NOTE: Tone.js se carga como script global en HTML, no como módulo ES6
 */

// Tone.js está disponible como global desde el HTML
// No necesitamos import, ya que se carga desde CDN

export class SampleLoader {
    constructor() {
        /**
         * @type {Object.<string, Object>} - Config de presets cargados
         * { 'cyberpunk-ambient': { preset: 'cyberpunk-ambient', tracks: {...} } }
         */
        this.presets = {}

        /**
         * @type {Object.<string, Tone.Sampler|Tone.Synth>} - Cache de instrumentos cargados
         * { 'cyberpunk-ambient/melody/electric-piano/MED': Tone.Sampler }
         */
        this.cache = {}

        /**
         * @type {string|null} - Preset actualmente cargado
         */
        this.activePreset = null

        /**
         * @type {string} - Base path para samples
         */
        this.basePath = '/samples'
    }

    // ============================================================================
    // PRESET LOADING
    // ============================================================================

    /**
     * Cargar preset completo (config.json)
     * @param {string} presetName - Nombre del preset (ej. 'cyberpunk-ambient')
     * @returns {Promise<Object>} - Configuración del preset
     */
    async loadPreset(presetName) {
        if (this.presets[presetName]) {
            console.log(`✅ [SampleLoader] Preset already loaded: ${presetName}`)
            return this.presets[presetName]
        }

        try {
            const configPath = `${this.basePath}/${presetName}/config.json`
            console.log(`🎹 [SampleLoader] Loading preset: ${presetName}`)
            console.log(`📄 [SampleLoader] Config path: ${configPath}`)

            const response = await fetch(configPath)
            if (!response.ok) {
                throw new Error(`Failed to load config: ${response.status} ${response.statusText}`)
            }

            const config = await response.json()
            this.presets[presetName] = config
            this.activePreset = presetName

            console.log(`✅ [SampleLoader] Preset loaded: ${presetName}`)
            console.log(`📊 [SampleLoader] Tracks: ${Object.keys(config.tracks).join(', ')}`)

            return config
        } catch (error) {
            console.error(`❌ [SampleLoader] Error loading preset ${presetName}:`, error)
            throw error
        }
    }

    /**
     * Cambiar preset activo (limpia cache del preset anterior)
     * @param {string} presetName - Nombre del nuevo preset
     */
    async switchPreset(presetName) {
        if (this.activePreset === presetName) {
            console.log(`✅ [SampleLoader] Already on preset: ${presetName}`)
            return
        }

        console.log(`🔄 [SampleLoader] Switching from ${this.activePreset} to ${presetName}`)

        // Limpiar cache del preset anterior
        this.clearCache()

        // Cargar nuevo preset
        await this.loadPreset(presetName)
    }

    // ============================================================================
    // INSTRUMENT LOADING
    // ============================================================================

    /**
     * Obtener instrumento (Sampler o Synth) por track y nombre
     * @param {string} trackName - Nombre del track ('melody', 'harmony', 'bass', 'rhythm', 'pad')
     * @param {string} instrumentKey - Nombre del instrumento (ej. 'electric-piano/MED', 'drums', 'pads/CeeVoice Pad')
     * @returns {Promise<Tone.Sampler|Tone.Synth>} - Instrumento listo para tocar
     */
    async getInstrument(trackName, instrumentKey) {
        if (!this.activePreset) {
            throw new Error('[SampleLoader] No active preset. Call loadPreset() first.')
        }

        const cacheKey = `${this.activePreset}/${trackName}/${instrumentKey}`

        // Check cache
        if (this.cache[cacheKey]) {
            console.log(`✅ [SampleLoader] Using cached instrument: ${cacheKey}`)
            return this.cache[cacheKey]
        }

        // Load instrument
        const config = this.presets[this.activePreset]
        const track = config.tracks[trackName]

        if (!track) {
            throw new Error(`[SampleLoader] Track not found: ${trackName}`)
        }

        const instrumentConfig = track.instruments[instrumentKey]

        if (!instrumentConfig) {
            console.warn(`⚠️  [SampleLoader] Instrument not found: ${trackName}/${instrumentKey}`)
            console.warn(`[SampleLoader] Available instruments: ${Object.keys(track.instruments).join(', ')}`)
            // Fallback to synth
            return this.createFallbackSynth(trackName)
        }

        let instrument

        if (instrumentConfig.type === 'drum-kit') {
            instrument = await this.loadDrumKit(instrumentConfig, trackName)
        } else {
            instrument = await this.loadPitchedInstrument(instrumentConfig, trackName, instrumentKey)
        }

        // Cache
        this.cache[cacheKey] = instrument

        return instrument
    }

    /**
     * Cargar drum kit (mapeo MIDI)
     * @private
     */
    async loadDrumKit(config, trackName) {
        console.log(`🥁 [SampleLoader] Loading drum kit for ${trackName}...`)

        const urls = {}
        const baseUrl = `${this.basePath}/${this.activePreset}/drums/`

        // 🔥 BUG #24 FIX FINAL: Convertir MIDI numbers a NOTE NAMES
        // Tone.Sampler NO funciona bien con MIDI numbers directos
        // Espera note names tipo "C2", "D2", "E2" para mapear correctamente
        for (const [midiNote, filename] of Object.entries(config.samples)) {
            const midiNumber = parseInt(midiNote, 10)
            // Convertir MIDI number a note name usando Tone.Frequency
            const noteName = Tone.Frequency(midiNumber, 'midi').toNote()
            urls[noteName] = filename
            console.log(`🔧 [SampleLoader] Mapping MIDI ${midiNumber} → ${noteName} → ${filename}`)
        }

        return new Promise((resolve, reject) => {
            const sampler = new Tone.Sampler({
                urls,
                baseUrl,
                volume: 6, // 🔥 BOOST: +6dB para drums (snare/hihat muy bajos)
                attack: 0.001, // 🔧 Attack instantáneo para drums
                release: 0.3,  // 🔧 Release corto (300ms)
                onload: () => {
                    console.log(`✅ [SampleLoader] Drum kit loaded: ${Object.keys(urls).length} samples`)
                    console.log(`🔍 [SampleLoader] Available drum NOTE keys:`, Object.keys(urls))
                    console.log(`🔊 [SampleLoader] Drum volume: +6dB boost applied`)
                    
                    // 🧪 TEST: Verificar que samples se cargaron correctamente
                    console.log(`🧪 [SampleLoader] Testing drum samples...`)
                    setTimeout(() => {
                        const kick = Tone.Frequency(36, 'midi').toNote()
                        console.log(`🥁 TEST: Trigger kick (36 = ${kick})`)
                        sampler.triggerAttackRelease(kick, 0.1, undefined, 1)
                        
                        setTimeout(() => {
                            const snare = Tone.Frequency(38, 'midi').toNote()
                            console.log(`🥁 TEST: Trigger snare (38 = ${snare})`)
                            sampler.triggerAttackRelease(snare, 0.1, undefined, 1)
                        }, 500)
                        
                        setTimeout(() => {
                            const hihatClose = Tone.Frequency(42, 'midi').toNote()
                            console.log(`🥁 TEST: Trigger hihat-close (42 = ${hihatClose})`)
                            sampler.triggerAttackRelease(hihatClose, 0.1, undefined, 1)
                        }, 1000)
                        
                        setTimeout(() => {
                            const hihatOpen = Tone.Frequency(46, 'midi').toNote()
                            console.log(`🥁 TEST: Trigger hihat-open (46 = ${hihatOpen})`)
                            sampler.triggerAttackRelease(hihatOpen, 0.1, undefined, 1)
                        }, 1500)
                    }, 1000) // Esperar 1s después de cargar
                    
                    // Aplicar FX chain
                    const fxChain = this.buildFXChain(config.effects || {})
                    if (fxChain.length > 0) {
                        sampler.chain(...fxChain, Tone.Destination)
                    } else {
                        sampler.toDestination()
                    }

                    resolve(sampler)
                },
                onerror: (error) => {
                    console.error(`❌ [SampleLoader] Error loading drum kit:`, error)
                    reject(error)
                }
            })
        })
    }

    /**
     * Cargar instrumento melódico (piano, synth, strings, etc.)
     * @private
     */
    async loadPitchedInstrument(config, trackName, instrumentKey) {
        console.log(`🎹 [SampleLoader] Loading ${trackName}/${instrumentKey}...`)

        const urls = {}
        const baseUrl = `${this.basePath}/${this.activePreset}/`

        // Paths sin espacios - nombres limpios con guiones bajos
        for (const [note, filepath] of Object.entries(config.samples)) {
            urls[note] = filepath
        }

        return new Promise((resolve, reject) => {
            const sampler = new Tone.Sampler({
                urls,
                baseUrl,
                onload: () => {
                    console.log(`✅ [SampleLoader] Instrument loaded: ${Object.keys(urls).length} samples`)
                    
                    // Aplicar FX chain
                    const fxChain = this.buildFXChain(config.effects || {})
                    if (fxChain.length > 0) {
                        sampler.chain(...fxChain, Tone.Destination)
                    } else {
                        sampler.toDestination()
                    }

                    resolve(sampler)
                },
                onerror: (error) => {
                    console.error(`❌ [SampleLoader] Error loading instrument:`, error)
                    reject(error)
                }
            })
        })
    }

    // ============================================================================
    // FX CHAIN BUILDER
    // ============================================================================

    /**
     * Construir cadena de efectos según configuración
     * @private
     * @param {Object} effectsConfig - Configuración de efectos del instrumento
     * @returns {Array<Tone.Effect>} - Array de efectos conectables
     */
    buildFXChain(effectsConfig) {
        const chain = []

        // REVERB
        if (effectsConfig.reverb) {
            const reverb = new Tone.Reverb({
                decay: effectsConfig.reverb.decay || 2.0,
                wet: effectsConfig.reverb.wet || 0.3
            })
            chain.push(reverb)
        }

        // DELAY
        if (effectsConfig.delay) {
            const delay = new Tone.FeedbackDelay({
                delayTime: effectsConfig.delay.time || '8n',
                feedback: effectsConfig.delay.feedback || 0.25,
                wet: effectsConfig.delay.wet || 0.25
            })
            chain.push(delay)
        }

        // CHORUS
        if (effectsConfig.chorus) {
            const chorus = new Tone.Chorus({
                frequency: effectsConfig.chorus.frequency || 0.5,
                delayTime: effectsConfig.chorus.delayTime || 3.5,
                depth: effectsConfig.chorus.depth || 0.7,
                wet: effectsConfig.chorus.wet || 0.3
            })
            chain.push(chorus)
        }

        // COMPRESSION
        if (effectsConfig.compression) {
            const compressor = new Tone.Compressor({
                threshold: effectsConfig.compression.threshold || -12,
                ratio: effectsConfig.compression.ratio || 4
            })
            chain.push(compressor)
        }

        // SATURATION
        if (effectsConfig.saturation) {
            const distortion = new Tone.Distortion({
                distortion: effectsConfig.saturation.drive || 0.3
            })
            chain.push(distortion)
        }

        // FILTER (opcional)
        if (effectsConfig.filter) {
            const filter = new Tone.Filter({
                frequency: effectsConfig.filter.frequency || 1200,
                type: effectsConfig.filter.type || 'lowpass',
                rolloff: effectsConfig.filter.rolloff || -24
            })
            chain.push(filter)
        }

        // STEREO WIDTH (Widener)
        if (effectsConfig.stereoWidth) {
            const widener = new Tone.StereoWidener(effectsConfig.stereoWidth)
            chain.push(widener)
        }

        return chain
    }

    // ============================================================================
    // FALLBACKS
    // ============================================================================

    /**
     * Crear synth de fallback si no hay samples disponibles
     * @private
     * @param {string} trackName - Nombre del track
     * @returns {Tone.Synth} - Synth sintético
     */
    createFallbackSynth(trackName) {
        console.warn(`⚠️  [SampleLoader] Creating fallback synth for ${trackName}`)

        const synthConfig = {
            melody: { oscillator: { type: 'sawtooth' }, envelope: { attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.5 } },
            harmony: { oscillator: { type: 'sine' }, envelope: { attack: 0.5, decay: 1.0, sustain: 0.7, release: 2.0 } },
            bass: { oscillator: { type: 'triangle' }, envelope: { attack: 0.05, decay: 0.2, sustain: 0.8, release: 1.0 } },
            pad: { oscillator: { type: 'sine' }, envelope: { attack: 1.0, decay: 2.0, sustain: 0.8, release: 3.0 } }
        }

        const config = synthConfig[trackName] || synthConfig.melody
        const synth = new Tone.PolySynth(Tone.Synth, config).toDestination()

        return synth
    }

    // ============================================================================
    // CACHE MANAGEMENT
    // ============================================================================

    /**
     * Limpiar cache de instrumentos (para cambio de preset)
     */
    clearCache() {
        console.log(`🧹 [SampleLoader] Clearing cache...`)
        
        for (const [key, instrument] of Object.entries(this.cache)) {
            if (instrument.dispose) {
                instrument.dispose()
            }
        }

        this.cache = {}
        console.log(`✅ [SampleLoader] Cache cleared`)
    }

    /**
     * Obtener estadísticas del cache
     */
    getCacheStats() {
        return {
            activePreset: this.activePreset,
            cachedInstruments: Object.keys(this.cache).length,
            loadedPresets: Object.keys(this.presets).length
        }
    }

    // ============================================================================
    // UTILITY
    // ============================================================================

    /**
     * Listar todos los instrumentos disponibles en el preset activo
     * @returns {Object} - Instrumentos por track
     */
    listAvailableInstruments() {
        if (!this.activePreset) {
            console.warn('[SampleLoader] No active preset')
            return {}
        }

        const config = this.presets[this.activePreset]
        const instruments = {}

        for (const [trackName, track] of Object.entries(config.tracks)) {
            instruments[trackName] = Object.keys(track.instruments)
        }

        return instruments
    }

    /**
     * Precargar todos los instrumentos de un track (para evitar lag al reproducir)
     * @param {string} trackName - Nombre del track a precargar
     */
    async preloadTrack(trackName) {
        const instruments = this.listAvailableInstruments()[trackName] || []
        
        console.log(`⏳ [SampleLoader] Preloading track: ${trackName} (${instruments.length} instruments)`)

        const promises = instruments.map(inst => this.getInstrument(trackName, inst))
        
        await Promise.all(promises)
        
        console.log(`✅ [SampleLoader] Track preloaded: ${trackName}`)
    }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

/**
 * Singleton instance para usar en todo Aura Forge
 */
export const globalSampleLoader = new SampleLoader()
