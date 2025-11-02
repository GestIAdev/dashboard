/**
 * 🎹 SAMPLE LOADER - INTEGRATION EXAMPLE
 * 
 * Ejemplos de cómo integrar SampleLoader con Aura Forge / MusicEnginePro
 * 
 * AUTHOR: PunkClaude
 * DATE: 2025-11-02
 * 
 * NOTE: Tone.js se carga como script global en HTML, no como módulo ES6
 */

import { SampleLoader } from './SampleLoader.js'

// Tone.js está disponible como global desde el HTML
// No necesitamos import, ya que se carga desde CDN

// ============================================================================
// EJEMPLO 1: CARGA BÁSICA
// ============================================================================

async function example1_basicLoading() {
    console.log('📖 EXAMPLE 1: Basic Loading\n')

    const loader = new SampleLoader()

    // 1. Cargar preset
    await loader.loadPreset('cyberpunk-ambient')

    // 2. Obtener instrumento de melody
    const piano = await loader.getInstrument('melody', 'electric-piano/MED')

    // 3. Tocar notas
    await Tone.start() // Requerido por Web Audio API
    piano.triggerAttackRelease('C4', '2n')
    piano.triggerAttackRelease('E4', '2n', '+0.5')
    piano.triggerAttackRelease('G4', '2n', '+1.0')

    console.log('✅ Playing C Major chord on electric piano\n')
}

// ============================================================================
// EJEMPLO 2: DRUMS (MAPEO MIDI)
// ============================================================================

async function example2_drumProgramming() {
    console.log('📖 EXAMPLE 2: Drum Programming\n')

    const loader = new SampleLoader()
    await loader.loadPreset('cyberpunk-ambient')

    // Obtener drum kit
    const drums = await loader.getInstrument('rhythm', 'drums')

    await Tone.start()

    // Drum pattern (General MIDI notes)
    const pattern = [
        { time: 0, note: 36, duration: '16n' },     // Kick
        { time: 0.5, note: 42, duration: '16n' },   // Hi-hat closed
        { time: 1.0, note: 38, duration: '16n' },   // Snare
        { time: 1.5, note: 42, duration: '16n' },   // Hi-hat closed
        { time: 2.0, note: 36, duration: '16n' },   // Kick
        { time: 2.5, note: 46, duration: '16n' },   // Hi-hat open
        { time: 3.0, note: 38, duration: '16n' },   // Snare
        { time: 3.5, note: 49, duration: '16n' }    // Crash
    ]

    // Programar secuencia
    const now = Tone.now()
    pattern.forEach(hit => {
        drums.triggerAttackRelease(
            Tone.Frequency(hit.note, 'midi'),
            hit.duration,
            now + hit.time
        )
    })

    console.log('✅ Playing drum pattern\n')
}

// ============================================================================
// EJEMPLO 3: MÚLTIPLES INSTRUMENTOS (ORQUESTACIÓN)
// ============================================================================

async function example3_orchestration() {
    console.log('📖 EXAMPLE 3: Orchestration (Multiple Instruments)\n')

    const loader = new SampleLoader()
    await loader.loadPreset('cyberpunk-ambient')

    // Cargar múltiples instrumentos en paralelo
    const [
        melody,
        harmony,
        bass,
        drums
    ] = await Promise.all([
        loader.getInstrument('melody', 'synth-lead/pulse-buzz-lead'),
        loader.getInstrument('harmony', 'pads/CeeVoice Pad'),
        loader.getInstrument('bass', 'sub-bass/Blau Bass'),
        loader.getInstrument('rhythm', 'drums')
    ])

    await Tone.start()

    const now = Tone.now()

    // Melody line
    const melodyNotes = [
        { note: 'C5', time: 0, duration: '4n' },
        { note: 'D5', time: 0.5, duration: '4n' },
        { note: 'E5', time: 1.0, duration: '4n' },
        { note: 'G5', time: 1.5, duration: '2n' }
    ]
    melodyNotes.forEach(n => {
        melody.triggerAttackRelease(n.note, n.duration, now + n.time)
    })

    // Harmony pad (chord)
    harmony.triggerAttackRelease(['C3', 'E3', 'G3'], '1m', now)

    // Bass line
    const bassNotes = [
        { note: 'C2', time: 0, duration: '2n' },
        { note: 'C2', time: 2, duration: '2n' }
    ]
    bassNotes.forEach(n => {
        bass.triggerAttackRelease(n.note, n.duration, now + n.time)
    })

    // Drums (simple kick pattern)
    [0, 1, 2, 3].forEach(beat => {
        drums.triggerAttackRelease(
            Tone.Frequency(36, 'midi'), // Kick
            '16n',
            now + beat
        )
    })

    console.log('✅ Playing full orchestration\n')
}

// ============================================================================
// EJEMPLO 4: INTEGRACIÓN CON MUSICENGINEPRO (PSEUDO-CODE)
// ============================================================================

