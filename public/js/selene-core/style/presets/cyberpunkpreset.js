/**
 * 🎸 PRESET: CYBERPUNK PRESET (Scherzo Sónico)
 * Arsenal completo de +300 samples para variantes chill y dubchill.
 * FASE 5.10 - REPARACIÓN COMPLETA: Pools expandidos desde cyberpunkpreset-tree.md
 * - harmony_chill: 18 items (16 pads + 2 strings)
 * - harmony_dubchill: 20 items (17 pads + 3 strings)
 * - melody_chill: 20 items (16 vocal chops + 3 plucks oneshot + 1 pluck multisample)
 * - melody_dubchill: 7 items (7 synth leads)
 * - bass_chill: 25 items (24 sub-bass oneshots + 1 multisample)
 * - bass_dubchill: 7 items (5 synth-bass + 2 loops modulados)
 * - rhythm_chill: 1 drumkit (5 samples mapeados)
 * - rhythm_dubchill: 1 drumkit (10 samples mapeados)
 */
export const CYBERPUNK_PRESET = {
    id: 'cyberpunkpreset',
    name: 'Cyberpunk Preset (Scherzo Sónico)',
    description: 'Arsenal cyberpunk-ambient completo: +300 samples para chill y dubchill. Selección dinámica por intensity.',
    tags: ['cyberpunk', 'ambient', 'chill', 'dubchill', 'electronic', 'dark'],
    musical: {
        mode: 'phrygian', // Escala oscura, misteriosa
        tempo: 70, // Lento, atmosférico (60-85 BPM range)
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
        melody: {
            enabled: true,
            octave: 5,
            velocity: 0.55, // 70 MIDI = Protagonist
            velocityVariation: 0.15,
            articulation: 'legato',
            noteDuration: 2.0,
            mixWeight: 0.6
        },
        harmony: {
            enabled: true,
            octave: 3,
            velocity: 0.32, // 41 MIDI = Support
            velocityVariation: 0.08,
            articulation: 'legato',
            noteDuration: 1.0,
            mixWeight: 0.8
        },
        bass: {
            enabled: true,
            octave: 2,
            velocity: 0.43, // 55 MIDI = Foundation
            velocityVariation: 0.12,
            articulation: 'normal',
            noteDuration: 0.8,
            mixWeight: 0.5
        },
        rhythm: {
            enabled: true,
            octave: 0,
            velocity: 0.47, // 60 MIDI = Punch
            velocityVariation: 0.12,
            articulation: 'staccato',
            noteDuration: 0.5,
            mixWeight: 0.3
        },
        pad: {
            enabled: true,
            octave: 4,
            velocity: 0.30, // 38 MIDI = Subtle atmosphere
            velocityVariation: 0.04,
            articulation: 'legato',
            noteDuration: 8.0,
            mixWeight: 0.4
        },
        lead: false
    },
    // 🎨 SCHERZO SÓNICO - ARSENAL DE INSTRUMENTOS (POST-SANITIZACIÓN)
    // 🎸 FASE 5.10: REPARACIÓN COMPLETA - Arsenal de +300 samples del cyberpunkpreset-tree.md
    instruments: {
        // ==================== IDENTIDAD ESTÁTICA ====================
        // HARMONY CHILL: Pads cristalinos (16) + Strings suaves (Cello, Viola)
        harmony_chill: [
            // 16 Pads Crystalline oneshots
            { key: 'pads/crystalline/crystalline-1', type: 'oneshot' },
            { key: 'pads/crystalline/crystalline-2', type: 'oneshot' },
            { key: 'pads/crystalline/crystalline-3', type: 'oneshot' },
            { key: 'pads/crystalline/crystalline-4', type: 'oneshot' },
            { key: 'pads/crystalline/crystalline-5', type: 'oneshot' },
            { key: 'pads/crystalline/crystalline-6', type: 'oneshot' },
            { key: 'pads/crystalline/crystalline-7', type: 'oneshot' },
            { key: 'pads/crystalline/crystalline-8', type: 'oneshot' },
            { key: 'pads/crystalline/crystalline-9', type: 'oneshot' },
            { key: 'pads/crystalline/crystalline-10', type: 'oneshot' },
            { key: 'pads/crystalline/crystalline-11', type: 'oneshot' },
            { key: 'pads/crystalline/crystalline-12', type: 'oneshot' },
            { key: 'pads/crystalline/crystalline-13', type: 'oneshot' },
            { key: 'pads/crystalline/crystalline-14', type: 'oneshot' },
            { key: 'pads/crystalline/crystalline-15', type: 'oneshot' },
            { key: 'pads/crystalline/crystalline-16', type: 'oneshot' },
            // 2 Strings multisamples (Cello, Viola - 12 samples cada uno)
            { key: 'melody/strings/Cello', type: 'multisample' },
            { key: 'melody/strings/Viola', type: 'multisample' }
        ],
        // HARMONY DUBCHILL: Pads distorsionados (17) + Strings agresivos (Horn, Violin, Contra Bass)
        harmony_dubchill: [
            // 17 Pads Distorted oneshots
            { key: 'pads/distorted/distorted-1', type: 'oneshot' },
            { key: 'pads/distorted/distorted-2', type: 'oneshot' },
            { key: 'pads/distorted/distorted-3', type: 'oneshot' },
            { key: 'pads/distorted/distorted-4', type: 'oneshot' },
            { key: 'pads/distorted/distorted-5', type: 'oneshot' },
            { key: 'pads/distorted/distorted-6', type: 'oneshot' },
            { key: 'pads/distorted/distorted-7', type: 'oneshot' },
            { key: 'pads/distorted/distorted-8', type: 'oneshot' },
            { key: 'pads/distorted/distorted-9', type: 'oneshot' },
            { key: 'pads/distorted/distorted-10', type: 'oneshot' },
            { key: 'pads/distorted/distorted-11', type: 'oneshot' },
            { key: 'pads/distorted/distorted-12', type: 'oneshot' },
            { key: 'pads/distorted/distorted-13', type: 'oneshot' },
            { key: 'pads/distorted/distorted-14', type: 'oneshot' },
            { key: 'pads/distorted/distorted-15', type: 'oneshot' },
            { key: 'pads/distorted/distorted-16', type: 'oneshot' },
            { key: 'pads/distorted/distorted-17', type: 'oneshot' },
            // 3 Strings multisamples (Horn, Violin, Contra Bass - 28+12 samples)
            { key: 'melody/strings/Horn', type: 'multisample' },
            { key: 'melody/strings/Violin', type: 'multisample' },
            { key: 'melody/strings/Contra Bass', type: 'multisample' }
        ],
        // 🎸 MELODY CHILL: Vocal Chops (16) + Plucks oneshots (3) + Pluck MAX multisample (84 notas)
        melody_chill: [
            // 16 Vocal Chops oneshots
            { key: 'melody/vocal-chops/vocal-1', type: 'oneshot' },
            { key: 'melody/vocal-chops/vocal-2', type: 'oneshot' },
            { key: 'melody/vocal-chops/vocal-3', type: 'oneshot' },
            { key: 'melody/vocal-chops/vocal-4', type: 'oneshot' },
            { key: 'melody/vocal-chops/vocal-5', type: 'oneshot' },
            { key: 'melody/vocal-chops/vocal-6', type: 'oneshot' },
            { key: 'melody/vocal-chops/vocal-7', type: 'oneshot' },
            { key: 'melody/vocal-chops/vocal-8', type: 'oneshot' },
            { key: 'melody/vocal-chops/vocal-9', type: 'oneshot' },
            { key: 'melody/vocal-chops/vocal-10', type: 'oneshot' },
            { key: 'melody/vocal-chops/vocal-11', type: 'oneshot' },
            { key: 'melody/vocal-chops/vocal-12', type: 'oneshot' },
            { key: 'melody/vocal-chops/vocal-13', type: 'oneshot' },
            { key: 'melody/vocal-chops/vocal-14', type: 'oneshot' },
            { key: 'melody/vocal-chops/vocal-15', type: 'oneshot' },
            { key: 'melody/vocal-chops/vocal-16', type: 'oneshot' },
            // 3 Plucks oneshots (primitivos)
            { key: 'melody/pluck/pluck1', type: 'oneshot' },
            { key: 'melody/pluck/pluck2', type: 'oneshot' },
            { key: 'melody/pluck/pluck3', type: 'oneshot' },
            // 1 Pluck MAX multisample (84 notas completas)
            { key: 'melody/pluck/MAX', type: 'multisample' }
        ],
        // 🎸 MELODY DUBCHILL: 7 Synth Leads agresivos (multisamples - 13-17 notas cada uno)
        melody_dubchill: [
            { key: 'melody/synth-lead/classic-moog-brass', type: 'multisample' },
            { key: 'melody/synth-lead/classic-sync', type: 'multisample' },
            { key: 'melody/synth-lead/pulse-buzz-lead', type: 'multisample' },
            { key: 'melody/synth-lead/sawtedlead', type: 'multisample' },
            { key: 'melody/synth-lead/shrill', type: 'multisample' },
            { key: 'melody/synth-lead/softsawz', type: 'multisample' },
            { key: 'melody/synth-lead/wave-layer', type: 'multisample' }
        ],
        // ==================== ENERGÍA DINÁMICA ====================
        // 🔊 BASS CHILL (Intensity < 0.7): Sub-Bass oneshots (33 samples = 24 + 9 multisampled)
        bass_chill: [
            // 24 Sub-Bass oneshots (oneshot2)
            { key: 'Bass/sub-bass/oneshot/oneshot2/subs-1', type: 'oneshot' },
            { key: 'Bass/sub-bass/oneshot/oneshot2/subs-2', type: 'oneshot' },
            { key: 'Bass/sub-bass/oneshot/oneshot2/subs-3', type: 'oneshot' },
            { key: 'Bass/sub-bass/oneshot/oneshot2/subs-4', type: 'oneshot' },
            { key: 'Bass/sub-bass/oneshot/oneshot2/subs-5', type: 'oneshot' },
            { key: 'Bass/sub-bass/oneshot/oneshot2/subs-6', type: 'oneshot' },
            { key: 'Bass/sub-bass/oneshot/oneshot2/subs-7', type: 'oneshot' },
            { key: 'Bass/sub-bass/oneshot/oneshot2/subs-8', type: 'oneshot' },
            { key: 'Bass/sub-bass/oneshot/oneshot2/subs-9', type: 'oneshot' },
            { key: 'Bass/sub-bass/oneshot/oneshot2/subs-10', type: 'oneshot' },
            { key: 'Bass/sub-bass/oneshot/oneshot2/subs-11', type: 'oneshot' },
            { key: 'Bass/sub-bass/oneshot/oneshot2/subs-12', type: 'oneshot' },
            { key: 'Bass/sub-bass/oneshot/oneshot2/subs-13', type: 'oneshot' },
            { key: 'Bass/sub-bass/oneshot/oneshot2/subs-14', type: 'oneshot' },
            { key: 'Bass/sub-bass/oneshot/oneshot2/subs-15', type: 'oneshot' },
            { key: 'Bass/sub-bass/oneshot/oneshot2/subs-16', type: 'oneshot' },
            { key: 'Bass/sub-bass/oneshot/oneshot2/subs-17', type: 'oneshot' },
            { key: 'Bass/sub-bass/oneshot/oneshot2/subs-18', type: 'oneshot' },
            { key: 'Bass/sub-bass/oneshot/oneshot2/subs-19', type: 'oneshot' },
            { key: 'Bass/sub-bass/oneshot/oneshot2/subs-20', type: 'oneshot' },
            { key: 'Bass/sub-bass/oneshot/oneshot2/subs-21', type: 'oneshot' },
            { key: 'Bass/sub-bass/oneshot/oneshot2/subs-22', type: 'oneshot' },
            { key: 'Bass/sub-bass/oneshot/oneshot2/subs-23', type: 'oneshot' },
            { key: 'Bass/sub-bass/oneshot/oneshot2/subs-24', type: 'oneshot' },
            // 1 Sub-Bass multisample (oneshot1 - 9 notas)
            { key: 'Bass/sub-bass/oneshot/oneshot1', type: 'multisample' }
        ],
        // 🔊 BASS DUBCHILL (Intensity >= 0.7): 5 Synth-Bass multisamples + 2 Sub-Bass loops modulados
        bass_dubchill: [
            // 5 Synth-Bass multisamples (9 notas cada uno)
            { key: 'Bass/synth-bass/Growly', type: 'multisample' },
            { key: 'Bass/synth-bass/Juno', type: 'multisample' },
            { key: 'Bass/synth-bass/Quasmidi', type: 'multisample' },
            { key: 'Bass/synth-bass/Solid', type: 'multisample' },
            { key: 'Bass/synth-bass/Sub', type: 'multisample' },
            // 2 Sub-Bass loops modulados (9 notas cada uno)
            { key: 'Bass/sub-bass/loops/modulateloop-1', type: 'multisample' },
            { key: 'Bass/sub-bass/loops/modulateloop-2', type: 'multisample' }
        ],
        // 🥁 RHYTHM CHILL (Intensity < 0.7): Soft kicks, closed hats, gentle snares
        // 🔥 FASE 5.2: Rediseñado como 'drumkit' con mapeo MIDI explícito
        rhythm_chill: [
            {
                key: 'chill-kit-1',
                type: 'drumkit',
                samples: {
                    36: 'rythm/soft-kick1', // Kick (C2)
                    38: 'rythm/snare1', // Snare (D2)
                    42: 'rythm/closehat1', // Hi-hat closed (F#2)
                    46: 'rythm/shortopenhat', // Hi-hat open (A#2)
                    49: 'rythm/closehat2' // Crash cymbal = closed hat variant (C#3)
                }
            }
        ],
        // 🥁 RHYTHM DUBCHILL (Intensity >= 0.7): Hard kicks, glitches, aggressive snares
        // 🔥 FASE 5.2: Rediseñado como 'drumkit' con mapeo MIDI explícito
        rhythm_dubchill: [
            {
                key: 'dubchill-kit-1',
                type: 'drumkit',
                samples: {
                    36: 'rythm/hard-kick1', // Kick (C2)
                    38: 'rythm/snare-reverb', // Snare (D2)
                    42: 'rythm/glitch1', // Hi-hat closed = Glitch (F#2)
                    46: 'rythm/longopenhat', // Hi-hat open (A#2)
                    49: 'rythm/glitch5', // Crash cymbal = Glitch explosivo (C#3)
                    37: 'rythm/snare3', // Rim shot = Snare agresivo (C#2)
                    39: 'rythm/glitch2', // Clap = Glitch (D#2)
                    50: 'rythm/glitch3', // Tom high = Glitch (D3)
                    47: 'rythm/glitch4', // Tom mid = Glitch (B2)
                    51: 'rythm/medopenhat' // Ride = Hat medio (D#3)
                }
            }
        ],
        // 🌫️ PAD: Atmospheric Background (mismo esquema que harmony)
        pad: [
            // SUAVE (Chill) - Crystalline atmosphere
            { key: 'pads/crystalline/crystalline-5', type: 'oneshot' },
            // MEDIO - Mix
            { key: 'pads/crystalline/crystalline-12', type: 'oneshot' },
            // AGRESIVO (Dubchill) - Distorted atmosphere
            { key: 'pads/distorted/distorted-5', type: 'oneshot' }
        ]
    },
    texture: {
        density: 'sparse',
        verticalSpacing: 0.8,
        activeLayersRange: [2, 3],
        transparency: 0.6
    },
    temporal: {
        tempoEvolution: 'static',
        tempoVariation: 0.05,
        intensityArc: 'wave',
        fadeIn: 4.0,
        fadeOut: 6.0,
        loopable: true
    }
};
//# sourceMappingURL=cyberpunkpreset.js.map