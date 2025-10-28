/**
 * 🎸 SELENE MUSIC ENGINE UI - INTERACTION LOGIC
 * "CÓDIGO = ARTE = BELLEZA = FUNCIONALIDAD"
 */

// Global state
const state = {
    currentGeneration: null,
    history: [],
    isGenerating: false,
    currentMode: 'BALANCED',
    presets: []
}

// MIDI player instance
let midiPlayer = null

// Socket.IO connection
let socket = null

/**
 * Initialize the UI
 */
async function init() {
    console.log('🎸 Initializing Music Engine UI...')

    try {
        // 1. Initialize MIDI player
        midiPlayer = new MIDIPlayer()
        await midiPlayer.init()

        // 2. Setup event listeners
        setupEventListeners()

        // 3. Load presets
        await loadPresets()

        // 4. Load current mode
        await loadCurrentMode()

        // 5. Connect Socket.IO
        connectSocket()

        // 6. Load history from localStorage
        loadHistory()

        console.log('✅ Music Engine UI initialized')
    } catch (error) {
        console.error('❌ Initialization failed:', error)
        showError('Failed to initialize Music Engine. Please refresh the page.')
    }
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Control Panel
    document.getElementById('stylePreset').addEventListener('change', onPresetChange)
    document.getElementById('duration').addEventListener('input', onDurationChange)
    document.getElementById('randomSeed').addEventListener('click', generateRandomSeed)
    document.getElementById('advancedToggle').addEventListener('click', toggleAdvancedOptions)
    document.getElementById('generateBtn').addEventListener('click', generateMusic)

    // Player Controls
    document.getElementById('playBtn').addEventListener('click', playMIDI)
    document.getElementById('pauseBtn').addEventListener('click', pauseMIDI)
    document.getElementById('stopBtn').addEventListener('click', stopMIDI)

    // Output Actions
    document.getElementById('downloadBtn').addEventListener('click', downloadMIDI)
    document.getElementById('copySeedBtn').addEventListener('click', copySeed)
    document.getElementById('viewNotesBtn').addEventListener('click', viewNotes)

    // MIDI Player callbacks
    midiPlayer.onProgress = onPlayerProgress
    midiPlayer.onEnded = onPlayerEnded

    // Timeline seek
    document.querySelector('.timeline-bar').addEventListener('click', onTimelineClick)
}

/**
 * Load available presets from API
 */
async function loadPresets() {
    try {
        const response = await fetch('/api/music/presets')
        const data = await response.json()

        state.presets = data.presets

        const selector = document.getElementById('stylePreset')
        selector.innerHTML = data.presets.map(preset => `
            <option value="${preset.id}" data-description="${preset.description}">
                ${preset.name}
            </option>
        `).join('')

        // Show first preset description
        onPresetChange()

        console.log(`✅ Loaded ${data.presets.length} presets`)
    } catch (error) {
        console.error('❌ Failed to load presets:', error)
        showError('Failed to load presets')
    }
}

/**
 * Load current Synergy mode
 */
async function loadCurrentMode() {
    try {
        const response = await fetch('/api/synergy/current-mode')
        const data = await response.json()

        state.currentMode = data.mode
        updateModeIndicator(data.mode)

        console.log(`✅ Current mode: ${data.mode}`)
    } catch (error) {
        console.error('❌ Failed to load current mode:', error)
        // Use default BALANCED mode
        updateModeIndicator('BALANCED')
    }
}

/**
 * Connect to Socket.IO for real-time updates
 */
function connectSocket() {
    socket = io()

    socket.on('connect', () => {
        console.log('🔌 Socket.IO connected')
    })

    socket.on('disconnect', () => {
        console.log('🔌 Socket.IO disconnected')
    })

    socket.on('music:progress', onGenerationProgress)
    socket.on('synergy:mode-change', onModeChange)
}

/**
 * Load history from localStorage
 */
function loadHistory() {
    const saved = localStorage.getItem('music-history')
    if (saved) {
        try {
            state.history = JSON.parse(saved)
            renderHistory()
            console.log(`✅ Loaded ${state.history.length} history items`)
        } catch (error) {
            console.error('❌ Failed to parse history:', error)
            state.history = []
        }
    }
}

