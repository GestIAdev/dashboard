/**
 * 🎵 MELODY ENGINE
 * Motor de melodía para generar líneas melódicas
 */
import { SeededRandom } from '../utils/SeededRandom.js';
/**
 * Motor de melodía principal
 */
export class MelodyEngine {
    random;
    constructor(seed = 42) {
        this.random = new SeededRandom(seed);
    }
    /**
     * Generar melodía completa
     * ✅ REFACTORIZADO: Recibe section completa, respeta section.duration
     * @param options Opciones de generación
     * @returns Notas melódicas MIDI
     */
    generateMelody(options) {
        const { section, key, mode, complexity, contour, range, seed } = options;
        // ✅ USAR section.duration, section.tempo DIRECTAMENTE
        const duration = section.duration;
        const tempo = section.profile?.tempoMultiplier
            ? (section.profile.tempoMultiplier * 120) // TODO: Obtener tempo base de StylePreset
            : 120; // Fallback
        // 🔥 DETERMINISMO: Re-inicializar random con el seed proporcionado
        this.random = new SeededRandom(seed);
        // Generar motivo base
        const motif = this.generateMotif(key, mode, complexity, tempo);
        // Aplicar transformaciones según complejidad
        const transformedMotif = this.applyTransformations(motif, complexity);
        // Desarrollar motivo en frase completa
        const phrase = this.developPhrase(transformedMotif, duration, tempo, contour);
        // Aplicar contorno melódico
        const contouredPhrase = this.applyContour(phrase, contour, range);
        // ✅ AJUSTAR startTime para incluir offset de sección
        const melody = contouredPhrase.map(note => ({
            ...note,
            startTime: note.startTime + section.startTime
        }));
        // ✅ VALIDACIÓN: Asegurar que no excedemos section.duration
        const sectionEnd = section.startTime + section.duration;
        const lastNote = melody[melody.length - 1];
        if (lastNote && (lastNote.startTime + lastNote.duration) > sectionEnd) {
            const excess = (lastNote.startTime + lastNote.duration) - sectionEnd;
            console.warn(`[MELODY DEBUG] Last note exceeds section end by ${excess.toFixed(2)}s, truncating`);
            lastNote.duration = Math.max(0.1, lastNote.duration - excess);
        }
        // 🔍 DEBUG: Log first 5 notes después de contour
        console.log(`[MELODY DEBUG] Section ${section.index}: Generated ${melody.length} notes, duration: ${duration.toFixed(2)}s`);
        melody.slice(0, 5).forEach((note, i) => {
            console.log(`  [${i}] pitch=${note.pitch}, startTime=${note.startTime.toFixed(3)}s, duration=${note.duration.toFixed(3)}s`);
        });
        return melody;
    }
    /**
     * Generar motivo melódico base
     * ✅ BUG #25 FIX RADICAL (ARQUITECTO-33A): FRASES CANTABLES
     * - Escalas restrictivas (pentatónicas para cyberpunk)
     * - Saltos máximos de 5 semitonos (4ta justa)
     * - Motivos de 3-4 notas (memor

ables)
     */
    generateMotif(key, mode, complexity, tempo) {
        // 🔥 ARQUITECTO-33A: Motivos más cortos (3-4 notas, no 4-8)
        const motifLength = complexity > 0.7 ? 4 : 3;
        const motif = [];
        // 🔥 ARQUITECTO-33A: Escala RESTRICTIVA (pentatónica para cyberpunk)
        // Pentatónica = solo 5 notas (saltos más pequeños, más cantable)
        const scale = this.getRestrictiveScale(key, mode);
        let currentTime = 0;
        let previousPitch = this.random.choice(scale) + (4 * 12); // Octava 4
        for (let i = 0; i < motifLength; i++) {
            // 🔥 ARQUITECTO-33A: RESTRICCIÓN DE SALTO MELÓDICO (max 5 semitonos = 4ta justa)
            const MAX_MELODIC_INTERVAL = 5; // 5 semitonos (4ta justa)
            // Generar pitch cercano al anterior (evitar saltos de campanitas)
            let pitch;
            let attempts = 0;
            do {
                pitch = this.random.choice(scale) + (4 * 12); // Octava 4
                attempts++;
                if (attempts > 10) {
                    // Fallback: usar pitch anterior ± 2 semitonos
                    pitch = previousPitch + this.random.choice([-2, -1, 0, 1, 2]);
                    break;
                }
            } while (Math.abs(pitch - previousPitch) > MAX_MELODIC_INTERVAL);
            const durationSeconds = this.getFibonacciDuration(i, motifLength, 'verse');
            // Calculate velocity with musical intelligence
            const baseVelocity = 80;
            const contourVelocity = this.calculateDynamicVelocity(i, motifLength);
            const accentVelocity = (i % 4 === 0) ? 15 : 0; // Accent downbeats
            const microVariation = this.random.nextInt(-5, 5);
            const velocity = Math.min(127, Math.max(40, baseVelocity + contourVelocity + accentVelocity + microVariation));
            motif.push({
                pitch,
                velocity,
                startTime: currentTime,
                duration: durationSeconds
            });
            previousPitch = pitch; // Actualizar para siguiente nota
            currentTime += durationSeconds;
        }
        return motif;
    }
    /**
     * 🔥 ARQUITECTO-33A: Escalas RESTRICTIVAS (pentatónicas y blues)
     * Solo 5 notas por escala (vs 7 notas en escalas mayores/menores)
     * Resultado: Saltos más pequeños, frases más cantables
     */
    getRestrictiveScale(key, mode) {
        // 🔥 FORZAR PENTATÓNICA PARA CYBERPUNK (más restrictiva)
        const scales = {
            'major': [0, 2, 4, 7, 9], // Pentatónica mayor (5 notas)
            'minor': [0, 3, 5, 7, 10], // Pentatónica menor (5 notas)
            'dorian': [0, 2, 3, 7, 9], // Pentatónica dorian (5 notas)
            'phrygian': [0, 1, 5, 7, 10], // Pentatónica phrygian (5 notas)
            'lydian': [0, 2, 4, 7, 9], // Pentatónica mayor (más brillante)
            'mixolydian': [0, 2, 4, 7, 9], // Pentatónica mayor (blues-rock)
            'pentatonic': [0, 2, 4, 7, 9], // Pentatónica mayor
            'blues': [0, 3, 5, 6, 7, 10] // Blues (6 notas, incluye blue note)
        };
        const intervals = scales[mode] || scales['pentatonic'];
        return intervals.map(interval => key + interval);
    }
    /**
     * Obtener duración basada en secuencia Fibonacci
     */
    getFibonacciDuration(position, totalLength, context = 'verse') {
        // Context-aware duration pools
        const durationPools = {
            intro: [1.0, 1.5, 2.0, 3.0], // Notas largas, espaciadas
            verse: [0.5, 0.75, 1.0, 1.5], // Variedad moderada
            climax: [0.25, 0.5, 0.75, 1.0], // Notas más rápidas
            outro: [1.5, 2.0, 3.0, 4.0] // Muy largas, decayendo
        };
        const durations = durationPools[context];
        // Use Fibonacci for organic variation within context
        const fib = [1, 1, 2, 3, 5, 8];
        const fibIndex = position % fib.length;
        const durationIndex = fib[fibIndex] % durations.length;
        // Add micro-variation (±10%) for humanization
        const baseDuration = durations[durationIndex];
        const microVariation = 1 + (this.random.next() * 0.2 - 0.1); // Usa SeededRandom
        return baseDuration * microVariation;
    }
    /**
     * Calculate dynamic velocity based on melodic contour
     * Higher notes = louder (natural tendency)
     * Creates musical phrasing
     */
    calculateDynamicVelocity(position, totalLength) {
        const progress = position / (totalLength - 1);
        // Crescendo to middle, diminuendo after
        if (progress < 0.5) {
            return progress * 40; // +0 to +20
        }
        else {
            return (1 - progress) * 40; // +20 to +0
        }
    }
    /**
     * Aplicar transformaciones al motivo
     */
    applyTransformations(motif, complexity) {
        let transformed = [...motif];
        if (complexity > 0.3) {
            transformed = this.applyRetrograde(transformed);
        }
        if (complexity > 0.5) {
            transformed = this.applyInversion(transformed);
        }
        if (complexity > 0.7) {
            transformed = this.applyAugmentation(transformed);
        }
        return transformed;
    }
    /**
     * Desarrollo del motivo en frase completa
     * ✅ BUG #25 FIX RADICAL (ARQUITECTO-33A): MOTIVOS REPETIDOS + SWING
     * - Repite motivo base 70% del tiempo (coherencia)
     * - Solo transforma 30% del tiempo (variación sutil)
     * - Añade swing timing (off-beats desplazados 8-12ms)
     */
    developPhrase(motif, duration, tempo, contour) {
        const phrase = [];
        const motifDurationSeconds = motif.reduce((sum, note) => sum + note.duration, 0);
        const repetitions = Math.ceil(duration / motifDurationSeconds);
        // 🔥 ARQUITECTO-33A: Swing parameters (como DrumPatternEngine)
        const swingAmount = 0.08; // 8% swing (sutil pero audible)
        const beatDuration = (60 / tempo); // Segundos por beat
        let currentTime = 0;
        for (let i = 0; i < repetitions; i++) {
            // 🔥 ARQUITECTO-33A: REPETIR MOTIVO BASE 70% del tiempo (coherencia)
            // Solo transformar 30% del tiempo (variación sutil, no caos)
            const shouldTransform = this.random.next() < 0.3; // 30% chance de transformación
            const transformedMotif = shouldTransform
                ? this.transformMotifForRepetition(motif, i, contour)
                : motif; // ← ¡REPETIR SIN TRANSFORMAR!
            // Ajustar startTime de cada nota + SWING
            for (const note of transformedMotif) {
                let noteStartTime = currentTime + note.startTime;
                // 🎭 ARQUITECTO-33A: SWING (desplazar off-beats como DrumPatternEngine)
                // Detectar si la nota cae en off-beat (aproximadamente)
                const beatPosition = (noteStartTime % beatDuration) / beatDuration;
                const isOffBeat = beatPosition > 0.4 && beatPosition < 0.6; // Rango 0.4-0.6 = off-beat
                if (isOffBeat) {
                    // Añadir swing delay (8% del beat)
                    noteStartTime += swingAmount * beatDuration;
                }
                phrase.push({
                    ...note,
                    startTime: noteStartTime
                });
            }
            currentTime += motifDurationSeconds;
        }
        // Filtrar notas que excedan duration
        return phrase.filter(note => note.startTime < duration);
    }
    /**
     * Transformar motivo para repetición
     * ✅ BUG #25 FIX RADICAL (ARQUITECTO-33A): TRANSFORMACIONES SUTILES
     * Solo usa transposition (±2-5 semitonos) para variación orgánica
     * NO usa retrograde/inversion (demasiado abstracto para melodías cantables)
     */
    transformMotifForRepetition(motif, repetition, contour) {
        if (repetition === 0)
            return motif; // Primera repetición sin transformación
        // 🔥 ARQUITECTO-33A: Solo TRANSPOSITION (variación orgánica)
        // Transposiciones sutiles: ±2, ±3, ±5 semitonos (intervalos musicales)
        const musicalIntervals = [-5, -3, -2, 2, 3, 5]; // 4ta desc, 3ra desc, 2da desc, 2da asc, 3ra asc, 4ta asc
        const interval = this.random.choice(musicalIntervals);
        return this.applyTransposition(motif, interval);
    }
    /**
     * Aplicar transformación específica al motivo
     */
    applyMotifTransformation(motif, transformation) {
        switch (transformation) {
            case 'retrograde':
                return this.applyRetrograde(motif);
            case 'inversion':
                return this.applyInversion(motif);
            case 'augmentation':
                return this.applyAugmentation(motif);
            case 'diminution':
                return this.applyDiminution(motif);
            case 'transposition':
                return this.applyTransposition(motif, this.random.nextInt(-7, 7));
            case 'rhythmDisplacement':
                return this.applyRhythmDisplacement(motif);
            case 'fragmentation':
                return this.applyFragmentation(motif);
            default:
                return motif;
        }
    }
    /**
     * Retrograde: invertir orden de notas
     */
    applyRetrograde(motif) {
        const reversed = [...motif].reverse();
        let currentTime = 0;
        return reversed.map(note => {
            const retrogradeNote = {
                ...note,
                startTime: currentTime
            };
            currentTime += note.duration;
            return retrogradeNote;
        });
    }
    /**
     * Inversion: invertir intervalos
     */
    applyInversion(motif) {
        if (motif.length === 0)
            return motif;
        const pivot = motif[0].pitch;
        return motif.map(note => ({
            ...note,
            pitch: pivot - (note.pitch - pivot)
        }));
    }
    /**
     * Augmentation: alargar duraciones
     */
    applyAugmentation(motif) {
        let currentTime = 0;
        return motif.map(note => {
            const augmentedNote = {
                ...note,
                startTime: currentTime,
                duration: note.duration * 2
            };
            currentTime += augmentedNote.duration;
            return augmentedNote;
        });
    }
    /**
     * Diminution: acortar duraciones
     */
    applyDiminution(motif) {
        let currentTime = 0;
        return motif.map(note => {
            const diminishedNote = {
                ...note,
                startTime: currentTime,
                duration: Math.max(0.125, note.duration / 2) // Mínimo 0.125 segundos
            };
            currentTime += diminishedNote.duration;
            return diminishedNote;
        });
    }
    /**
     * Transposition: transponer por semitonos
     */
    applyTransposition(motif, semitones) {
        return motif.map(note => ({
            ...note,
            pitch: note.pitch + semitones
        }));
    }
    /**
     * Rhythm displacement: desplazar ritmos
     */
    applyRhythmDisplacement(motif) {
        const displaced = [];
        let timeOffset = 0;
        for (let i = 0; i < motif.length; i++) {
            const note = motif[i];
            const nextNote = motif[(i + 1) % motif.length];
            const displacement = (nextNote.startTime - note.startTime) * 0.25; // 25% displacement
            displaced.push({
                ...note,
                startTime: note.startTime + timeOffset
            });
            timeOffset += displacement;
        }
        return displaced;
    }
    /**
     * Fragmentation: dividir notas en fragmentos
     */
    applyFragmentation(motif) {
        const fragmented = [];
        for (const note of motif) {
            // Dividir cada nota en 2-3 fragmentos
            const fragments = this.random.nextInt(2, 4);
            const fragmentDuration = note.duration / fragments;
            for (let i = 0; i < fragments; i++) {
                fragmented.push({
                    ...note,
                    startTime: note.startTime + (i * fragmentDuration),
                    duration: fragmentDuration,
                    velocity: note.velocity - 10 // Más suave
                });
            }
        }
        return fragmented;
    }
    /**
     * Aplicar contorno melódico
     */
    applyContour(phrase, contour, range) {
        const contouredPhrase = [...phrase];
        const totalNotes = contouredPhrase.length;
        for (let i = 0; i < totalNotes; i++) {
            const progress = i / (totalNotes - 1); // 0 to 1
            const targetOctave = this.calculateContourShift(contour, progress, range);
            // Extraer nota (0-11) y reemplazar octava
            const noteClass = contouredPhrase[i].pitch % 12;
            contouredPhrase[i].pitch = noteClass + (targetOctave * 12);
        }
        return contouredPhrase;
    }
    /**
     * Calcular shift de octava según contorno
     */
    calculateContourShift(contour, progress, range) {
        const { min, max } = range;
        let shift = 0;
        switch (contour) {
            case 'ascending':
                shift = min + (progress * (max - min));
                break;
            case 'descending':
                shift = max - (progress * (max - min));
                break;
            case 'arched':
                // Asymmetric arch (golden ratio peak at ~0.618)
                const peakPosition = 0.618; // Golden ratio for natural climax
                const ascent = progress < peakPosition;
                const phase = ascent ? progress / peakPosition : (1 - progress) / (1 - peakPosition);
                // Ease-in-out curve (more natural than linear)
                const easedPhase = phase < 0.5
                    ? 2 * phase * phase
                    : 1 - Math.pow(-2 * phase + 2, 2) / 2;
                shift = ascent
                    ? min + easedPhase * (max - min)
                    : min + easedPhase * (max - min);
                break;
            case 'valley':
                shift = progress < 0.5
                    ? max - (progress * 2 * (max - min))
                    : min + ((progress - 0.5) * 2 * (max - min));
                break;
            case 'wave':
                // Multiple waves with controlled amplitude
                const waveFrequency = 3; // 3 ciclos completos
                const waveAmplitude = 0.6; // Solo 60% del rango (evita extremos)
                const centerOctave = (min + max) / 2;
                shift = centerOctave + Math.sin(progress * Math.PI * 2 * waveFrequency) * (max - min) * waveAmplitude;
                break;
            case 'static':
            default:
                shift = (min + max) / 2;
                break;
        }
        return Math.round(shift);
    }
}
//# sourceMappingURL=MelodyEngine.js.map