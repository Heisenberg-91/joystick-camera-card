// =========================================================================
// V1.0.3 - JOYSTICK D'OBSERVATION (RECTANGLE PAYSAGE 270°/180°)
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
        // Dimensions du rectangle (Ratio Largeur 270 / Hauteur 180 = 1.5)
        this.baseWidth = 220; 
        this.baseHeight = 150;
        this.handleSize = 65; 
        
        // CALCUL DES LIMITES (Calculé du centre vers les bords moins la demi-bille et la bordure)
        this.limitX = (this.baseWidth / 2) - (this.handleSize / 2) - 4;
        this.limitY = (this.baseHeight / 2) - (this.handleSize / 2) - 4;
        
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
                border-radius: 25px; 
                position: relative;
                background: #000; 
                border: 4px solid #333;
                background-image: repeating-linear-gradient(45deg, #111 0px, #111 2px, #000 2px, #000 10px);
                box-shadow: inset 0 0 25px rgba(0,0,0,1); 
                touch-action: none;
                display: flex; 
                justify-content: center; 
                align-items: center;
                z-index: 1;
                overflow: hidden;
            }
            .handle {
                width: 65px; 
                height: 65px; 
                border-radius: 50%; 
                position: absolute;
                background: radial-gradient(circle at 50% 15%, #03a9f4 0%, #0288d1 60%, #01579b 100%);
                box-shadow: 0 10px 20px rgba(0,0,0,0.8), inset 0 5px 10px rgba(0,0,0,0.5);
                z-index: 999; /* Toujours au premier plan */
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
        
        const start = (e) => { 
            e.preventDefault(); 
            this.isDragging = true; 
            h.style.transition = 'none';
        };

        const end = () => { 
            if (!this.isDragging) return; 
            this.isDragging = false;
            // Retour au centre automatique (pour conduire le Rover)
            h.style.transition = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            this.x = 0; 
            this.y = 0; 
            this.sendCameraCommands(0, 0);
        };

        const move = (e) => {
            if (!this.isDragging) return;
            const rect = this.baseElement.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            
            let dx = clientX - (rect.left + rect.width / 2);
            let dy = clientY - (rect.top + rect.height / 2);

            // GESTION DE LA LIBERTÉ DANS LE RECTANGLE (Indépendante sur X et Y)
            this.x = Math.max(-this.limitX, Math.min(this.limitX, dx));
            this.y = Math.max(-this.limitY, Math.min(this.limitY, dy));

            // Conversion en pourcentage (-100 à 100) pour les servos
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

        // Pour le moment on log les valeurs, prêt à être relié aux entités "number" de ton ESP32
        console.log("Pan:", pan, "% | Tilt:", tilt, "%");
        
        /* Exemple futur pour tes servos :
        this.hass.callService('number', 'set_value', {
            entity_id: 'number.camera_pan_position',
            value: pan
        });
        */
    }
}
customElements.define('joystick-camera-card', JoystickCameraCard);