/**
 * Save history to localStorage
 */
function saveHistory() {
    try {
        localStorage.setItem('music-history', JSON.stringify(state.history.slice(0, 5)))
    } catch (error) {
        console.error('❌ Failed to save history:', error)
    }
}

/**
 * Update mode indicator
 */
function updateModeIndicator(mode) {
    const badge = document.getElementById('currentMode')
    badge.className = `mode-badge ${mode.toLowerCase()}`
    badge.textContent = mode

    console.log(`🎨 Mode indicator updated: ${mode}`)
}

/**
 * Handle preset change
 */
function onPresetChange() {
    const selector = document.getElementById('stylePreset')
    const selectedOption = selector.options[selector.selectedIndex]
    const description = selectedOption.getAttribute('data-description')

    document.getElementById('presetDesc').textContent = description || 'No description available'
}

/**
 * Handle duration slider change
 */
function onDurationChange(event) {
    const value = event.target.value
    document.getElementById('durationValue').textContent = `${value}s`
}

/**
 * Generate random seed
 */
function generateRandomSeed() {
    const seed = Math.floor(Math.random() * 999999999)
    document.getElementById('seed').value = seed
}

/**
 * Toggle advanced options
 */
function toggleAdvancedOptions() {
    const toggle = document.getElementById('advancedToggle')
    const content = document.getElementById('advancedContent')

    toggle.classList.toggle('open')
    content.style.display = content.style.display === 'none' ? 'flex' : 'none'
}

/**
 * Generate music
 */
async function generateMusic() {
    if (state.isGenerating) return

    const params = {
        stylePreset: document.getElementById('stylePreset').value,
        duration: parseInt(document.getElementById('duration').value),
        seed: document.getElementById('seed').value ? parseInt(document.getElementById('seed').value) : undefined,
        complexity: document.getElementById('complexity')?.value ? parseFloat(document.getElementById('complexity').value) : undefined,
        beauty: document.getElementById('beauty')?.value ? parseFloat(document.getElementById('beauty').value) : undefined
    }

    console.log('🎹 Generating music with params:', params)

    // Update UI
    setGeneratingState(true)

    try {
        // Ensure AudioContext is started before generation (user interaction required)
        await midiPlayer.ensureAudioStarted()

        const response = await fetch('/api/music/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
        })

        const result = await response.json()

        if (result.success) {
            console.log('✅ Generation successful:', result.generationId)
            state.currentGeneration = result
            displayMIDIOutput(result)
            addToHistory(result)
            setGeneratingState(false, 'success')

            // Auto-hide success state after 2s
            setTimeout(() => setGeneratingState(false), 2000)
        } else {
            throw new Error(result.error)
        }
    } catch (error) {
        console.error('❌ Generation failed:', error)
        setGeneratingState(false, 'error')
        showError(error.message)

        // Auto-hide error state after 3s
        setTimeout(() => setGeneratingState(false), 3000)
    }
}

/**
 * Set generating state
 */
function setGeneratingState(isGenerating, result = null) {
    state.isGenerating = isGenerating

    const btn = document.getElementById('generateBtn')
    const statusText = document.getElementById('statusText')
    const progressContainer = document.getElementById('progressContainer')
    const spinner = btn.querySelector('.loading-spinner')

    if (isGenerating) {
        btn.classList.add('generating')
        btn.disabled = true
        spinner.style.display = 'inline'
        statusText.textContent = 'GENERATING'
        statusText.className = 'status-text generating'
        progressContainer.style.display = 'block'
        simulateProgress()
    } else {
        btn.classList.remove('generating', 'success', 'error')
        btn.disabled = false
        spinner.style.display = 'none'

        if (result === 'success') {
            btn.classList.add('success')
            statusText.textContent = 'SUCCESS'
            statusText.className = 'status-text success'
        } else if (result === 'error') {
            btn.classList.add('error')
            statusText.textContent = 'ERROR'
            statusText.className = 'status-text error'
        } else {
            statusText.textContent = 'IDLE'
            statusText.className = 'status-text idle'
        }

        progressContainer.style.display = 'none'
        document.getElementById('progressFill').style.width = '0%'
    }
}

