/**
 * 🎹 SAMPLE LIBRARY CONFIG GENERATOR (AUTOMÁTICO)
 * 
 * Escanea recursivamente el directorio cyberpunk-ambient/
 * y construye automáticamente el config.json con mapeo nota→archivo.
 * 
 * PATRONES DE NAMING SOPORTADOS:
 * 1. "90s_PulseBuzzLead-C4.wav" (guión + nota explícita)
 * 2. "90s_CeeVoicePad_A1.wav" (underscore + nota explícita)
 * 3. "Violin A3.WAV" (espacio + nota)
 * 4. "Choir Aaaah's Male + Female A#2.wav" (nombre largo + nota)
 * 5. "a#1.wav" (lowercase directo)
 * 6. "c4.wav" (lowercase directo)
 * 7. "808 1 - C.wav" (808 sin octava - asumir C1)
 * 8. "LDHV_Layered_A_01.wav" (sin octava - asumir rango por índice)
 * 
 * AUTHOR: PunkClaude + Radwulf + PunkArchytect
 * DATE: 2025-11-02
 */

const fs = require('fs');
const path = require('path');

// ================================================================================
// CONFIGURACIÓN
// ================================================================================

const BASE_DIR = __dirname; // dashboard-new/public/samples/cyberpunk-ambient/
const OUTPUT_FILE = path.join(BASE_DIR, 'config.json');

// Mapeo de notas MIDI para drums (General MIDI Standard)
const DRUM_MIDI_MAP = {
    'kick-1.wav': 36,      // C2
    'kick-2.wav': 35,      // B1
    'snare-1.wav': 38,     // D2
    'snare-2.wav': 40,     // E2
    'clap.wav': 39,        // D#2
    'hihat-close.wav': 42, // F#2
    'hihat-open.wav': 46,  // A#2
    'hihat-pedal.wav': 44, // G#2
    'crash.wav': 49,       // C#3
    'Ride.wav': 51,        // D#3
    'tom-high.wav': 50,    // D3
    'tom-mid.wav': 47,     // B2
    'tom-low.wav': 45,     // A2
    'rim.wav': 37,         // C#2
    'shaker.wav': 70,      // A#4
    'tambourine.wav': 54   // F#3
};

// ================================================================================
// PARSER DE NOTAS (INTELIGENTE)
// ================================================================================

/**
 * Extrae nota musical (ej. "C4", "A#2", "F#1") de un nombre de archivo.
 * Soporta múltiples formatos.
 */