/**
 * PSEUDO-CODE - Cómo integrar con MusicEnginePro
 * 
 * EN MusicEnginePro.ts:
 * 
 * ```typescript
 * import { globalSampleLoader } from './SampleLoader.js'
 * 
 * class MusicEnginePro {
 *     private sampleLoader: SampleLoader = globalSampleLoader
 * 
 *     async init(style: MusicStyle) {
 *         // 1. Cargar preset según estilo
 *         const presetMap = {
 *             'cyberpunk': 'cyberpunk-ambient',
 *             'lofi': 'lo-fi-chill',
 *             'orchestral': 'epic-orchestral'
 *         }
 *         const presetName = presetMap[style.genre] || 'cyberpunk-ambient'
 *         
 *         await this.sampleLoader.loadPreset(presetName)
 *         
 *         // 2. Seleccionar instrumentos según track
 *         this.instruments = {
 *             melody: await this.sampleLoader.getInstrument('melody', 'electric-piano/MED'),
 *             harmony: await this.sampleLoader.getInstrument('harmony', 'pads/CeeVoice Pad'),
 *             bass: await this.sampleLoader.getInstrument('bass', 'sub-bass/Blau Bass'),
 *             rhythm: await this.sampleLoader.getInstrument('rhythm', 'drums'),
 *             pad: await this.sampleLoader.getInstrument('pad', 'ambient-pads/Ciao Pad')
 *         }
 *     }
 * 
 *     generateMelodyLayer(section: Section): Note[] {
 *         // Generar notas melódicas como antes
 *         const notes = this.melodyEngine.generate(section)
 *         
 *         // Reproducir con sampler real
 *         notes.forEach(note => {
 *             this.instruments.melody.triggerAttackRelease(
 *                 note.pitch,
 *                 note.duration,
 *                 note.time,
 *                 note.velocity
 *             )
 *         })
 *         
 *         return notes
 *     }
 * 
 *     generateRhythmLayer(section: Section): Note[] {
 *         // Usar DrumPatternEngine (del plan)
 *         const drumEngine = new DrumPatternEngine(this.instruments.rhythm, this.style.tempo)
 *         const notes = drumEngine.generateForSection(section)
 *         
 *         return notes
 *     }
 * }
 * ```
 */

// ============================================================================
// EJEMPLO 5: CAMBIO DE PRESET (HOT-SWAP)
// ============================================================================

async function example5_presetSwitch() {
    console.log('📖 EXAMPLE 5: Preset Hot-Swap\n')

    const loader = new SampleLoader()

    // Cargar preset 1
    await loader.loadPreset('cyberpunk-ambient')
    let piano = await loader.getInstrument('melody', 'electric-piano/MED')

    await Tone.start()
    piano.triggerAttackRelease('C4', '2n')
    console.log('✅ Playing cyberpunk-ambient piano\n')

    // Wait 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Cambiar a preset 2 (cuando esté disponible)
    // await loader.switchPreset('lo-fi-chill')
    // piano = await loader.getInstrument('melody', 'piano')
    // piano.triggerAttackRelease('C4', '2n')
    // console.log('✅ Playing lo-fi-chill piano\n')
}

// ============================================================================
// EJEMPLO 6: PRELOADING (EVITAR LAG)
// ============================================================================

async function example6_preloading() {
    console.log('📖 EXAMPLE 6: Preloading Track\n')

    const loader = new SampleLoader()
    await loader.loadPreset('cyberpunk-ambient')

    // Precargar todos los instrumentos de melody (evita lag al tocar)
    await loader.preloadTrack('melody')

    console.log('✅ All melody instruments preloaded')
    console.log('Cache stats:', loader.getCacheStats())
}

// ============================================================================
// EJEMPLO 7: LISTAR INSTRUMENTOS DISPONIBLES
// ============================================================================

async function example7_listInstruments() {
    console.log('📖 EXAMPLE 7: List Available Instruments\n')

    const loader = new SampleLoader()
    await loader.loadPreset('cyberpunk-ambient')

    const instruments = loader.listAvailableInstruments()

    console.log('Available instruments:')
    for (const [track, instList] of Object.entries(instruments)) {
        console.log(`\n${track}:`)
        instList.forEach(inst => console.log(`  - ${inst}`))
    }
}

// ============================================================================
// RUN EXAMPLES
// ============================================================================

async function runAllExamples() {
    try {
        await example1_basicLoading()
        await example2_drumProgramming()
        await example3_orchestration()
        await example5_presetSwitch()
        await example6_preloading()
        await example7_listInstruments()

        console.log('\n🎉 All examples completed successfully!')
    } catch (error) {
        console.error('❌ Error running examples:', error)
    }
}

// Export para testing individual
export {
    example1_basicLoading,
    example2_drumProgramming,
    example3_orchestration,
    example5_presetSwitch,
    example6_preloading,
    example7_listInstruments,
    runAllExamples
}

// Si se ejecuta directamente
if (typeof window !== 'undefined') {
    window.SampleLoaderExamples = {
        example1_basicLoading,
        example2_drumProgramming,
        example3_orchestration,
        example5_presetSwitch,
        example6_preloading,
        example7_listInstruments,
        runAllExamples
    }

    console.log('🎹 Sample Loader Examples loaded!')
    console.log('Run in console: SampleLoaderExamples.runAllExamples()')
}
