// Portal JavaScript - Navigation and Basic Functionality
class Portal {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateStatus();
        setInterval(() => this.updateStatus(), 30000); // Update status every 30 seconds
    }

    setupEventListeners() {
        // Add click tracking for analytics
        document.querySelectorAll('.engine-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const engineName = card.querySelector('.engine-name').textContent;
                console.log(`Navigating to ${engineName}`);
                // Could add analytics tracking here
            });
        });
    }

    updateStatus() {
        const statusIndicator = document.getElementById('status-indicator');
        if (statusIndicator) {
            // Simple status check - could be enhanced with actual connectivity checks
            statusIndicator.textContent = '🟢 Portal Active';
            statusIndicator.className = 'status-indicator connected';
        }
    }

    // Utility method for future enhancements
    navigateToEngine(enginePath) {
        window.location.href = enginePath;
    }
}

// Initialize portal when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.portal = new Portal();
});