function extractNoteFromFilename(filename) {
    // Eliminar extensión
    const nameWithoutExt = filename.replace(/\.(wav|mp3|ogg|WAV|MP3|OGG)$/i, '');

    // PATRÓN 1: Lowercase directo (a#1.wav, c4.wav)
    const lowercaseMatch = nameWithoutExt.match(/^([a-g]#?)(\d)$/i);
    if (lowercaseMatch) {
        const note = lowercaseMatch[1].toUpperCase();
        const octave = lowercaseMatch[2];
        return `${note}${octave}`;
    }

    // PATRÓN 2: Nota al final con guión (90s_PulseBuzzLead-C4)
    const dashMatch = nameWithoutExt.match(/[-_]([A-G]#?)(\d)$/);
    if (dashMatch) {
        return `${dashMatch[1]}${dashMatch[2]}`;
    }

    // PATRÓN 3: Nota al final con espacio (Violin A3, Choir Aaaah's Male + Female A#2)
    const spaceMatch = nameWithoutExt.match(/\s([A-G]#?)(\d)$/);
    if (spaceMatch) {
        return `${spaceMatch[1]}${spaceMatch[2]}`;
    }

    // PATRÓN 4: 808 sin octava (808 1 - C → asumir C1)
    const bass808Match = nameWithoutExt.match(/808\s+\d+\s+-\s+([A-G]#?)$/);
    if (bass808Match) {
        return `${bass808Match[1]}1`; // Asignar octava 1 por defecto para bass
    }

    // PATRÓN 5: Layered sin octava (LDHV_Layered_A_01 → inferir octava por índice)
    const layeredMatch = nameWithoutExt.match(/Layered_([A-GC])_(\d{2})$/);
    if (layeredMatch) {
        const note = layeredMatch[1];
        const index = parseInt(layeredMatch[2], 10);
        // Inferir octava: índices 01-08 → octavas 1-8
        const octave = index;
        return `${note}${octave}`;
    }

    // NO SE PUDO EXTRAER
    return null;
}

/**
 * Convierte nota musical (ej. "C4") a número MIDI (ej. 60)
 */
function noteToMidi(note) {
    const noteMap = {
        'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
        'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
    };

    const match = note.match(/^([A-G]#?)(\d)$/);
    if (!match) return null;

    const noteName = match[1];
    const octave = parseInt(match[2], 10);

    if (!(noteName in noteMap)) return null;

    // MIDI note number = (octave + 1) * 12 + noteMap[noteName]
    return (octave + 1) * 12 + noteMap[noteName];
}

// ================================================================================
// ESCANEADO RECURSIVO
// ================================================================================

/**
 * Escanea recursivamente un directorio y retorna todos los archivos .wav
 */
function scanDirectory(dir, fileList = []) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            scanDirectory(fullPath, fileList);
        } else if (/\.(wav|mp3|ogg|WAV|MP3|OGG)$/.test(file)) {
            fileList.push(fullPath);
        }
    });

    return fileList;
}

/**
 * Organiza archivos por estructura track/instrument/pack
 */
function organizeFiles() {
    const structure = {
        melody: {},
        harmony: {},
        bass: {},
        rhythm: {},
        pad: {}
    };

    const trackDirs = {
        'melody': path.join(BASE_DIR, 'melody'),
        'harmony': path.join(BASE_DIR, 'harmony'),
        'bass': path.join(BASE_DIR, 'bass'),
        'rhythm': path.join(BASE_DIR, 'drums'),
        'pad': path.join(BASE_DIR, 'pad')
    };

    // Escanear cada track
    for (const [trackName, trackDir] of Object.entries(trackDirs)) {
        if (!fs.existsSync(trackDir)) {
            console.warn(`⚠️  Track directory not found: ${trackDir}`);
            continue;
        }

        if (trackName === 'rhythm') {
            // Drums: mapeo directo MIDI
            structure.rhythm.drums = {
                type: 'drum-kit',
                samples: {}
            };

            const drumFiles = fs.readdirSync(trackDir).filter(f => /\.(wav|mp3|ogg)$/i.test(f));
            drumFiles.forEach(file => {
                const midiNote = DRUM_MIDI_MAP[file];
                if (midiNote) {
                    structure.rhythm.drums.samples[midiNote] = file;
                } else {
                    console.warn(`⚠️  Drum sample not in MIDI map: ${file}`);
                }
            });
        } else {
            // Instruments melódicos: escanear packs
            const instrumentDirs = fs.readdirSync(trackDir).filter(f => {
                const fullPath = path.join(trackDir, f);
                return fs.statSync(fullPath).isDirectory();
            });

            instrumentDirs.forEach(instrumentDir => {
                const instrumentPath = path.join(trackDir, instrumentDir);
                
                // Buscar packs dentro del instrumento
                const packDirs = fs.readdirSync(instrumentPath).filter(f => {
                    const fullPath = path.join(instrumentPath, f);
                    return fs.statSync(fullPath).isDirectory();
                });

                if (packDirs.length > 0) {
                    // Hay sub-packs (ej. melody/synth-lead/pulse-buzz-lead/)
                    packDirs.forEach(packDir => {
                        const packPath = path.join(instrumentPath, packDir);
                        const packKey = `${instrumentDir}/${packDir}`;
                        
                        structure[trackName][packKey] = {
                            type: 'pitched',
                            samples: {}
                        };

                        const files = scanDirectory(packPath);
                        files.forEach(file => {
                            const filename = path.basename(file);
                            const note = extractNoteFromFilename(filename);
                            
                            if (note) {
                                const relativePath = path.relative(BASE_DIR, file).replace(/\\/g, '/');
                                structure[trackName][packKey].samples[note] = relativePath;
                            } else {
                                console.warn(`⚠️  Could not extract note from: ${filename}`);
                            }
                        });
                    });
                } else {
                    // No hay sub-packs, archivos directos
                    structure[trackName][instrumentDir] = {
                        type: 'pitched',
                        samples: {}
                    };

                    const files = scanDirectory(instrumentPath);
                    files.forEach(file => {
                        const filename = path.basename(file);
                        const note = extractNoteFromFilename(filename);
                        
                        if (note) {
                            const relativePath = path.relative(BASE_DIR, file).replace(/\\/g, '/');
                            structure[trackName][instrumentDir].samples[note] = relativePath;
                        } else {
                            console.warn(`⚠️  Could not extract note from: ${filename}`);
                        }
                    });
                }
            });
        }
    }

    return structure;
}

// ================================================================================
// CONSTRUCCIÓN DEL CONFIG.JSON
// ================================================================================

function buildConfig() {
    console.log('🎹 Starting sample library scan...\n');

    const structure = organizeFiles();

    const config = {
        preset: 'cyberpunk-ambient',
        version: '1.0.0',
        generated: new Date().toISOString(),
        tracks: {}
    };

    // Construir configuración por track
    for (const [trackName, instruments] of Object.entries(structure)) {
        config.tracks[trackName] = {
            instruments: {}
        };

        for (const [instrumentKey, instrumentData] of Object.entries(instruments)) {
            const sampleCount = Object.keys(instrumentData.samples).length;
            
            if (sampleCount > 0) {
                config.tracks[trackName].instruments[instrumentKey] = {
                    type: instrumentData.type,
                    samples: instrumentData.samples,
                    effects: getDefaultEffects(trackName, instrumentData.type)
                };

                console.log(`✅ ${trackName}/${instrumentKey}: ${sampleCount} samples`);
            } else {
                console.warn(`⚠️  ${trackName}/${instrumentKey}: 0 samples (skipped)`);
            }
        }
    }

    return config;
}

/**
 * Efectos por defecto según track y tipo
 */
function getDefaultEffects(trackName, instrumentType) {
    if (instrumentType === 'drum-kit') {
        return {
            reverb: { decay: 1.0, wet: 0.2 },
            compression: { threshold: -20, ratio: 4 }
        };
    }

    const effectsMap = {
        melody: {
            reverb: { decay: 2.0, wet: 0.3 },
            delay: { time: '8n', feedback: 0.25, wet: 0.25 }
        },
        harmony: {
            reverb: { decay: 3.0, wet: 0.5 },
            chorus: { frequency: 0.5, depth: 0.7, wet: 0.3 }
        },
        bass: {
            saturation: { drive: 0.3 },
            compression: { threshold: -12, ratio: 6 }
        },
        pad: {
            reverb: { decay: 5.0, wet: 0.7 },
            delay: { time: '4n', feedback: 0.4, wet: 0.5 },
            stereoWidth: 1.5
        }
    };

    return effectsMap[trackName] || {};
}

// ================================================================================
// EJECUCIÓN
// ================================================================================

function main() {
    try {
        const config = buildConfig();

        // Escribir JSON con formato bonito
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(config, null, 2), 'utf8');

        console.log(`\n🎉 Config generated successfully!`);
        console.log(`📄 Output: ${OUTPUT_FILE}`);
        console.log(`\n📊 STATISTICS:`);
        console.log(`   - Melody instruments: ${Object.keys(config.tracks.melody.instruments).length}`);
        console.log(`   - Harmony instruments: ${Object.keys(config.tracks.harmony.instruments).length}`);
        console.log(`   - Bass instruments: ${Object.keys(config.tracks.bass.instruments).length}`);
        console.log(`   - Rhythm drums: ${Object.keys(config.tracks.rhythm.instruments.drums.samples).length} samples`);
        console.log(`   - Pad instruments: ${Object.keys(config.tracks.pad.instruments).length}`);

        // Calcular total de samples
        let totalSamples = 0;
        for (const track of Object.values(config.tracks)) {
            for (const instrument of Object.values(track.instruments)) {
                totalSamples += Object.keys(instrument.samples).length;
            }
        }
        console.log(`\n   🎵 TOTAL SAMPLES: ${totalSamples}`);

    } catch (error) {
        console.error('❌ Error generating config:', error);
        process.exit(1);
    }
}

// Run if executed directly
if (require.main === module) {
    main();
}

module.exports = { extractNoteFromFilename, noteToMidi, buildConfig };