/**
 * Simulate progress (fallback if no WebSocket)
 */
function simulateProgress() {
    let progress = 0
    const interval = setInterval(() => {
        if (!state.isGenerating) {
            clearInterval(interval)
            return
        }

        progress += 2
        if (progress > 90) progress = 90 // Cap at 90% until real completion

        updateProgress(progress)
    }, 100)
}

/**
 * Update progress bar
 */
function updateProgress(percent) {
    document.getElementById('progressFill').style.width = `${percent}%`
    document.getElementById('progressPercent').textContent = `${Math.round(percent)}%`
}

/**
 * Display MIDI output
 */
async function displayMIDIOutput(result) {
    const output = document.getElementById('midiOutput')
    output.style.display = 'block'
    output.classList.add('glitch-on-load')

    // Update title and timestamp
    const stylePreset = result.output.metadata?.stylePreset || 'Generated'
    const seed = result.output.metadata?.seed || 'Unknown'
    document.getElementById('outputTitle').textContent = `${stylePreset} #${seed}`
    const timestamp = result.output.metadata?.timestamp
    document.getElementById('outputTimestamp').textContent = timestamp ? new Date(timestamp).toLocaleString() : new Date().toLocaleString()

    // Update metadata
    document.getElementById('metaStyle').textContent = result.output.metadata?.stylePreset || 'Unknown'
    const complexityValue = result.output.analysis?.complexity
    document.getElementById('metaMode').textContent = `${result.output.metadata?.mode || 'Unknown'} (Entropy: ${(typeof complexityValue === 'number' && !isNaN(complexityValue)) ? (complexityValue * 100).toFixed(0) : 'N/A'}%)`
    document.getElementById('metaStructure').textContent = result.output.metadata?.structure || 'Unknown'
    document.getElementById('metaComplexity').textContent = (typeof complexityValue === 'number' && !isNaN(complexityValue)) ? complexityValue.toFixed(2) : 'N/A'
    const beautyValue = result.output.analysis?.beauty
    document.getElementById('metaBeauty').textContent = (typeof beautyValue === 'number' && !isNaN(beautyValue)) ? beautyValue.toFixed(2) : 'N/A'

    // Update last generated info
    const durationValue = result.output.metadata?.duration
    document.getElementById('lastDuration').textContent = (typeof durationValue === 'number' && !isNaN(durationValue)) ? `${durationValue}s` : 'Unknown'
    const tempoValue = result.output.metadata?.tempo
    document.getElementById('lastTempo').textContent = (typeof tempoValue === 'number' && !isNaN(tempoValue)) ? `${tempoValue} BPM` : 'Unknown'
    document.getElementById('lastKey').textContent = result.output.metadata?.key || 'Unknown'
    document.getElementById('lastSeed').textContent = result.output.metadata?.seed || 'Unknown'

    // Load MIDI into player
    await midiPlayer.loadMIDI(result.output.midi.buffer)
    document.getElementById('totalTime').textContent = MIDIPlayer.formatTime(midiPlayer.duration)

    // Remove glitch animation
    setTimeout(() => output.classList.remove('glitch-on-load'), 500)
}

/**
 * Add generation to history
 */
function addToHistory(result) {
    const item = {
        id: result.generationId,
        style: result.output.metadata.stylePreset,
        duration: result.output.metadata.duration,
        seed: result.output.metadata.seed,
        timestamp: new Date().toLocaleTimeString()
    }

    state.history.unshift(item)
    state.history = state.history.slice(0, 5) // Keep only last 5

    renderHistory()
    saveHistory()
}

/**
 * Render history list
 */
