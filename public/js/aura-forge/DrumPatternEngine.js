/**
 * 🥁 DRUM PATTERN ENGINE - STRUCTURED RHYTHM FOR AURA FORGE
 * 
 * Reemplaza la lógica caótica de drums con patrones estructurados profesionales.
 * Cada sección (intro, verse, chorus, bridge, outro) tiene su propio patrón con groove real.
 * 
 * MATANDO: Bug #24 (Drums Caóticos)
 * 
 * FEATURES:
 * - ✅ 5 patrones base (intro/verse/chorus/bridge/outro)
 * - ✅ Fills automáticos en transiciones
 * - ✅ Mapeo General MIDI Standard (kick=36, snare=38, etc.)
 * - ✅ Subdivisiones precisas (16th notes)
 * - ✅ Variación de velocidad (ghost notes, accents)
 * - ✅ 0% Math.random() (determinista total)
 * 
 * USAGE:
 * ```javascript
 * const drumEngine = new DrumPatternEngine(drumSampler, 70)
 * const notes = drumEngine.generateForSection(section, startTime)
 * ```
 * 
 * AUTHOR: PunkClaude + Radwulf + PunkArchytect
 * DATE: 2025-11-02
 */

export class DrumPatternEngine {
    /**
     * @param {Tone.Sampler} sampler - Drum sampler con mapeo MIDI
     * @param {number} tempo - BPM del track
     */
    constructor(sampler, tempo = 70) {
        this.sampler = sampler
        this.tempo = tempo
        this.patterns = this.loadPatterns()
        
        console.log(`🥁 [DrumPatternEngine] Initialized at ${tempo} BPM`)
    }

    // ============================================================================
    // PATTERN DEFINITIONS
    // ============================================================================

    /**
     * Definir patrones estructurados por sección
     * @returns {Object} - Patrones con notas y timings
     */
    loadPatterns() {
        return {
            // PATTERN 1: INTRO (Minimal)
            intro: {
                bars: 4,
                notes: [
                    // Bar 1-4: Solo hi-hats espaciados
                    { beat: 2, midi: 42, velocity: 30 },   // HH closed (beat 2)
                    { beat: 4, midi: 42, velocity: 25 }    // HH closed (beat 4)
                ]
            },

            // PATTERN 2: VERSE (Basic Groove)
            verse: {
                bars: 8,
                notes: [
                    // Beat 1
                    { beat: 1, midi: 36, velocity: 80 },   // Kick
                    { beat: 1, midi: 42, velocity: 40 },   // HH closed
                    { beat: 1.5, midi: 42, velocity: 30 }, // HH closed
                    
                    // Beat 2
                    { beat: 2, midi: 42, velocity: 35 },   // HH closed
                    { beat: 2.5, midi: 38, velocity: 60 }, // Snare
                    { beat: 2.5, midi: 42, velocity: 30 }, // HH closed
                    
                    // Beat 3
                    { beat: 3, midi: 36, velocity: 75 },   // Kick
                    { beat: 3, midi: 42, velocity: 40 },   // HH closed
                    { beat: 3.5, midi: 42, velocity: 30 }, // HH closed
                    
                    // Beat 4
                    { beat: 4, midi: 42, velocity: 35 },   // HH closed
                    { beat: 4.5, midi: 38, velocity: 55 }, // Snare
                    { beat: 4.5, midi: 46, velocity: 40 }  // HH open
                ]
            },

            // PATTERN 3: CHORUS (Complex)
            chorus: {
                bars: 8,
                notes: [
                    // Beat 1 - Fuerte con crash
                    { beat: 1, midi: 36, velocity: 90 },   // Kick
                    { beat: 1, midi: 49, velocity: 70 },   // Crash
                    { beat: 1, midi: 42, velocity: 50 },   // HH closed
                    { beat: 1.5, midi: 42, velocity: 40 }, // HH closed
                    
                    // Beat 2
                    { beat: 2, midi: 42, velocity: 45 },   // HH closed
                    { beat: 2.5, midi: 38, velocity: 75 }, // Snare
                    { beat: 2.5, midi: 39, velocity: 60 }, // Clap (layered)
                    { beat: 2.5, midi: 42, velocity: 40 }, // HH closed
                    
                    // Beat 3 - Ghost kick
                    { beat: 3, midi: 36, velocity: 85 },   // Kick
                    { beat: 3, midi: 42, velocity: 50 },   // HH closed
                    { beat: 3.25, midi: 36, velocity: 70 },// Kick (ghost)
                    { beat: 3.5, midi: 42, velocity: 40 }, // HH closed
                    
                    // Beat 4 - Con tom
                    { beat: 4, midi: 42, velocity: 45 },   // HH closed
                    { beat: 4.5, midi: 38, velocity: 70 }, // Snare
                    { beat: 4.5, midi: 46, velocity: 50 }, // HH open
                    { beat: 4.75, midi: 50, velocity: 60 } // Tom high
                ]
            },

            // PATTERN 4: BRIDGE (Break/Sparse)
            bridge: {
                bars: 4,
                notes: [
                    // Minimal - solo percusión suave
                    { beat: 2, midi: 70, velocity: 40 },   // Shaker
                    { beat: 4, midi: 54, velocity: 35 }    // Tambourine
                ]
            },

            // PATTERN 5: OUTRO (Fade)
            outro: {
                bars: 8,
                notes: [
                    // Mismo que verse pero con velocidades decrecientes
                    { beat: 1, midi: 36, velocity: 80 },   // Kick (fade gradual)
                    { beat: 2.5, midi: 38, velocity: 60 }, // Snare
                    { beat: 3, midi: 36, velocity: 75 },   // Kick
                    { beat: 4.5, midi: 46, velocity: 40 }  // HH open
                ]
            }
        }
    }

