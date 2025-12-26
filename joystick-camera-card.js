// =========================================================================
// V1.2.1 - Joystick Pan & Tilt calibré pour 175° (Centre à 87°)
// =========================================================================

import {
    LitElement,
    html,
    css
} from 'https://unpkg.com/lit@2.7.4/index.js?module';

class JoystickCameraCard extends LitElement {
    
    setConfig(config) { 
        this.config = config; 
        // Correspondance avec tes entités ESPHome
        this.panEntity = config.pan_entity || 'number.camera_pan_175';
        this.tiltEntity = config.tilt_entity || 'number.camera_tilt_175';
    }

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
        this.baseWidth = 206; 
        this.baseHeight = 165;
        this.handleSize = 72; 
        this.borderWidth = 4; 
        this.limitX = (this.baseWidth - (this.borderWidth * 2) - this.handleSize) / 2;
        this.limitY = (this.baseHeight - (this.borderWidth * 2) - this.handleSize) / 2;
        this.x = 0;
        this.y = 0;
        this.isDragging = false;
        this.lastSend = 0;
        
        // --- Paramètres de calibration ---
        this.centerAngle = 87; // Le point central défini dans ton YAML
        this.maxRange = 87;    // Débattement max de chaque côté (87 + 87 = 174°)
    }

    static get styles() {
        return css`
            ha-card { background: none !important; border: none !important; box-shadow: none !important; display: flex; justify-content: flex-end; align-items: center; }
            .card-content { padding: 10px; display: flex; justify-content: flex-end; background: none; }
            .base {
                width: 206px; height: 165px; border-radius: 40px; position: relative;
                background: #000; border: 4px solid #333; box-sizing: border-box;
                background-image: radial-gradient(circle, transparent 30%, rgba(0,0,0,0.8) 100%), repeating-radial-gradient(circle at center, #222 0px, #222 10px, #0a0a0a 12px, #000 15px);
                touch-action: none; display: flex; justify-content: center; align-items: center;
            }
            .handle {
                width: 72px; height: 72px; border-radius: 50%; position: absolute;
                top: 50%; left: 50%; margin-top: -36px; margin-left: -36px;
                background: radial-gradient(circle at 50% 15%, #03a9f4 0%, #0288d1 60%, #01579b 100%);
                box-shadow: 0 10px 20px rgba(0,0,0,0.8), inset 0 5px 10px rgba(0,0,0,0.5);
                cursor: grab; transition: transform 0.1s ease-out;
            }
        `;
    }

    render() {
        return html`
            <ha-card>
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
            this.sendCameraCommands(this.centerAngle, this.centerAngle); // Retour au centre 87°
        };

        const move = (e) => {
            if (!this.isDragging) return;
            const rect = this.baseElement.getBoundingClientRect();
            const clientX = (e.touches ? e.touches[0].clientX : e.clientX);
            const clientY = (e.touches ? e.touches[0].clientY : e.clientY);
            
            let dx = clientX - (rect.left + rect.width / 2);
            let dy = clientY - (rect.top + rect.height / 2);
            
            this.x = Math.max(-this.limitX, Math.min(this.limitX, dx));
            this.y = Math.max(-this.limitY, Math.min(this.limitY, dy));

            // Calcul de l'angle (Mapping joystick -100/100 vers 0-175)
            // L'angle = centre (87) + (pourcentage joystick * débattement max)
            const panAngle = Math.round(this.centerAngle + ((this.x / this.limitX) * this.maxRange));
            const tiltAngle = Math.round(this.centerAngle + ((-this.y / this.limitY) * this.maxRange));

            const now = Date.now();
            if (now - this.lastSend > 100) { // On passe à 100ms pour être synchro avec le delay du servo
                this.sendCameraCommands(panAngle, tiltAngle); 
                this.lastSend = now; 
            }
        };

        h.addEventListener('mousedown', start); h.addEventListener('touchstart', start);
        document.addEventListener('mousemove', move); document.addEventListener('touchmove', move);
        document.addEventListener('mouseup', end); document.addEventListener('touchend', end);
    }

    sendCameraCommands(panValue, tiltValue) {
        if (!this.hass) return;
    
        // Envoi des valeurs absolues (0-175)
        this.hass.callService('number', 'set_value', {
            entity_id: this.panEntity,
            value: panValue
        });

        this.hass.callService('number', 'set_value', {
            entity_id: this.tiltEntity,
            value: tiltValue
        });
    }
}
customElements.define('joystick-camera-card', JoystickCameraCard);