function renderHistory() {
    const list = document.getElementById('historyList')

    if (state.history.length === 0) {
        list.innerHTML = '<div class="history-empty">No generations yet</div>'
        return
    }

    list.innerHTML = state.history.map((item, index) => `
        <div class="history-item" data-id="${item.id}">
            <div class="history-info">
                <span class="history-number">#${index + 1}</span>
                <span class="history-style">${item.style}</span>
                <span class="history-duration">${item.duration}s</span>
                <span class="history-time">${item.timestamp}</span>
            </div>
            <div class="history-actions">
                <button class="history-btn play-btn" onclick="loadHistoryItem('${item.id}')">▶️</button>
                <button class="history-btn download-btn" onclick="downloadHistoryItem('${item.id}')">💾</button>
                <button class="history-btn delete-btn" onclick="deleteHistoryItem('${item.id}')">🗑️</button>
            </div>
        </div>
    `).join('')
}

/**
 * Play MIDI
 */
async function playMIDI() {
    if (!midiPlayer.getState().hasMidi) {
        showError('No MIDI loaded')
        return
    }

    await midiPlayer.play()

    document.getElementById('playBtn').style.display = 'none'
    document.getElementById('pauseBtn').style.display = 'inline-block'
}

/**
 * Pause MIDI
 */
function pauseMIDI() {
    midiPlayer.pause()

    document.getElementById('playBtn').style.display = 'inline-block'
    document.getElementById('pauseBtn').style.display = 'none'
}

/**
 * Stop MIDI
 */
function stopMIDI() {
    midiPlayer.stopPlayback()

    document.getElementById('playBtn').style.display = 'inline-block'
    document.getElementById('pauseBtn').style.display = 'none'
    document.getElementById('timelineProgress').style.width = '0%'
    document.getElementById('currentTime').textContent = '0:00'
}

/**
 * Handle player progress updates
 */
function onPlayerProgress(data) {
    document.getElementById('timelineProgress').style.width = `${data.progress * 100}%`
    document.getElementById('currentTime').textContent = MIDIPlayer.formatTime(data.currentTime)
}

/**
 * Handle player ended
 */
function onPlayerEnded() {
    stopMIDI()
    console.log('🎵 Playback ended')
}

/**
 * Handle timeline click (seek)
 */
function onTimelineClick(event) {
    const bar = event.currentTarget
    const rect = bar.getBoundingClientRect()
    const x = event.clientX - rect.left
    const percent = x / rect.width
    const time = percent * midiPlayer.duration

    midiPlayer.seek(time)
}

/**
 * Download MIDI file
 */
function downloadMIDI() {
    if (!state.currentGeneration) return

    const link = document.createElement('a')
    link.href = state.currentGeneration.downloadUrl
    link.download = `selene-${state.currentGeneration.generationId}.mid`
    link.click()

    console.log('💾 Downloading MIDI:', state.currentGeneration.generationId)
}

/**
 * Copy seed to clipboard
 */
function copySeed() {
    if (!state.currentGeneration) return

    const seed = state.currentGeneration.output.metadata.seed
    navigator.clipboard.writeText(seed.toString())

    // Visual feedback
    const btn = document.getElementById('copySeedBtn')
    const originalText = btn.textContent
    btn.textContent = '✅ COPIED!'
    setTimeout(() => btn.textContent = originalText, 2000)

    console.log('📋 Seed copied:', seed)
}

/**
 * View notes (piano roll)
 */
function viewNotes() {
    // Show placeholder modal
    const modal = document.getElementById('pianoRollModal')
    const modalContent = modal.querySelector('.modal-content')
    
    // Update modal content
    modalContent.innerHTML = `
        <span class="modal-close" id="modalClose">&times;</span>
        <h2>🎹 Piano Roll View</h2>
        <div style="text-align: center; padding: 20px;">
            <p>🎵 Piano roll visualization coming soon!</p>
            <p>This feature will show a visual representation of the MIDI notes over time.</p>
            <button onclick="document.getElementById('pianoRollModal').style.display='none'" style="margin-top: 10px;">Close</button>
        </div>
    `
    
    modal.style.display = 'block'
    
    // Close on click outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none'
        }
    })
}

/**
 * Load history item
 */
