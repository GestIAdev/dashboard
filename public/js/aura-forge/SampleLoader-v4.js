/**
 * 🎹 SAMPLE LOADER V4 - SCHERZO SÓNICO (Fase 5.11 - FRENTE #B)
 * 
 * REPARACIONES CRÍTICAS (Fase 5.11):
 * - ✅ **BUG #1 REPARADO**: Heurística eliminada - instrumentKey ES la ruta relativa
 * - ✅ **BUG #2 REPARADO**: Multisamples usan config.json generado por create-multisample-configs.js
 * 
 * Arquitectura inteligente para manejar:
 * - **Multisamples**: Carpetas con config.json (mapeo nota → archivo)
 * - **Oneshots**: Archivos individuales con pitch-shifting automático (Tone.Sampler con 1 nota)
 * - **Drumkits**: Mapeo MIDI → samples explícito desde backend
 * 
 * DIFERENCIAS CON V3:
 * - ✅ Método `getInstrument(trackType, instrumentKey, instrumentType)` con type explícito
 * - ✅ Lógica `loadMultisample()` vs `loadOneshot()` vs `loadDrumKit()`
 * - ✅ Cache por `${preset}/${instrumentKey}` (sin trackType duplicado)
 * - ✅ instrumentKey ES la ruta relativa (ej: 'melody/strings/Cello')
 * - ✅ Fallback automático a synth si falla carga
 * 
 * AUTHOR: PunkClaude + Radwulf + PunkArchytect
 * DATE: 2025-11-04
 * VERSION: 4.1 (Scherzo de Automatización)
 */

export class SampleLoaderV4 {
    constructor() {
        /**
         * @type {Object.<string, Tone.Sampler|Tone.Synth>} - Cache de instrumentos cargados
         * { 'cyberpunkpreset/melody/melody-pluck-MAX': Tone.Sampler }
         */
        this.cache = {}

        /**
         * @type {string} - Preset actualmente activo
         */
        this.activePreset = null

        /**
         * @type {string} - Base path para samples
         */
        this.basePath = '/samples'
    }

    /**
     * 🎯 MÉTODO PRINCIPAL: Obtener instrumento (multisample, oneshot o drumkit)
     * 
     * @param {string} trackType - Tipo de track ('melody', 'harmony', 'bass', 'rhythm', 'pad')
     * @param {string} instrumentKey - Ruta relativa (ej: 'melody/strings/Cello', 'Bass/sub-bass/oneshot/oneshot2/subs-9')
     * @param {'multisample'|'oneshot'|'drumkit'} instrumentType - Tipo de instrumento
     * @param {Object.<number, string>} [samples] - Solo para drumkit: mapeo MIDI → sample path
     * @returns {Promise<Tone.Sampler|Tone.Synth>} - Instrumento listo para tocar
     */
    async getInstrument(trackType, instrumentKey, instrumentType, samples = null) {
        // 🔥 FASE 5.11: Cache sin trackType (instrumentKey ya es la ruta completa)
        const cacheKey = `${this.activePreset}/${instrumentKey}`

        // 🔄 Check cache
        if (this.cache[cacheKey]) {
            console.log(`✅ [SampleLoader V4] Using cached instrument: ${cacheKey}`)
            return this.cache[cacheKey]
        }

        console.log(`🎹 [SampleLoader V4] Loading ${instrumentType}: ${trackType}/${instrumentKey}`)

        let sampler

        try {
            if (instrumentType === 'multisample') {
                // 🎼 Carpeta con config.json (mapeo nota → archivo)
                sampler = await this.loadMultisample(instrumentKey)
            } else if (instrumentType === 'drumkit') {
                // 🥁 FASE 5.2: Drum kit con mapeo MIDI → samples explícito
                sampler = await this.loadDrumKit(instrumentKey, samples)
            } else {
                // 🎵 Archivo individual con pitch-shifting automático
                sampler = await this.loadOneshot(instrumentKey)
            }

            // Cache
            this.cache[cacheKey] = sampler

            console.log(`✅ [SampleLoader V4] Loaded ${instrumentType}: ${instrumentKey}`)
            return sampler

        } catch (error) {
            console.error(`❌ [SampleLoader V4] Error loading ${instrumentKey}:`, error)
            
            // 🆘 Fallback a synth
            console.log(`🔄 [SampleLoader V4] Fallback to synth for ${trackType}`)
            return this.createFallbackSynth(trackType)
        }
    }

