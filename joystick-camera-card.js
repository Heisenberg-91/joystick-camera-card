// =========================================================================
// V1.2.5 - Joystick Carré 1:1 - Plage Symétrique 175° (Centre 87°)
// =========================================================================

import {
    LitElement,
    html,
    css
} from 'https://unpkg.com/lit@2.7.4/index.js?module';

class JoystickCameraCard extends LitElement {
    
    setConfig(config) { 
        this.config = config; 
        this.panEntity = config.pan_entity || 'number.camera_pan_175';
        this.tiltEntity = config.tilt_entity || 'number.camera_tilt_175';
    }

    static get properties() {
        return {
            hass: { type: Object },
            x: { type: Number },
            y: { type: Number }
        };
    }

    constructor() {
        super();
        // Configuration Carrée
        this.size = 180;        // Largeur et Hauteur identiques
        this.handleSize = 70; 
        this.borderWidth = 4; 
        
        // Limite identique pour X et Y (Mouvement 1:1)
        this.limit = (this.size - (this.borderWidth * 2) - this.handleSize) / 2;
        
        this.x = 0;
        this.y = 0;
        this.isDragging = false;
        this.lastSend = 0;
        
        this.centerAngle = 87; // Correspond à l'initial_value de ton YAML
        this.maxRange = 87;    // Débattement de 87 unités de chaque côté
    }

    static get styles() {
        return css`
            ha-card { background: none !important; border: none !important; box-shadow: none !important; display: flex; justify-content: flex-end; align-items: center; }
            .card-content { padding: 10px; }
            .base {
                width: 180px; height: 180px; border-radius: 20px; position: relative;
                background: #000; border: 4px solid #333; box-sizing: border-box;
                background-image: 
                    linear-gradient(rgba(51,51,51,0.5) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(51,51,51,0.5) 1px, transparent 1px);
                background-size: 20px 20px;
                background-position: center;
                touch-action: none; display: flex; justify-content: center; align-items: center;
            }
            .handle {
                width: 70px; height: 70px; border-radius: 15px; position: absolute;
                top: 50%; left: 50%; margin-top: -35px; margin-left: -35px;
                background: radial-gradient(circle at 50% 15%, #03a9f4 0%, #0288d1 60%, #01579b 100%);
                box-shadow: 0 5px 15px rgba(0,0,0,0.8);
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
            this.sendCameraCommands(this.centerAngle, this.centerAngle);
        };

        const move = (e) => {
            if (!this.isDragging) return;
            const rect = this.baseElement.getBoundingClientRect();
            const clientX = (e.touches ? e.touches[0].clientX : e.clientX);
            const clientY = (e.touches ? e.touches[0].clientY : e.clientY);
            
            let dx = clientX - (rect.left + rect.width / 2);
            let dy = clientY - (rect.top + rect.height / 2);
            
            // Contrainte Carrée (Box constraint)
            this.x = Math.max(-this.limit, Math.min(this.limit, dx));
            this.y = Math.max(-this.limit, Math.min(this.limit, dy));

            // Calcul 1:1 propre
            const panAngle = Math.round(this.centerAngle + ((this.x / this.limit) * this.maxRange));
            const tiltAngle = Math.round(this.centerAngle + ((-this.y / this.limit) * this.maxRange));

            const now = Date.now();
            if (now - this.lastSend > 90) { 
                this.sendCameraCommands(panAngle, tiltAngle); 
                this.lastSend = now; 
            }
        };

        h.addEventListener('mousedown', start); h.addEventListener('touchstart', start);
        document.addEventListener('mousemove', move); document.addEventListener('touchmove', move);
        document.addEventListener('mouseup', end); document.addEventListener('touchend', end);
    }

    sendCameraCommands(pan, tilt) {
        if (!this.hass) return;
        this.hass.callService('number', 'set_value', { entity_id: this.panEntity, value: pan });
        this.hass.callService('number', 'set_value', { entity_id: this.tiltEntity, value: tilt });
    }
}
customElements.define('joystick-camera-card', JoystickCameraCard);