window.loadHistoryItem = async function(id) {
    console.log('Loading history item:', id)

    // Find the item in history
    const item = state.history.find(h => h.id === id)
    if (!item) {
        showError('History item not found')
        return
    }

    try {
        // Fetch MIDI buffer from API
        const response = await fetch(`/api/music/midi/${item.id}`)
        if (!response.ok) {
            throw new Error(`Failed to load MIDI: ${response.status}`)
        }

        // Get buffer as ArrayBuffer (raw binary MIDI data)
        const buffer = await response.arrayBuffer()

        // DEBUG: Log the raw response to understand the format
        console.log('🔍 [loadHistoryItem] Raw API response:', {
            length: buffer.byteLength,
            firstBytes: Array.from(new Uint8Array(buffer.slice(0, 16))).map(b => b.toString(16).padStart(2, '0')).join(' '),
            isMidiHeader: new Uint8Array(buffer.slice(0, 4))[0] === 0x4D && 
                         new Uint8Array(buffer.slice(0, 4))[1] === 0x54 && 
                         new Uint8Array(buffer.slice(0, 4))[2] === 0x68 && 
                         new Uint8Array(buffer.slice(0, 4))[3] === 0x64
        })

        // Load MIDI into player (pass ArrayBuffer directly)
        await midiPlayer.loadMIDI(buffer)

        // Create a basic result object for displayMIDIOutput
        const mockResult = {
            generationId: item.id,
            output: {
                midi: { buffer: buffer }, // Now ArrayBuffer instead of base64 string
                metadata: {
                    stylePreset: item.style,
                    duration: item.duration,
                    seed: item.seed,
                    timestamp: new Date().toISOString()
                },
                analysis: {}
            }
        }

        // Update current generation and display
        state.currentGeneration = mockResult
        displayMIDIOutput(mockResult)

        // Auto-play
        await midiPlayer.play()

        console.log('✅ Loaded and playing history item:', item.id)
    } catch (error) {
        console.error('❌ Failed to load history item:', error)
        showError(`Failed to load history item: ${error.message}`)
    }
}

/**
 * Download history item
 */
window.downloadHistoryItem = function(id) {
    const link = document.createElement('a')
    link.href = `/api/music/midi/${id}`
    link.download = `selene-${id}.mid`
    link.click()
}

/**
 * Delete history item
 */
window.deleteHistoryItem = function(id) {
    // Remove from state.history array
    state.history = state.history.filter(item => item.id !== id)
    
    // Update localStorage
    saveHistory()
    
    // Re-render history list
    renderHistory()
    
    console.log('🗑️ Deleted history item:', id)
}

/**
 * Delete current output
 */
window.deleteCurrentOutput = function() {
    // Hide the MIDI output panel
    const output = document.getElementById('midiOutput')
    output.style.display = 'none'
    
    // Clear current generation state
    state.currentGeneration = null
    
    // Stop any playing MIDI
    midiPlayer.stopPlayback()
    
    // Reset player UI
    document.getElementById('playBtn').style.display = 'inline-block'
    document.getElementById('pauseBtn').style.display = 'none'
    document.getElementById('timelineProgress').style.width = '0%'
    document.getElementById('currentTime').textContent = '0:00'
    
    console.log('🗑️ Deleted current output')
}

/**
 * Handle generation progress from WebSocket
 */
function onGenerationProgress(data) {
    updateProgress(data.progress)
    document.getElementById('estimatedTime').textContent = `Estimated: ${(data.estimatedTime / 1000).toFixed(1)}s`
}

/**
 * Handle mode change from WebSocket
 */
function onModeChange(data) {
    state.currentMode = data.mode
    updateModeIndicator(data.mode)
    console.log('🎨 Mode changed to:', data.mode)
}

/**
 * Show error message
 */
function showError(message) {
    const errorDisplay = document.getElementById('errorDisplay')
    const errorMessage = document.getElementById('errorMessage')

    errorMessage.textContent = message
    errorDisplay.style.display = 'flex'

    // Auto-hide after 5s
    setTimeout(() => {
        errorDisplay.style.display = 'none'
    }, 5000)
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