    /**
     * 🎼 LOAD MULTISAMPLE: Carpeta con config.json (mapeo nota → archivo)
     * 
     * ESTRATEGIA (Fase 5.11 - BUG #2 REPARADO):
     * 1. Construir ruta a la carpeta: /samples/cyberpunkpreset/{instrumentKey}
     * 2. Leer config.json generado por create-multisample-configs.js
     * 3. Cargar Tone.Sampler con mapeo del JSON (ej: { "C2": "cello-c2.wav" })
     * 
     * ELIMINADO:
     * - ❌ Heurística de detección de layer prefix (needsLayerPrefix)
     * - ❌ Sparse sampling hardcoded (buildSampleMap con octavas 1-4)
     * 
     * NUEVO:
     * - ✅ instrumentKey ES la ruta completa (ej: 'melody/strings/Cello')
     * - ✅ config.json define qué samples cargar (fuente de verdad)
     * 
     * @param {string} instrumentKey - Ruta relativa (ej: 'melody/strings/Cello')
     * @returns {Promise<Tone.Sampler>}
     */
    async loadMultisample(instrumentKey) {
        // 🔥 FASE 5.11 - BUG #1 REPARADO: instrumentKey ES la ruta
        const folderPath = `${this.basePath}/${this.activePreset}/${instrumentKey}`
        
        console.log(`📂 [SampleLoader V4] Multisample folder: ${folderPath}`)

        // 🔥 FASE 5.11 - BUG #2 REPARADO: Leer config.json
        const configPath = `${folderPath}/config.json`
        
        let sampleMap
        try {
            const response = await fetch(configPath)
            if (!response.ok) {
                throw new Error(`config.json not found: ${configPath}`)
            }
            sampleMap = await response.json()
            console.log(`✅ [SampleLoader V4] Loaded config.json: ${Object.keys(sampleMap).length} samples`)
        } catch (error) {
            console.error(`❌ [SampleLoader V4] Cannot read config.json: ${configPath}`, error)
            throw new Error(`Multisample config.json missing for ${instrumentKey}. Run create-multisample-configs.js first.`)
        }

        // Crear Tone.Sampler con mapeo del JSON
        const sampler = new Tone.Sampler({
            urls: sampleMap,        // { "C2": "cello-c2.wav", "D2": "cello-d2.wav", ... }
            baseUrl: `${folderPath}/`,
            release: 1,
            onload: () => {
                console.log(`✅ [SampleLoader V4] Multisample loaded: ${instrumentKey}`)
            },
            onerror: (error) => {
                console.warn(`⚠️ [SampleLoader V4] Some samples failed to load: ${instrumentKey}`, error)
            }
        }).toDestination()

        // Await carga
        await Tone.loaded()

        return sampler
    }

    /**
     * 🎵 LOAD ONESHOT: Archivo individual con pitch-shifting automático
     * 
     * ESTRATEGIA (Fase 5.11 - BUG #1 REPARADO):
     * 1. instrumentKey ES la ruta relativa completa (ej: 'Bass/sub-bass/oneshot/oneshot2/subs-9')
     * 2. Cargar archivo como Tone.Sampler con 1 nota (C3 arbitrario)
     * 3. Tone.js automáticamente hace pitch-shifting cuando tocas otras notas
     * 
     * ELIMINADO:
     * - ❌ Heurística keyToPath()
     * - ❌ Lógica needsLayerPrefix
     * 
     * NUEVO:
     * - ✅ Path directo: /samples/{preset}/{instrumentKey}.wav
     * 
     * @param {string} instrumentKey - Ruta relativa (ej: 'Bass/sub-bass/oneshot/oneshot2/subs-9')
     * @returns {Promise<Tone.Sampler>}
     */
    async loadOneshot(instrumentKey) {
        // 🔥 FASE 5.11 - BUG #1 REPARADO: instrumentKey ES la ruta
        const fullPath = `${this.basePath}/${this.activePreset}/${instrumentKey}.wav`
        
        console.log(`🎵 [SampleLoader V4] Oneshot file: ${fullPath}`)

        // Crear Tone.Sampler con 1 nota (C3 arbitrario)
        // Tone.js automáticamente hace pitch-shifting cuando tocas otras notas
        const sampler = new Tone.Sampler({
            urls: {
                'C3': fullPath  // Mapear a C3 arbitrario
            },
            onload: () => {
                console.log(`✅ [SampleLoader V4] Oneshot loaded: ${instrumentKey}`)
            },
            onerror: (error) => {
                console.error(`❌ [SampleLoader V4] Oneshot error: ${instrumentKey}`, error)
            }
        }).toDestination()

        // Await carga
        await Tone.loaded()

        return sampler
    }

