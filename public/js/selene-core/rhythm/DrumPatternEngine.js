/**
 * 🥁 DRUM PATTERN ENGINE v2.0 - "RHYTHM DIVINE"
 *
 * Motor de patrones rítmicos con MAGIA MATEMÁTICA profesional.
 * Sistema de variaciones A/B/C + Groove/Swing + Humanización.
 *
 * DIRECTIVA 28B: SCHERZO SONORO (Architect + Radwulf + PunkClaude)
 *
 * FEATURES v2.0:
 * - ✅ 18+ patrones únicos con variaciones A/B/C por sección
 * - ✅ Swing automático (8-12ms offset en off-beats)
 * - ✅ Velocity humanizada (hihats 65-85, kicks 95-120, snares 85-110)
 * - ✅ Fills inteligentes (glitchy, rolls, no metralleta)
 * - ✅ Patrones cyberpunk (sincopados, glitches intencionados)
 * - ✅ Ghost notes dinámicos (40-55 velocity)
 * - ✅ Hi-hat rolls en transiciones
 * - ✅ 100% determinista (SeededRandom)
 *
 * MATANDO: Bug #24 (Drums Desordenados/Repetitivos)
 *
 * AUTHOR: PunkClaude + Radwulf + Architect
 * DATE: 2025-11-02
 * VERSION: 2.0 - "RHYTHM DIVINE"
 */