    // ============================================================================
    // GENERATION
    // ============================================================================

    /**
     * Generar notas de drums para una sección completa
     * @param {Object} section - Sección con type, duration, startTime
     * @param {number} startTime - Tiempo de inicio en segundos
     * @returns {Array<Object>} - Array de notas {midi, time, duration, velocity}
     */
    generateForSection(section, startTime) {
        const patternName = this.selectPattern(section.type)
        const pattern = this.patterns[patternName]
        
        if (!pattern) {
            console.warn(`⚠️  [DrumPatternEngine] No pattern for section: ${section.type}`)
            return []
        }

        const notes = []
        const beatDuration = (60 / this.tempo) // Segundos por beat (4/4)
        const barDuration = beatDuration * 4   // 4 beats por bar

        // Calcular cuántas repeticiones del patrón necesitamos
        const patternDuration = barDuration * pattern.bars
        const numRepeats = Math.ceil(section.duration / patternDuration)

        // Generar notas para cada repetición
        for (let repeat = 0; repeat < numRepeats; repeat++) {
            const repeatOffset = repeat * patternDuration

            pattern.notes.forEach(note => {
                const noteTime = startTime + repeatOffset + ((note.beat - 1) * beatDuration)
                
                // No agregar notas que excedan la duración de la sección
                if (noteTime < startTime + section.duration) {
                    // Aplicar fade en outro
                    let velocity = note.velocity
                    if (patternName === 'outro') {
                        const fadeProgress = (noteTime - startTime) / section.duration
                        velocity = note.velocity * (1 - fadeProgress * 0.6) // Fade 60%
                    }

                    notes.push({
                        midi: note.midi,
                        time: noteTime,
                        duration: 0.1, // Percusión = corta
                        velocity: velocity / 127 // Normalizar a 0-1 para Tone.js
                    })
                }
            })
        }

        // Agregar fill al final si corresponde
        if (this.shouldAddFill(section)) {
            const fillNotes = this.generateFill(section, startTime)
            notes.push(...fillNotes)
        }

        console.log(`🥁 [DrumPatternEngine] Generated ${notes.length} notes for ${section.type} (${patternName})`)
        return notes
    }

    /**
     * Seleccionar patrón según tipo de sección
     * @param {string} sectionType - Tipo de sección
     * @returns {string} - Nombre del patrón
     */
    selectPattern(sectionType) {
        const mapping = {
            'intro': 'intro',
            'verse': 'verse',
            'pre-chorus': 'verse',     // Usar verse pattern
            'chorus': 'chorus',
            'interlude': 'bridge',
            'bridge': 'bridge',
            'buildup': 'chorus',       // Usar chorus pattern (energético)
            'outro': 'outro'
        }
        
        return mapping[sectionType] || 'verse' // Default: verse
    }

    /**
     * Determinar si agregar fill de transición
     * @param {Object} section - Sección actual
     * @returns {boolean}
     */
    shouldAddFill(section) {
        // Agregar fill antes de chorus o al final de verse/pre-chorus
        return section.type === 'verse' || 
               section.type === 'pre-chorus' || 
               section.type === 'buildup'
    }

    /**
     * Generar fill de transición (último bar de la sección)
     * @param {Object} section - Sección actual
     * @param {number} startTime - Tiempo de inicio
     * @returns {Array<Object>} - Notas del fill
     */
    generateFill(section, startTime) {
        const beatDuration = (60 / this.tempo)
        const fillStart = startTime + section.duration - (beatDuration * 4) // Último bar

        // Fill clásico: kick → tom high → tom mid → tom low → kick+crash → snare
        return [
            { midi: 36, time: fillStart, duration: 0.1, velocity: 0.9 },                          // Kick
            { midi: 50, time: fillStart + beatDuration * 0.5, duration: 0.1, velocity: 0.7 },    // Tom high
            { midi: 47, time: fillStart + beatDuration * 1, duration: 0.1, velocity: 0.75 },     // Tom mid
            { midi: 45, time: fillStart + beatDuration * 1.5, duration: 0.1, velocity: 0.8 },    // Tom low
            { midi: 36, time: fillStart + beatDuration * 2, duration: 0.1, velocity: 0.85 },     // Kick
            { midi: 49, time: fillStart + beatDuration * 2, duration: 0.1, velocity: 0.8 },      // Crash
            { midi: 38, time: fillStart + beatDuration * 3, duration: 0.1, velocity: 0.85 },     // Snare
            { midi: 51, time: fillStart + beatDuration * 3, duration: 0.1, velocity: 0.6 }       // Ride
        ]
    }

    // ============================================================================
    // UTILITY
    // ============================================================================

    /**
     * Cambiar tempo (útil para tempo changes dinámicos)
     * @param {number} newTempo - Nuevo BPM
     */
    setTempo(newTempo) {
        this.tempo = newTempo
        console.log(`🥁 [DrumPatternEngine] Tempo changed to ${newTempo} BPM`)
    }

    /**
     * Obtener info del patrón
     * @param {string} patternName - Nombre del patrón
     */
    getPatternInfo(patternName) {
        const pattern = this.patterns[patternName]
        if (!pattern) return null

        return {
            name: patternName,
            bars: pattern.bars,
            noteCount: pattern.notes.length,
            uniqueInstruments: [...new Set(pattern.notes.map(n => n.midi))]
        }
    }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

/**
 * Instancia global (se inicializará en MusicEnginePro con sampler y tempo)
 */
export let globalDrumEngine = null

/**
 * Inicializar instancia global
 */
export function initGlobalDrumEngine(sampler, tempo) {
    globalDrumEngine = new DrumPatternEngine(sampler, tempo)
    return globalDrumEngine
}