    /**
     * 🥁 LOAD DRUMKIT: Múltiples samples mapeados a MIDI numbers (Fase 5.2)
     * 
     * ESTRATEGIA (Sin cambios - ya funciona correctamente):
     * 1. Recibir mapeo MIDI → sample path desde el backend (StylePreset)
     * 2. Convertir MIDI numbers a note names (36 → "C2", 38 → "D2")
     * 3. Crear Tone.Sampler con URLs mapeadas correctamente
     * 4. Cada MIDI number toca su sample específico (NO pitch-shifting)
     * 
     * @param {string} instrumentKey - Nombre del kit (ej: 'chill-kit-1')
     * @param {Object.<number, string>} samples - { 36: 'rythm/soft-kick1', 38: 'rythm/snare1' }
     * @returns {Promise<Tone.Sampler>}
     */
    async loadDrumKit(instrumentKey, samples) {
        if (!samples || Object.keys(samples).length === 0) {
            throw new Error(`[SampleLoader V4] loadDrumKit: samples map is empty for ${instrumentKey}`)
        }

        console.log(`🥁 [SampleLoader V4] Drumkit: ${instrumentKey} with ${Object.keys(samples).length} samples`)

        const urls = {}
        const baseUrl = `${this.basePath}/${this.activePreset}/`

        // 🔥 MAPEO MIDI → NOTE NAME → SAMPLE PATH
        for (const [midiNumber, samplePath] of Object.entries(samples)) {
            const midi = parseInt(midiNumber, 10)
            // Convertir MIDI number a note name (36 → "C2", 38 → "D2")
            const noteName = Tone.Frequency(midi, 'midi').toNote()
            urls[noteName] = `${samplePath}.wav`
            
            console.log(`🔧 [SampleLoader V4] Mapping MIDI ${midi} → ${noteName} → ${samplePath}.wav`)
        }

        // Crear Tone.Sampler con mapeo correcto
        const sampler = new Tone.Sampler({
            urls,
            baseUrl,
            volume: 6,       // +6dB boost para drums
            attack: 0.001,   // Attack instantáneo
            release: 0.3,    // Release corto (300ms)
            onload: () => {
                console.log(`✅ [SampleLoader V4] Drumkit loaded: ${instrumentKey} (${Object.keys(urls).length} samples)`)
                console.log(`🔍 [SampleLoader V4] Available drum notes:`, Object.keys(urls))
            },
            onerror: (error) => {
                console.error(`❌ [SampleLoader V4] Drumkit error: ${instrumentKey}`, error)
            }
        }).toDestination()

        // Await carga
        await Tone.loaded()

        return sampler
    }

    /**
     * 🆘 FALLBACK SYNTH: Crear synth sintético si falla carga de samples
     * 
     * @param {string} trackType - Tipo de track
     * @returns {Tone.Synth|Tone.MembraneSynth} - Synth básico
     */
    createFallbackSynth(trackType) {
        console.log(`🎛️ [SampleLoader V4] Creating fallback synth for ${trackType}`)

        if (trackType === 'rhythm') {
            // Drums → MembraneSynth (kick-like)
            return new Tone.MembraneSynth().toDestination()
        } else if (trackType === 'bass') {
            // Bass → FMSynth (fat bass)
            return new Tone.FMSynth({
                harmonicity: 0.5,
                modulationIndex: 10
            }).toDestination()
        } else {
            // Melody/Harmony/Pad → PolySynth (versatile)
            return new Tone.PolySynth(Tone.Synth).toDestination()
        }
    }

    /**
     * 🎚️ SET ACTIVE PRESET
     * @param {string} presetName - Nombre del preset (ej: 'cyberpunkpreset')
     */
    setActivePreset(presetName) {
        this.activePreset = presetName
        console.log(`🎨 [SampleLoader V4] Active preset: ${presetName}`)
    }

    /**
     * 🧹 CLEAR CACHE: Limpiar cache de instrumentos cargados
     */
    clearCache() {
        console.log(`🧹 [SampleLoader V4] Clearing cache...`)
        
        // Dispose de todos los samplers
        for (const key in this.cache) {
            if (this.cache[key].dispose) {
                this.cache[key].dispose()
            }
        }
        
        this.cache = {}
        console.log(`✅ [SampleLoader V4] Cache cleared`)
    }
}

/**
 * 📚 USAGE EXAMPLE (Fase 5.11):
 * 
 * ```javascript
 * const loader = new SampleLoaderV4()
 * loader.setActivePreset('cyberpunkpreset')
 * 
 * // Oneshot (ruta relativa completa)
 * const kick = await loader.getInstrument('rhythm', 'rythm/hard-kick1', 'oneshot')
 * kick.triggerAttackRelease('C3', '0.5')
 * 
 * // Multisample (requiere config.json generado por create-multisample-configs.js)
 * const cello = await loader.getInstrument('harmony', 'melody/strings/Cello', 'multisample')
 * cello.triggerAttackRelease('C2', '2n')
 * cello.triggerAttackRelease('D2', '2n', '+4n')
 * cello.triggerAttackRelease('E2', '2n', '+2n')
 * 
 * // Drumkit (samples mapeados desde backend)
 * const kit = await loader.getInstrument('rhythm', 'chill-kit-1', 'drumkit', {
 *     36: 'rythm/soft-kick1',
 *     38: 'rythm/snare1',
 *     42: 'rythm/closehat1'
 * })
 * kit.triggerAttackRelease('C2', '0.5')  // Kick
 * kit.triggerAttackRelease('D2', '0.5', '+4n')  // Snare
 * ```
 */