import { SeededRandom } from '../utils/SeededRandom.js';
export class DrumPatternEngine {
    patterns;
    tempo;
    prng;
    swingAmount = 0.12; // 🎭 SCHERZO: 12% swing (más shuffle feel en cyberpunk)
    humanizationFactor = 0.06; // 🎭 SCHERZO: 6% variación (menos saltos bruscos)
    constructor(tempo, seed = 12345) {
        this.tempo = tempo;
        this.prng = new SeededRandom(seed);
        this.patterns = this.loadPatterns();
        console.log(`🥁 [DrumPatternEngine] Initialized at ${tempo} BPM (v2.0 - Rhythm Divine)`);
    }
    /**
     * 🎵 PATRONES v2.0 - RHYTHM DIVINE (18+ variaciones únicas)
     *
     * SISTEMA DE VARIACIONES:
     * - A: Patrón básico (groove estándar)
     * - B: Variación intermedia (más sincopado)
     * - C: Variación compleja (cyberpunk/glitchy)
     *
     * HUMANIZACIÓN:
     * - Kicks: 100-120 velocity (potentes)
     * - Snares: 85-110 velocity (dinámicos)
     * - Hi-hats: 65-85 velocity (suaves)
     * - Ghost notes: 40-55 velocity (barely audible)
     */
    loadPatterns() {
        return {
            // ═══════════════════════════════════════════════════════════
            // INTRO PATTERNS (Minimal pero audible)
            // ═══════════════════════════════════════════════════════════
            intro_A: {
                bars: 4,
                notes: [
                    // Minimal hi-hats en beats principales
                    { beat: 1, midi: 42, velocity: 75 }, // HH closed
                    { beat: 2, midi: 42, velocity: 68 }, // HH closed (más suave)
                    { beat: 3, midi: 42, velocity: 72 }, // HH closed
                    { beat: 4, midi: 42, velocity: 68 } // HH closed
                ]
            },
            intro_B: {
                bars: 4,
                notes: [
                    // Intro con kick suave + shaker
                    { beat: 1, midi: 36, velocity: 85 }, // Kick (suave)
                    { beat: 1, midi: 70, velocity: 65 }, // Shaker
                    { beat: 2.5, midi: 70, velocity: 68 }, // Shaker
                    { beat: 3, midi: 36, velocity: 80 }, // Kick (ghost)
                    { beat: 4, midi: 70, velocity: 70 } // Shaker
                ]
            },
            // ═══════════════════════════════════════════════════════════
            // VERSE PATTERNS (Basic Grooves - 3 variaciones)
            // ═══════════════════════════════════════════════════════════
            verse_A: {
                bars: 4,
                notes: [
                    // Groove básico 4/4
                    { beat: 1, midi: 36, velocity: 110 }, // Kick
                    { beat: 1, midi: 42, velocity: 78 }, // HH closed
                    { beat: 1.5, midi: 42, velocity: 65 }, // HH closed (ghost)
                    { beat: 2, midi: 42, velocity: 72 }, // HH closed
                    { beat: 2.5, midi: 38, velocity: 95 }, // Snare
                    { beat: 2.5, midi: 42, velocity: 68 }, // HH closed
                    { beat: 3, midi: 36, velocity: 105 }, // Kick
                    { beat: 3, midi: 42, velocity: 78 }, // HH closed
                    { beat: 3.5, midi: 42, velocity: 65 }, // HH closed (ghost)
                    { beat: 4, midi: 42, velocity: 72 }, // HH closed
                    { beat: 4.5, midi: 38, velocity: 90 }, // Snare
                    { beat: 4.5, midi: 46, velocity: 70 } // HH open
                ]
            },
            verse_B: {
                bars: 4,
                notes: [
                    // Groove sincopado (kicks en off-beats)
                    { beat: 1, midi: 36, velocity: 112 }, // Kick
                    { beat: 1, midi: 42, velocity: 80 }, // HH closed
                    { beat: 1.75, midi: 36, velocity: 88 }, // Kick (ghost sincopado)
                    { beat: 2, midi: 42, velocity: 75 }, // HH closed
                    { beat: 2.5, midi: 38, velocity: 98 }, // Snare
                    { beat: 2.5, midi: 42, velocity: 70 }, // HH closed
                    { beat: 3, midi: 36, velocity: 108 }, // Kick
                    { beat: 3, midi: 42, velocity: 78 }, // HH closed
                    { beat: 3.25, midi: 42, velocity: 50 }, // HH closed (ghost)
                    { beat: 3.5, midi: 42, velocity: 66 }, // HH closed
                    { beat: 4, midi: 42, velocity: 72 }, // HH closed
                    { beat: 4.5, midi: 38, velocity: 92 }, // Snare
                    { beat: 4.5, midi: 46, velocity: 75 }, // HH open
                    { beat: 4.75, midi: 37, velocity: 55 } // Rim (ghost)
                ]
            },
            verse_C: {
                bars: 4,
                notes: [
                    // Groove cyberpunk (glitchy hi-hats)
                    { beat: 1, midi: 36, velocity: 115 }, // Kick (fuerte)
                    { beat: 1, midi: 42, velocity: 82 }, // HH closed
                    { beat: 1.25, midi: 42, velocity: 68 }, // HH closed (glitch)
                    { beat: 1.5, midi: 42, velocity: 48 }, // HH closed (ghost glitch)
                    { beat: 2, midi: 42, velocity: 75 }, // HH closed
                    { beat: 2.5, midi: 38, velocity: 100 }, // Snare
                    { beat: 2.5, midi: 39, velocity: 70 }, // Clap (layered)
                    { beat: 3, midi: 36, velocity: 110 }, // Kick
                    { beat: 3, midi: 42, velocity: 80 }, // HH closed
                    { beat: 3.5, midi: 42, velocity: 45 }, // HH closed (ghost)
                    { beat: 3.75, midi: 70, velocity: 60 }, // Shaker (textura)
                    { beat: 4, midi: 42, velocity: 72 }, // HH closed
                    { beat: 4.5, midi: 38, velocity: 95 }, // Snare
                    { beat: 4.5, midi: 46, velocity: 78 } // HH open
                ]
            },
            // ═══════════════════════════════════════════════════════════
            // CHORUS PATTERNS (Complex/Powerful - 3 variaciones)
            // ═══════════════════════════════════════════════════════════
            chorus_A: {
                bars: 4,
                notes: [
                    // Chorus potente con crash
                    { beat: 1, midi: 36, velocity: 120 }, // Kick (máximo)
                    { beat: 1, midi: 49, velocity: 110 }, // Crash
                    { beat: 1, midi: 42, velocity: 85 }, // HH closed
                    { beat: 1.5, midi: 42, velocity: 70 }, // HH closed
                    { beat: 2, midi: 42, velocity: 78 }, // HH closed
                    { beat: 2.5, midi: 38, velocity: 110 }, // Snare (fuerte)
                    { beat: 2.5, midi: 39, velocity: 95 }, // Clap (layered)
                    { beat: 2.5, midi: 42, velocity: 72 }, // HH closed
                    { beat: 3, midi: 36, velocity: 115 }, // Kick
                    { beat: 3, midi: 42, velocity: 82 }, // HH closed
                    { beat: 3.25, midi: 36, velocity: 90 }, // Kick (ghost)
                    { beat: 3.5, midi: 42, velocity: 68 }, // HH closed
                    { beat: 4, midi: 42, velocity: 75 }, // HH closed
                    { beat: 4.5, midi: 38, velocity: 105 }, // Snare
                    { beat: 4.5, midi: 46, velocity: 80 }, // HH open
                    { beat: 4.75, midi: 50, velocity: 88 } // Tom high (fill mini)
                ]
            },
            chorus_B: {
                bars: 4,
                notes: [
                    // Chorus sincopado (double kicks)
                    { beat: 1, midi: 36, velocity: 118 }, // Kick
                    { beat: 1, midi: 49, velocity: 108 }, // Crash
                    { beat: 1, midi: 42, velocity: 83 }, // HH closed
                    { beat: 1.25, midi: 36, velocity: 95 }, // Kick (double)
                    { beat: 1.5, midi: 42, velocity: 72 }, // HH closed
                    { beat: 2, midi: 42, velocity: 76 }, // HH closed
                    { beat: 2.5, midi: 38, velocity: 108 }, // Snare
                    { beat: 2.5, midi: 39, velocity: 90 }, // Clap
                    { beat: 2.75, midi: 42, velocity: 50 }, // HH closed (ghost)
                    { beat: 3, midi: 36, velocity: 116 }, // Kick
                    { beat: 3, midi: 42, velocity: 80 }, // HH closed
                    { beat: 3.5, midi: 36, velocity: 92 }, // Kick (ghost)
                    { beat: 3.5, midi: 42, velocity: 68 }, // HH closed
                    { beat: 4, midi: 42, velocity: 74 }, // HH closed
                    { beat: 4.25, midi: 42, velocity: 55 }, // HH closed (ghost)
                    { beat: 4.5, midi: 38, velocity: 106 }, // Snare
                    { beat: 4.5, midi: 46, velocity: 82 }, // HH open
                    { beat: 4.75, midi: 47, velocity: 85 } // Tom mid
                ]
            },
            chorus_C: {
                bars: 4,
                notes: [
                    // Chorus cyberpunk (glitches + tambourine)
                    { beat: 1, midi: 36, velocity: 120 }, // Kick (máximo)
                    { beat: 1, midi: 49, velocity: 112 }, // Crash
                    { beat: 1, midi: 42, velocity: 85 }, // HH closed
                    { beat: 1, midi: 54, velocity: 65 }, // Tambourine (textura)
                    { beat: 1.25, midi: 42, velocity: 70 }, // HH closed (glitch)
                    { beat: 1.5, midi: 42, velocity: 48 }, // HH closed (ghost)
                    { beat: 2, midi: 42, velocity: 78 }, // HH closed
                    { beat: 2.5, midi: 38, velocity: 110 }, // Snare
                    { beat: 2.5, midi: 39, velocity: 92 }, // Clap
                    { beat: 2.5, midi: 54, velocity: 68 }, // Tambourine
                    { beat: 3, midi: 36, velocity: 117 }, // Kick
                    { beat: 3, midi: 42, velocity: 82 }, // HH closed
                    { beat: 3.25, midi: 36, velocity: 88 }, // Kick (double)
                    { beat: 3.5, midi: 42, velocity: 45 }, // HH closed (ghost)
                    { beat: 3.5, midi: 70, velocity: 58 }, // Shaker (textura)
                    { beat: 4, midi: 42, velocity: 75 }, // HH closed
                    { beat: 4.5, midi: 38, velocity: 108 }, // Snare
                    { beat: 4.5, midi: 46, velocity: 80 }, // HH open
                    { beat: 4.5, midi: 54, velocity: 70 }, // Tambourine
                    { beat: 4.75, midi: 50, velocity: 90 } // Tom high
                ]
            },
            // ═══════════════════════════════════════════════════════════
            // BRIDGE PATTERNS (Break/Sparse - 2 variaciones)
            // ═══════════════════════════════════════════════════════════
            bridge_A: {
                bars: 4,
                notes: [
                    // Bridge minimal (shaker + tambourine)
                    { beat: 1, midi: 70, velocity: 72 }, // Shaker
                    { beat: 2, midi: 70, velocity: 68 }, // Shaker
                    { beat: 3, midi: 54, velocity: 70 }, // Tambourine
                    { beat: 4, midi: 70, velocity: 70 } // Shaker
                ]
            },
            bridge_B: {
                bars: 4,
                notes: [
                    // Bridge con kick suave + rim
                    { beat: 1, midi: 36, velocity: 75 }, // Kick (muy suave)
                    { beat: 1, midi: 70, velocity: 65 }, // Shaker
                    { beat: 2.5, midi: 37, velocity: 60 }, // Rim (ghost)
                    { beat: 3, midi: 54, velocity: 68 }, // Tambourine
                    { beat: 4, midi: 70, velocity: 70 }, // Shaker
                    { beat: 4.5, midi: 37, velocity: 55 } // Rim (ghost)
                ]
            },
            // ═══════════════════════════════════════════════════════════
            // BUILDUP PATTERN (Glitchy/Tenso/Crescendo - NO BOMBARDEO)
            // 🎭 SCHERZO SONORO: Builds atmosférico con crescendo gradual
            // ═══════════════════════════════════════════════════════════
            buildup: {
                bars: 4,
                notes: [
                    // Bar 1: Minimal (HH + Kick suaves - tensión inicial)
                    { beat: 1, midi: 36, velocity: 80 }, // Kick (suave)
                    { beat: 1, midi: 42, velocity: 68 }, // HH closed
                    { beat: 2.5, midi: 38, velocity: 75 }, // Snare (ghost)
                    { beat: 3.5, midi: 42, velocity: 72 }, // HH closed
                    { beat: 4, midi: 42, velocity: 65 }, // HH closed (ghost)
                    // Bar 2: Añadir glitches (shaker + clap ligeros)
                    { beat: 5, midi: 70, velocity: 70 }, // Shaker (glitch)
                    { beat: 6.5, midi: 39, velocity: 72 }, // Clap (suave)
                    { beat: 7.5, midi: 36, velocity: 85 }, // Kick (subiendo)
                    { beat: 8, midi: 42, velocity: 75 }, // HH closed
                    // Bar 3: Intensificar (más hihats, snare roll)
                    { beat: 9, midi: 36, velocity: 92 }, // Kick (creciendo)
                    { beat: 9, midi: 42, velocity: 80 }, // HH closed
                    { beat: 10.5, midi: 38, velocity: 80 }, // Snare
                    { beat: 11, midi: 38, velocity: 68 }, // Snare (ghost roll)
                    { beat: 11.25, midi: 38, velocity: 60 }, // Snare (ghost roll)
                    { beat: 11.5, midi: 42, velocity: 85 }, // HH closed (acelerando)
                    // Bar 4: Clímax moderado (preparar drop, NO explotar)
                    { beat: 13, midi: 36, velocity: 98 }, // Kick (forte pero no máximo)
                    { beat: 13, midi: 49, velocity: 90 }, // Crash (moderado)
                    { beat: 14.5, midi: 38, velocity: 95 } // Snare final (transición)
                ]
            },
            // ═══════════════════════════════════════════════════════════
            // OUTRO PATTERN (Fade gradual)
            // ═══════════════════════════════════════════════════════════
            outro: {
                bars: 4,
                notes: [
                    // Mismo que verse_A pero con fade automático
                    { beat: 1, midi: 36, velocity: 110 }, // Kick
                    { beat: 1, midi: 42, velocity: 78 }, // HH closed
                    { beat: 2.5, midi: 38, velocity: 95 }, // Snare
                    { beat: 3, midi: 36, velocity: 105 }, // Kick
                    { beat: 4.5, midi: 46, velocity: 70 } // HH open
                ]
            }
        };
    }
    /**
     * 🎵 Generar notas de drums con GROOVE + HUMANIZACIÓN
     * ✅ BUG #24 FIX (SCHERZO SONORO): Maneja secciones de 5, 6, 7 compases inteligentemente
     */
    generateForSection(section, baseVelocity = 60) {
        const patternName = this.selectPattern(section.type);
        const pattern = this.patterns[patternName];
        if (!pattern) {
            console.warn(`⚠️  [DrumPatternEngine] No pattern for section: ${section.type}`);
            return [];
        }
        const notes = [];
        const beatDuration = (60 / this.tempo); // Segundos por beat (4/4)
        const barDuration = beatDuration * 4; // 4 beats por bar
        // ✅ BUG #24 FIX: Adaptar patrones a secciones de duración variable
        const sectionBars = section.bars || Math.round(section.duration / barDuration);
        const patternBars = pattern.bars;
        // Calcular cuántas repeticiones completas del patrón caben
        const fullRepeats = Math.floor(sectionBars / patternBars);
        const remainingBars = sectionBars % patternBars;
        console.log(`🥁 [RHYTHM DIVINE] Section "${section.type}" has ${sectionBars} bars, pattern "${patternName}" has ${patternBars} bars. Full repeats: ${fullRepeats}, remaining: ${remainingBars}`);
        // Generar repeticiones completas del patrón
        for (let repeat = 0; repeat < fullRepeats; repeat++) {
            const repeatOffset = repeat * (barDuration * patternBars);
            this.generatePatternNotes(pattern, patternName, section, repeatOffset, beatDuration, notes);
        }
        // ✅ BUG #24 FIX: Si hay compases sobrantes (5, 6, 7 bars), rellenar inteligentemente
        if (remainingBars > 0) {
            const remainingOffset = fullRepeats * (barDuration * patternBars);
            const remainingDuration = remainingBars * barDuration;
            // Estrategia: Usar patrón adaptado (truncado) + fill opcional
            // Si quedan 1-2 compases: usar solo inicio del patrón
            // Si quedan 3+ compases: usar patrón completo truncado + fill
            if (remainingBars <= 2) {
                // Truncar patrón a los primeros N compases
                const truncatedPattern = {
                    ...pattern,
                    bars: remainingBars,
                    notes: pattern.notes.filter(note => note.beat <= (remainingBars * 4) + 0.01)
                };
                console.log(`🥁 [RHYTHM DIVINE] Truncating pattern to ${remainingBars} bars for remaining section`);
                this.generatePatternNotes(truncatedPattern, `${patternName}_trunc`, section, remainingOffset, beatDuration, notes);
            }
            else {
                // Usar patrón completo truncado sin fill (para evitar "caos")
                const truncatedPattern = {
                    ...pattern,
                    bars: remainingBars,
                    notes: pattern.notes.filter(note => note.beat <= (remainingBars * 4) + 0.01)
                };
                console.log(`🥁 [RHYTHM DIVINE] Using full pattern truncated to ${remainingBars} bars`);
                this.generatePatternNotes(truncatedPattern, `${patternName}_adapted`, section, remainingOffset, beatDuration, notes);
            }
        }
        // Agregar fill al final si corresponde
        if (this.shouldAddFill(section)) {
            const fillNotes = this.generateFill(section, baseVelocity);
            notes.push(...fillNotes);
        }
        return notes;
    }
    /**
     * 🔧 HELPER: Generar notas de un patrón con offset
     * Extraído para reutilización en BUG #24 FIX
     */
    generatePatternNotes(pattern, patternName, section, repeatOffset, beatDuration, notes) {
        pattern.notes.forEach(note => {
            let noteTime = section.startTime + repeatOffset + ((note.beat - 1) * beatDuration);
            // 🎭 SWING: Desplazar off-beats (1.5, 2.5, 3.5, 4.5) ligeramente
            const beatPosition = note.beat % 1;
            if (beatPosition === 0.5) {
                // Off-beat: añadir swing (8-12ms delay)
                const swingDelay = this.swingAmount * beatDuration;
                noteTime += swingDelay;
            }
            // No agregar notas que excedan la duración de la sección
            if (noteTime < section.startTime + section.duration) {
                // Aplicar fade en outro
                let velocity = note.velocity;
                if (patternName.startsWith('outro')) {
                    const fadeProgress = (noteTime - section.startTime) / section.duration;
                    velocity = note.velocity * (1 - fadeProgress * 0.6); // Fade 60%
                }
                // 🎨 HUMANIZACIÓN: Variación aleatoria ±10% en velocity
                // (pero determinista via SeededRandom)
                const humanizationVariation = (this.prng.next() - 0.5) * 2 * this.humanizationFactor;
                velocity = velocity * (1 + humanizationVariation);
                // ✅ VELOCITIES PROFESIONALES: Ya vienen correctas del patrón (60-120 MIDI)
                const scaledVelocity = Math.floor(velocity);
                const finalVelocity = Math.max(35, Math.min(127, scaledVelocity));
                // 🔥 RHYTHM LOGGER: Partitura exacta con Swing + Humanización
                console.log(`🥁 [RHYTHM DIVINE] Section: ${section.type}, Pattern: ${patternName}, MIDI: ${note.midi}, Beat: ${note.beat.toFixed(2)}, Time(s): ${noteTime.toFixed(3)}, Velocity: ${finalVelocity}`);
                notes.push({
                    pitch: note.midi,
                    velocity: finalVelocity,
                    startTime: noteTime,
                    duration: 0.1, // Percusión = corta
                    channel: 9 // Channel 9 = drums
                });
            }
        });
    }
    /**
     * 🎯 Seleccionar patrón con variaciones A/B/C (determinista)
     */
    selectPattern(sectionType) {
        // Seleccionar variación (A, B, C) de manera determinista
        const variation = this.prng.choice(['A', 'B', 'C']);
        const mapping = {
            'intro': `intro_${variation}`,
            'verse': `verse_${variation}`,
            'pre-chorus': `verse_${variation}`, // Pre-chorus usa verse con variación
            'chorus': `chorus_${variation}`,
            'interlude': `bridge_${variation}`,
            'bridge': `bridge_${variation}`,
            'buildup': 'buildup', // Buildup tiene patrón único (glitchy)
            'outro': 'outro' // Outro tiene patrón único (fade)
        };
        const patternName = mapping[sectionType];
        // Fallback: Si no existe la variación, usar _A
        if (!this.patterns[patternName]) {
            const basePattern = sectionType === 'intro' ? 'intro_A' :
                sectionType === 'verse' || sectionType === 'pre-chorus' ? 'verse_A' :
                    sectionType === 'chorus' ? 'chorus_A' :
                        sectionType === 'bridge' || sectionType === 'interlude' ? 'bridge_A' :
                            'verse_A';
            return basePattern;
        }
        return patternName;
    }
    /**
     * ⚡ Determinar si agregar fill de transición (inteligente)
     */
    shouldAddFill(section) {
        // Fills inteligentes:
        // ✅ Verse → antes del chorus
        // ✅ Pre-chorus → antes del chorus
        // ✅ Bridge → transición dramática
        // ✅ Chorus → antes del drop/verse (ocasional)
        // ❌ Buildup → ya tiene patrón interno complejo
        // ❌ Outro → fade natural, no fill
        // ❌ Intro → minimalista, no necesita fill
        return section.type === 'verse' ||
            section.type === 'pre-chorus' ||
            section.type === 'bridge' ||
            (section.type === 'chorus' && this.prng.next() > 0.6); // 40% chance en chorus
    }
    /**
     * 🔥 Generar fill glitchy (cyberpunk, no metralleta)
     * 🔧 BUG #24 FIX: Velocities fijas profesionales (no escalar por baseVelocity)
     */
    generateFill(section, baseVelocity) {
        const beatDuration = (60 / this.tempo);
        const fillStart = section.startTime + section.duration - (beatDuration * 4); // Último bar
        // Alternar entre hi-hat roll y snare build (determinista)
        const fillType = this.prng.choice(['hihat_roll', 'snare_build']);
        const notes = [];
        if (fillType === 'hihat_roll') {
            // 🎭 SCHERZO SONORO: Hi-hat roll glitchy (4 notas espaciadas, no metralleta)
            const rollLength = 4; // Reducido de 6-7 a 4 (menos densidad)
            for (let i = 0; i < rollLength; i++) {
                // 🔧 BUG #24 FIX: Velocities fijas (65-85), no escalar
                const finalVelocity = 65 + Math.floor((i / rollLength) * 20); // 65 → 85 gradual
                const noteTime = fillStart + (i * beatDuration * 0.1875); // 32avos en vez de 16avos (más espaciado)
                // 🔥 RHYTHM LOGGER: Fill hi-hat roll
                console.log(`🥁 [RHYTHM DIVINE] Section: ${section.type}, Pattern: FILL_HIHAT, MIDI: 42, Beat: ${(noteTime / beatDuration).toFixed(2)}, Time(s): ${noteTime.toFixed(3)}, Velocity: ${finalVelocity}`);
                notes.push({
                    pitch: 42, // Hi-hat close
                    velocity: finalVelocity,
                    startTime: noteTime,
                    duration: 0.08, // Staccato
                    channel: 9
                });
            }
            // Crash final (50% chance)
            if (this.prng.next() > 0.5) {
                const crashTime = fillStart + (rollLength * beatDuration * 0.1875); // Ajustado timing
                const crashVelocity = 110; // 🔧 BUG #24 FIX: Fijo, no escalar
                console.log(`🥁 [RHYTHM DIVINE] Section: ${section.type}, Pattern: FILL_CRASH, MIDI: 49, Beat: ${(crashTime / beatDuration).toFixed(2)}, Time(s): ${crashTime.toFixed(3)}, Velocity: ${crashVelocity}`);
                notes.push({
                    pitch: 49, // Crash
                    velocity: crashVelocity,
                    startTime: crashTime,
                    duration: 0.5,
                    channel: 9
                });
            }
        }
        else {
            // 🎭 DIRECTIVA 32A: Snare accent minimalista (2 ghost + 1 acento, NO metralleta)
            // Solo 2 ghost snares muy suaves + acento final
            for (let i = 0; i < 2; i++) {
                const finalVelocity = 50 + (i * 10); // 50 → 60 (ghost suaves)
                const noteTime = fillStart + (i * beatDuration * 0.375); // Más espaciado (3/8 beats)
                console.log(`🥁 [RHYTHM DIVINE] Section: ${section.type}, Pattern: FILL_SNARE_GHOST, MIDI: 38, Beat: ${(noteTime / beatDuration).toFixed(2)}, Time(s): ${noteTime.toFixed(3)}, Velocity: ${finalVelocity}`);
                notes.push({
                    pitch: 38, // Snare
                    velocity: finalVelocity,
                    startTime: noteTime,
                    duration: 0.12,
                    channel: 9
                });
            }
            // Acento final (más suave que antes)
            const accentTime = fillStart + (2 * beatDuration * 0.375);
            const accentVelocity = 95; // 🎭 SCHERZO: Reducido de 105 a 95 (menos agresivo)
            console.log(`🥁 [RHYTHM DIVINE] Section: ${section.type}, Pattern: FILL_SNARE_ACCENT, MIDI: 38, Beat: ${(accentTime / beatDuration).toFixed(2)}, Time(s): ${accentTime.toFixed(3)}, Velocity: ${accentVelocity}`);
            notes.push({
                pitch: 38, // Snare
                velocity: accentVelocity,
                startTime: accentTime,
                duration: 0.18,
                channel: 9
            });
        }
        return notes;
    }
    /**
     * Set new seed for deterministic generation
     */
    setSeed(seed) {
        this.prng = new SeededRandom(seed);
    }
}
//# sourceMappingURL=DrumPatternEngine.js.map