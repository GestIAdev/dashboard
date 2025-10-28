import express, { Request, Response, Router } from 'express';
import { redis } from '../server.js';
import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL } from 'url';

const router: Router = express.Router();


/**
 * 🎵 POST /generate - Generar música con MusicEnginePro
 */
router.post('/generate', async (req, res) => {
  try {
    const {
      stylePreset = 'cyberpunk-ambient',
      duration = 60,
      seed,
      complexity,
      beauty
    } = req.body;

    // Validar parámetros
    if (duration < 30 || duration > 300) {
      return res.status(400).json({
        success: false,
        error: 'Duration must be between 30 and 300 seconds',
        code: 'VALIDATION_ERROR'
      });
    }

    console.log(`🎹 [Music Engine] Generating music: ${stylePreset}, ${duration}s, seed: ${seed || 'random'}`);

    // Importar MusicEnginePro dinámicamente - CORREGIDO: subir 3 niveles hasta Dentiagest/
    const musicEnginePath = path.resolve(__dirname, '../../../selene/dist/src/engines/music/core/MusicEnginePro.js');
    const { MusicEnginePro } = require(musicEnginePath);

    // Crear instancia y generar
    const musicEngine = new MusicEnginePro();
    const startTime = Date.now();

    const output = await musicEngine.generate({
      targetDuration: duration,
      seed: seed || Math.floor(Math.random() * 999999999),
      stylePreset,
      complexity,
      beauty
    });

    const generationTime = Date.now() - startTime;

    // Generar ID único
    const generationId = `${Date.now()}_${output.metadata.seed}`;

    // Guardar archivo MIDI
    const generatedDir = path.join(__dirname, '../generated');
    if (!fs.existsSync(generatedDir)) {
      fs.mkdirSync(generatedDir, { recursive: true });
    }

    const midiPath = path.join(generatedDir, `${generationId}.mid`);
    fs.writeFileSync(midiPath, output.midi.buffer);

    // Validate MIDI buffer before sending
    const midiBuffer = output.midi.buffer;
    const isValidMidi = midiBuffer.length >= 14 
        && midiBuffer[0] === 0x4D 
        && midiBuffer[1] === 0x54 
        && midiBuffer[2] === 0x68 
        && midiBuffer[3] === 0x64;
    
    console.log(`🔍 [Music Engine] MIDI buffer validation:`, {
      length: midiBuffer.length,
      header: midiBuffer.slice(0, 4).toString('hex'),
      isValid: isValidMidi
    });

    if (!isValidMidi) {
      throw new Error('Generated MIDI buffer is invalid - missing MThd header');
    }

    // Guardar metadata en Redis (opcional, 1 hora de expiración)
    await redis.setex(
      `music:${generationId}`,
      3600,
      JSON.stringify({
        metadata: output.metadata,
        analysis: output.analysis,
        generationTime
      })
    );

    console.log(`✅ [Music Engine] Generated in ${generationTime}ms`);

    res.json({
      success: true,
      generationId,
      output: {
        metadata: output.metadata,
        analysis: output.analysis,
        midi: {
          buffer: output.midi.buffer.toString('base64'),
          notes: output.midi.notes.slice(0, 100),
          tracks: output.midi.tracks
        }
      },
      downloadUrl: `/api/music/midi/${generationId}`,
      estimatedTime: generationTime
    });
  } catch (error) {
    console.error('❌ [Music Engine] Generation failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'GENERATION_ERROR'
    });
  }
});

/**
 * 🎨 GET /presets - Obtener presets disponibles
 */
router.get('/presets', async (req, res) => {
  try {
    const presets = [
      {
        id: 'cyberpunk-ambient',
        name: 'Cyberpunk Ambient',
        description: 'Dark atmospheric soundscapes with synthetic textures',
        category: 'ambient',
        defaultParams: { complexity: 0.5, beauty: 0.7, tempo: 80 },
        color: '#00ffff'
      },
      {
        id: 'indie-game-loop',
        name: 'Indie Game Loop',
        description: 'Catchy, loopable melodies perfect for gaming',
        category: 'energetic',
        defaultParams: { complexity: 0.6, beauty: 0.8, tempo: 120 },
        color: '#ff0088'
      },
      {
        id: 'lofi-minimalist',
        name: 'Lo-Fi Minimalist',
        description: 'Chill beats with minimal instrumentation',
        category: 'minimalist',
        defaultParams: { complexity: 0.4, beauty: 0.75, tempo: 90 },
        color: '#9d4edd'
      },
      {
        id: 'epic-orchestral',
        name: 'Epic Orchestral',
        description: 'Dramatic orchestral arrangements',
        category: 'energetic',
        defaultParams: { complexity: 0.8, beauty: 0.9, tempo: 140 },
        color: '#ffd700'
      },
      {
        id: 'glitch-experimental',
        name: 'Glitch Experimental',
        description: 'Chaotic experimental electronic music',
        category: 'experimental',
        defaultParams: { complexity: 0.9, beauty: 0.5, tempo: 160 },
        color: '#ff4444'
      }
    ];

    res.json({ presets });
  } catch (error) {
    console.error('❌ [Music Engine] Failed to get presets:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 💾 GET /midi/:id - Descargar archivo MIDI generado
 */
router.get('/midi/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validar ID
    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid generation ID'
      });
    }

    // Sanitizar ID para prevenir path traversal
    const sanitizedId = id.replace(/[^a-zA-Z0-9_-]/g, '');
    if (sanitizedId !== id) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ID format'
      });
    }

    // Construir ruta al archivo
    const midiPath = path.join(__dirname, '../generated', `${sanitizedId}.mid`);

    // Verificar que existe
    if (!fs.existsSync(midiPath)) {
      return res.status(404).json({
        success: false,
        error: 'MIDI file not found'
      });
    }

    // Leer y enviar archivo
    const fileBuffer = fs.readFileSync(midiPath);

    res.setHeader('Content-Type', 'audio/midi');
    res.setHeader('Content-Disposition', `attachment; filename="selene-${sanitizedId}.mid"`);
    res.setHeader('Content-Length', fileBuffer.length);

    res.send(fileBuffer);

    console.log(`💾 [Music Engine] Downloaded: ${sanitizedId}.mid`);
  } catch (error) {
    console.error('❌ [Music Engine] Download failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 🔍 GET /synergy-mode - Obtener modo actual de Synergy
 * (Usado por Music Engine UI para mostrar modo activo)
 */
router.get('/synergy-mode', async (req, res) => {
  try {
    // Leer modo actual desde ModeManager
    const modulePath = path.resolve(__dirname, '../../selene/dist/src/evolutionary/modes/mode-manager.js');
    const { ModeManager } = await import(modulePath);
    
    const modeManager = ModeManager.getInstance();
    const mode = modeManager.getCurrentMode();
    const config = modeManager.getModeConfig();

    res.json({
      mode: mode.toUpperCase(),
      config
    });
  } catch (error) {
    console.error('❌ [Synergy] Failed to get current mode:', error);
    // Fallback a modo BALANCED
    res.json({
      mode: 'BALANCED',
      config: {
        entropyFactor: 0.5,
        riskThreshold: 'medium',
        punkProbability: 0.15
      }
    });
  }
});

export default router;