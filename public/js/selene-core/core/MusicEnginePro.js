/**
 * 🎸 MUSIC ENGINE PRO - API PRINCIPAL
 */
import { StyleEngine } from '../style/StyleEngine.js';
import { StructureEngine } from '../structure/StructureEngine.js';
import { HarmonyEngine } from '../harmony/HarmonyEngine.js';
import { MelodyEngine } from '../harmony/MelodyEngine.js';
import { VitalsIntegrationEngine } from '../vitals/VitalsIntegrationEngine.js';
import { Orchestrator } from '../orchestration/Orchestrator.js';
import { MIDIRenderer } from '../render/MIDIRenderer.js';
import { DrumPatternEngine } from '../rhythm/DrumPatternEngine.js'; // ← IMPORT
export class MusicEnginePro {
    styleEngine;
    structureEngine;
    harmonyEngine;
    melodyEngine;
    vitalsEngine;
    orchestrator;
    renderer;
    drumEngine = null; // ← INSTANCIA ÚNICA
    constructor() {
        this.styleEngine = new StyleEngine();
        this.structureEngine = new StructureEngine();
        this.harmonyEngine = new HarmonyEngine();
        this.melodyEngine = new MelodyEngine(42); // Seed inicial
        this.vitalsEngine = new VitalsIntegrationEngine();
        this.orchestrator = new Orchestrator();
        this.renderer = new MIDIRenderer();
        // drumEngine se crea en generate() cuando conocemos el tempo
    }
    async generate(params, vitals) {
        const startTime = Date.now();
        // Set deterministic seed for all engines
        this.renderer.setSeed(params.seed || 42);
        // 1. Resolver modo (ModeManager) - por ahora usar entropy como default
        const mode = {
            entropyFactor: 50,
            riskThreshold: 50,
            punkProbability: 50
        };
        // 2. Resolver estilo (StyleEngine.resolveStyle)
        const resolvedStyle = this.styleEngine.resolveStyle(params, mode, vitals);
        const stylePreset = resolvedStyle.preset;
        // 3. Aplicar Vitales (VitalsIntegrationEngine.applyVitalsToStyle)
        const modifiedStyle = vitals
            ? this.vitalsEngine.applyVitalsToStyle(stylePreset, vitals)
            : stylePreset;
        // 4. Generar estructura (StructureEngine.generateStructure)
        const structure = this.structureEngine.generateStructure(params.targetDuration || params.duration || 120, modifiedStyle, params.seed, mode);
        // 🔥 BUG #25 FIX: Crear DrumPatternEngine UNA SOLA VEZ (no en cada sección)
        const tempo = modifiedStyle.musical.tempo;
        if (!this.drumEngine || this.drumEngine['tempo'] !== tempo) {
            this.drumEngine = new DrumPatternEngine(tempo, params.seed || 42);
            console.log(`🔧 [MUSIC ENGINE PRO] DrumPatternEngine created (tempo=${tempo}, seed=${params.seed || 42})`);
        }
        // 5. Generar contenido por sección (ARQUITECTURA RADICAL: Section como SSOT)
        const allNotes = [];
        const tracks = new Map();
        for (const section of structure.sections) {
            // ✅ PASO 1: Generar Harmony PRIMERO (para calcular densidad real)
            const harmonyOptions = {
                seed: params.seed + section.index,
                section: section, // ✅ PASAR SECTION COMPLETA
                key: 0, // C major por defecto
                mode: modifiedStyle.musical.mode,
                complexity: params.complexity,
                voiceLeadingStrategy: 'smooth'
                // ❌ NO pasar tempo, totalBars - están en section
            };
            const chords = this.harmonyEngine.generateChordSequence(harmonyOptions);
            // ✅ PASO 2: Convertir chords a ResolvedChord[]
            const resolvedChords = this.convertToResolvedChords(chords, section);
            // ✅ PASO 3: Generar Melody
            const melodyOptions = {
                seed: params.seed + section.index,
                section: section, // ✅ PASAR SECTION COMPLETA
                key: 0, // C major
                mode: modifiedStyle.musical.mode,
                complexity: params.complexity,
                contour: 'arched',
                range: { min: 4, max: 6 } // Octavas 4-6 (C4-C6)
                // ❌ NO pasar tempo, duration - están en section
            };
            const melody = this.melodyEngine.generateMelody(melodyOptions);
            // ✅ PASO 4: Calcular TOTALLOAD REAL (basado en notas generadas)
            const harmonyDensity = chords.flat().length / section.duration; // notas/segundo
            const melodyDensity = melody.length / section.duration; // notas/segundo
            const totalLoad = harmonyDensity + melodyDensity;
            console.log(`[MUSIC ENGINE] Section ${section.index} (${section.type}): harmonyDensity=${harmonyDensity.toFixed(2)}, melodyDensity=${melodyDensity.toFixed(2)}, totalLoad=${totalLoad.toFixed(2)}`);
            // ✅ PASO 5: Generar capas (Orchestrator usa totalLoad REAL)
            const layers = this.orchestrator.generateLayers(section, resolvedChords, melody, // ✅ NO ajustar startTime aquí - Orchestrator lo respeta
            modifiedStyle, params.seed + section.index, mode, totalLoad, // ✅ PASAR CARGA REAL
            this.drumEngine // 🔥 BUG #25 FIX: Pasar instancia única
            );
            // ✅ PASO 6: Recopilar todas las notas
            allNotes.push(...melody); // ✅ Melody ya tiene startTime correcto
            if (layers.harmony)
                allNotes.push(...layers.harmony);
            if (layers.bass)
                allNotes.push(...layers.bass);
            if (layers.rhythm)
                allNotes.push(...layers.rhythm);
            if (layers.pad)
                allNotes.push(...layers.pad);
            // ✅ PASO 7: Separar en tracks
            this.addToTrack(tracks, 'Melody', melody);
            this.addToTrack(tracks, 'Harmony', layers.harmony || []);
            this.addToTrack(tracks, 'Bass', layers.bass || []);
            this.addToTrack(tracks, 'Rhythm', layers.rhythm || []);
            if (layers.pad)
                this.addToTrack(tracks, 'Pad', layers.pad);
        }
        // Generate transition fills between sections
        for (let i = 0; i < structure.sections.length - 1; i++) {
            const currentSection = structure.sections[i];
            const nextSection = structure.sections[i + 1];
            // Generate transition fill
            const transitionFill = this.generateTransitionFill(currentSection, nextSection, [] // chords array (pasar los acordes relevantes)
            );
            allNotes.push(...transitionFill);
        }
        // 6. Generar Poesía (placeholder)
        const poetry = await this.generatePoetry(params.seed, structure);
        // 7. Orquestar y mezclar (Orchestrator.separateIntoTracks, Orchestrator.applyMixing)
        const separatedTracks = this.orchestrator.separateIntoTracks(tracks.get('Melody') || [], {
            harmony: tracks.get('Harmony') || [],
            bass: tracks.get('Bass') || [],
            rhythm: tracks.get('Rhythm') || [],
            pad: tracks.get('Pad')
        }, modifiedStyle);
        const mixedTracks = this.orchestrator.applyMixing(separatedTracks, modifiedStyle);
        // 8. Renderizar MIDI (MIDIRenderer.renderMultiTrack)
        const midiBuffer = this.renderer.renderMultiTrack(mixedTracks, structure, modifiedStyle);
        // 9. Construir MusicEngineOutput
        const output = {
            midi: {
                buffer: midiBuffer,
                notes: allNotes,
                tracks: Array.from(mixedTracks.values()).map((track, index) => ({
                    id: `track-${index}`,
                    name: Array.from(mixedTracks.keys())[index],
                    channel: index,
                    notes: track,
                    volume: 100
                }))
            },
            poetry,
            metadata: {
                duration: structure.totalDuration,
                tempo: structure.globalTempo,
                key: 'C', // TODO: derivar de rootRange
                mode: modifiedStyle.musical.mode,
                structure: structure.sections.map(s => s.type).join('-'),
                stylePreset: params.stylePreset || 'default',
                seed: params.seed,
                timestamp: params.seed * 1000 // Timestamp determinista basado en seed
            },
            analysis: {
                complexity: params.complexity,
                intensity: vitals?.stress || 0.5,
                harmony: vitals?.harmony || 0.5,
                motifDevelopment: 'fibonacci-based',
                progressionUsed: 'I-V-vi-IV'
            }
        };
        // 10. Persistir (placeholder)
        await this.persistOutput(output);
        // 11. Reportar métricas
        await this.reportMetrics(startTime, output);
        return output;
    }
    async generateFromConsensus(result) {
        const params = this.consensusToParams(result);
        return this.generate(params);
    }
    async quickGenerate(style, duration, seed) {
        const params = {
            seed,
            beauty: 0.5,
            complexity: 0.5,
            duration,
            stylePreset: style
        };
        return this.generate(params);
    }
    consensusToParams(result) {
        // Convertir resultado de ConsensusResult a MusicGenerationParams
        // Usar timestamp + process.pid para seed determinista (Axioma Anti-Simulación)
        return {
            seed: result.seed || (Date.now() + (process.pid || 0)),
            beauty: result.beauty || 0.5,
            complexity: result.complexity || 0.5,
            duration: result.duration || 120,
            stylePreset: result.stylePreset || 'cyberpunk-ambient',
            mode: result.mode || 'entropy'
        };
    }
    addToTrack(tracks, trackName, notes) {
        if (!tracks.has(trackName)) {
            tracks.set(trackName, []);
        }
        tracks.get(trackName).push(...notes);
    }
    /**
     * ✅ HELPER: Convertir MIDINote[][] (chords del HarmonyEngine) a ResolvedChord[]
     * Respeta section.duration y section.bars para calcular tiempos correctos
     */
    convertToResolvedChords(chords, section) {
        const secondsPerBar = section.duration / section.bars;
        return chords.map((chord, index) => {
            // Calcular startTime basado en la posición del acorde
            // Si el acorde ya tiene startTime (del HarmonyEngine), usarlo
            // Si no, calcularlo como offset dentro de la sección
            const chordStartTime = chord[0]?.startTime ?? (section.startTime + (index * secondsPerBar));
            const chordDuration = chord[0]?.duration ?? secondsPerBar;
            return {
                notes: chord.map(n => n.pitch),
                root: chord[0]?.pitch || 60,
                startTime: chordStartTime,
                duration: chordDuration
            };
        });
    }
    async generatePoetry(seed, structure) {
        // Placeholder - implementar generación de poesía
        console.log(`Generating poetry with seed ${seed} for structure with ${structure.sections.length} sections`);
        const verses = [
            `Verse 1: Generated with seed ${seed}`,
            `Verse 2: Structure has ${structure.sections.length} sections`,
            `Verse 3: Musical journey unfolds`
        ];
        return {
            verses,
            fullText: verses.join('\n'),
            theme: 'musical-journey',
            mood: 'contemplative'
        };
    }
    async persistOutput(output) {
        // Placeholder - implementar persistencia (Redis, filesystem, etc.)
        console.log(`Persisting output with ${output.midi.notes.length} notes`);
    }
    async reportMetrics(startTime, output) {
        const duration = Date.now() - startTime;
        console.log(`Generation completed in ${duration}ms`);
        console.log(`Generated ${output.midi.notes.length} notes across ${output.midi.tracks.length} tracks`);
    }
    /**
     * Generate transition fills between sections
     */
    generateTransitionFill(fromSection, toSection, chords) {
        const fillNotes = [];
        const transitionStart = fromSection.startTime + fromSection.duration - 2; // Last 2 seconds
        const transitionDuration = 2; // 2 seconds fill
        // Drum fill (snare roll)
        for (let t = 0; t < transitionDuration; t += 0.125) { // 16th notes
            fillNotes.push({
                pitch: 38, // Snare
                velocity: 60 + Math.floor(t / transitionDuration * 40), // Crescendo
                startTime: transitionStart + t,
                duration: 0.1,
                channel: 9
            });
        }
        // Cymbal crash at transition point
        fillNotes.push({
            pitch: 49, // Crash cymbal
            velocity: 100,
            startTime: fromSection.startTime + fromSection.duration,
            duration: 3.0, // Long ring
            channel: 9
        });
        return fillNotes;
    }
}
//# sourceMappingURL=MusicEnginePro.js.map