// =========================================================================
// V1.0.8 - CONTACT PARFAIT (Zéro Gap)
// =========================================================================

import {
    LitElement,
    html,
    css
} from 'https://unpkg.com/lit@2.7.4/index.js?module';

class JoystickCameraCard extends LitElement {
    
    setConfig(config) { this.config = config; }

    static get properties() {
        return {
            hass: { type: Object },
            config: { type: Object },
            x: { type: Number },
            y: { type: Number }
        };
    }

    constructor() {
        super();
        this.baseWidth = 220; 
        this.baseHeight = 150;
        this.handleSize = 65; 
        this.borderWidth = 4; 
        
        // Rayon extérieur pour l'arrondi (R bille + épaisseur bordure)
        this.externalRadius = (this.handleSize / 2) + this.borderWidth; 
        
        // --- CORRECTION DU CONTACT ---
        // On ne retire plus de pixel de sécurité. 
        // La limite est strictement la moitié de la zone interne disponible.
        const innerWidth = this.baseWidth - (this.borderWidth * 2);
        const innerHeight = this.baseHeight - (this.borderWidth * 2);
        
        this.limitX = (innerWidth - this.handleSize) / 2;
        this.limitY = (innerHeight - this.handleSize) / 2;
        
        this.x = 0;
        this.y = 0;
        this.isDragging = false;
        this.lastSend = 0;
    }

    static get styles() {
        return css`
            :host { display: block; }
            .card-content { 
                padding: 10px; 
                display: flex; 
                justify-content: center; 
                background: none; 
            }
            .base {
                width: 220px; 
                height: 150px; 
                border-radius: 36.5px; 
                position: relative;
                background: #000; 
                border: 4px solid #333; /* Notre ligne grise */
                background-image: repeating-linear-gradient(45deg, #111 0px, #111 2px, #000 2px, #000 10px);
                box-shadow: inset 0 0 25px rgba(0,0,0,1); 
                touch-action: none;
                display: flex; 
                justify-content: center; 
                align-items: center;
                z-index: 1;
                overflow: hidden; /* Important pour que la bille semble s'enfoncer dans le bord */
            }
            .handle {
                width: 65px; 
                height: 65px; 
                border-radius: 50%; 
                position: absolute;
                background: radial-gradient(circle at 50% 15%, #03a9f4 0%, #0288d1 60%, #01579b 100%);
                box-shadow: 0 10px 20px rgba(0,0,0,0.8), inset 0 5px 10px rgba(0,0,0,0.5);
                z-index: 999;
                cursor: grab;
                transition: transform 0.1s ease-out;
            }
        `;
    }

    render() {
        return html`
            <ha-card style="background: none; border: none; box-shadow: none;">
                <div class="card-content">
                    <div id="camera-base" class="base">
                        <div id="camera-handle" class="handle" 
                             style="transform: translate(${this.x}px, ${this.y}px);">
                        </div>
                    </div>
                </div>
            </ha-card>
        `;
    }

    firstUpdated() {
        this.baseElement = this.shadowRoot.querySelector('#camera-base');
        this.handleElement = this.shadowRoot.querySelector('#camera-handle');
        this._addListeners();
    }

    _addListeners() {
        const h = this.handleElement;
        const start = (e) => { e.preventDefault(); this.isDragging = true; h.style.transition = 'none'; };
        const end = () => { 
            if (!this.isDragging) return; 
            this.isDragging = false;
            h.style.transition = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            this.x = 0; this.y = 0; 
            this.sendCameraCommands(0, 0);
        };

        const move = (e) => {
            if (!this.isDragging) return;
            const rect = this.baseElement.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            
            let dx = clientX - (rect.left + rect.width / 2);
            let dy = clientY - (rect.top + rect.height / 2);

            this.x = Math.max(-this.limitX, Math.min(this.limitX, dx));
            this.y = Math.max(-this.limitY, Math.min(this.limitY, dy));

            const panPerc = Math.round((this.x / this.limitX) * 100);
            const tiltPerc = Math.round((-this.y / this.limitY) * 100);

            const now = Date.now();
            if (now - this.lastSend > 60) {
                this.sendCameraCommands(panPerc, tiltPerc); 
                this.lastSend = now; 
            }
        };

        h.addEventListener('mousedown', start); h.addEventListener('touchstart', start);
        document.addEventListener('mousemove', move); document.addEventListener('touchmove', move);
        document.addEventListener('mouseup', end); document.addEventListener('touchend', end);
    }

    sendCameraCommands(pan, tilt) {
        if (!this.hass) return;
        console.log("Pan:", pan, "% | Tilt:", tilt, "%");
    }
}
customElements.define('joystick-camera-card', JoystickCameraCard);
