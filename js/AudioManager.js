// Audio effects and sound management for the Snake game
class AudioManager {
    constructor() {
        this.audioContext = null;
        this.enabled = true;
        this.volume = 0.1; // Default volume (10%)
        
        // Initialize audio context on first user interaction
        this.initializeAudio();
    }
    
    initializeAudio() {
        // Audio context needs to be created after user interaction
        document.addEventListener('click', () => {
            if (!this.audioContext) {
                try {
                    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    console.log('Audio system initialized');
                } catch (e) {
                    console.warn('Audio not supported in this browser');
                    this.enabled = false;
                }
            }
        }, { once: true });
    }
    
    // Core sound generation
    playSound(frequency, duration, waveType = 'square') {
        if (!this.enabled || !this.audioContext) {
            return;
        }
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = waveType;
            
            // Set volume with fade out
            gainNode.gain.setValueAtTime(this.volume, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration / 1000);
        } catch (e) {
            console.warn('Failed to play sound:', e);
        }
    }
    
    // Game-specific sound effects
    playEatSound() {
        // Short, high-pitched beep for eating food
        this.playSound(800, 100, 'square');
    }
    
    playGameOverSound() {
        // Descending sequence for game over
        this.playSound(400, 200, 'square');
        setTimeout(() => this.playSound(300, 200, 'square'), 150);
        setTimeout(() => this.playSound(200, 300, 'square'), 300);
    }
    
    playStartSound() {
        // Ascending beeps for game start
        this.playSound(200, 100, 'square');
        setTimeout(() => this.playSound(300, 100, 'square'), 100);
        setTimeout(() => this.playSound(400, 150, 'square'), 200);
    }
    
    playButtonSound() {
        // Short click sound for UI interactions
        this.playSound(600, 50, 'square');
    }
    
    playScoreSound() {
        // Special sound for high scores
        this.playSound(600, 100, 'square');
        setTimeout(() => this.playSound(800, 100, 'square'), 100);
        setTimeout(() => this.playSound(1000, 150, 'square'), 200);
    }
    
    playErrorSound() {
        // Low buzz for errors
        this.playSound(150, 300, 'sawtooth');
    }
    
    // Volume and settings
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }
    
    toggleSound() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
    
    isSoundEnabled() {
        return this.enabled;
    }
    
    // Advanced effects
    playSequence(notes, tempo = 100) {
        // Play a sequence of notes
        // notes: array of {frequency, duration} objects
        let delay = 0;
        
        notes.forEach(note => {
            setTimeout(() => {
                this.playSound(note.frequency, note.duration, note.waveType || 'square');
            }, delay);
            delay += tempo;
        });
    }
    
    playSuccessChime() {
        // Pleasant success sound
        const notes = [
            { frequency: 523, duration: 150 }, // C5
            { frequency: 659, duration: 150 }, // E5
            { frequency: 784, duration: 300 }  // G5
        ];
        this.playSequence(notes, 150);
    }
    
    playWarningBeep() {
        // Urgent warning sound
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.playSound(880, 100, 'square');
            }, i * 150);
        }
    }
}