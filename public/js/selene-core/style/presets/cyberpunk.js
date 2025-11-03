/**
 * 🎸 PRESET: CYBERPUNK AMBIENT
 * Atmósfera oscura y espaciosa con texturas sintéticas. Blade Runner meets Ghost in the Shell.
 */
export const CYBERPUNK_AMBIENT = {
    id: 'cyberpunk-ambient',
    name: 'Cyberpunk Ambient',
    description: 'Atmósfera oscura y espaciosa con texturas sintéticas. Blade Runner meets Ghost in the Shell.',
    tags: ['ambient', 'dark', 'electronic', 'atmospheric', 'slow'],
    musical: {
        mode: 'phrygian', // Escala oscura, misteriosa
        tempo: 70, // Lento, atmosférico
        timeSignature: [4, 4],
        rootRange: [36, 48], // Registro grave (C2-C3)
        harmonic: {
            progressionType: 'modal',
            chordComplexity: 'extended', // 9nas, 11vas
            density: 0.25, // Acordes largos, sostenidos
            inversionProbability: 0.7, // Inversiones frecuentes
            dissonanceLevel: 0.6, // Tensión moderada-alta
            modulationStrategy: 'modal' // Cambios modales sutiles
        },
        melodic: {
            range: [1, 3], // 3 octavas
            contourPreference: 'wave', // Ondulante
            noteDensity: 0.3, // Espaciado
            restProbability: 0.4, // Muchos silencios
            ornamentation: 'minimal',
            motifRepetition: 0.7 // Repetitivo (hipnótico)
        },
        rhythmic: {
            baseDivision: 8,
            complexity: 'simple',
            swing: 0,
            syncopation: 0.2,
            layerDensity: 2 // Minimal percusión
        }
    },
    layers: {
        // 🎚️ BUG #31 FIX: BALANCED MIX VELOCITIES (0-1 scale, converted to MIDI 0-127)
        // TARGET MIX: Melody (protagonist) > Bass/Harmony (support) > Drums (groove) > Pad (atmosphere)
        melody: {
            enabled: true,
            octave: 5,
            velocity: 0.55, // 70 MIDI = Protagonist (was 40 → too quiet)
            velocityVariation: 0.15, // ±19 MIDI variation
            articulation: 'legato',
            noteDuration: 2.0, // Notas largas
            mixWeight: 0.6
        },
        harmony: {
            enabled: true,
            octave: 3,
            velocity: 0.32, // 41 MIDI = Support, doesn't dominate (was 30*127=3810!)
            velocityVariation: 0.08, // ±10 MIDI variation
            articulation: 'legato',
            noteDuration: 1.0, // ✅ BUG #23 FIX: Sigue chord duration (was 4.0 → 17s órgano)
            mixWeight: 0.8
        },
        bass: {
            enabled: true,
            octave: 2,
            velocity: 0.43, // 55 MIDI = Foundation (was 35 → too quiet)
            velocityVariation: 0.12, // ±15 MIDI variation
            articulation: 'normal',
            noteDuration: 0.8, // ✅ BUG #23 FIX: Más corto que acorde (was 3.0 → 13s órgano)
            mixWeight: 0.5
        },
        rhythm: {
            enabled: true,
            octave: 0, // No aplica para drums
            velocity: 0.47, // 60 MIDI = Cyberpunk needs PUNCH (kicks/snares audible)
            velocityVariation: 0.12, // ±15 MIDI variation for dynamics
            articulation: 'staccato',
            noteDuration: 0.5,
            mixWeight: 0.3 // Increased from 0.2 (drums more present)
        },
        pad: {
            enabled: true,
            octave: 4,
            velocity: 0.30, // ✅ BUG #31 FIX: 38 MIDI = Subtle but AUDIBLE (was 0.14 → 17 inaudible)
            velocityVariation: 0.04, // ±5 MIDI variation
            articulation: 'legato',
            noteDuration: 8.0, // Drones
            mixWeight: 0.4
        },
        lead: false
    },
    texture: {
        density: 'sparse',
        verticalSpacing: 0.8, // Amplio
        activeLayersRange: [2, 3],
        transparency: 0.6 // Mucho espacio
    },
    temporal: {
        tempoEvolution: 'static',
        tempoVariation: 0.05,
        intensityArc: 'wave', // Sube y baja suavemente
        fadeIn: 4.0,
        fadeOut: 6.0,
        loopable: true
    }
};
//# sourceMappingURL=cyberpunk.js.map