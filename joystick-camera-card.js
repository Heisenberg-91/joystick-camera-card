// =========================================================================
// V1.1.5 - Joystick Pan & Tilt pour caméra (Service ESPHome intégré)
// =========================================================================

import {
    LitElement,
    html,
    css
} from 'https://unpkg.com/lit@2.7.4/index.js?module';

class JoystickCameraCard extends LitElement {
    
    setConfig(config) { 
        this.config = config; 
        // Nom du noeud ESPHome dans Home Assistant (par défaut 'rover_heisenberg')
        this.deviceName = config.device_name || 'rover_heisenberg';
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
        // Dimensions : Largeur réduite à 206px (-15%), Hauteur maintenue à 165px
        this.baseWidth = 206; 
        this.baseHeight = 165;
        this.handleSize = 72; 
        this.borderWidth = 4; 
        
        // Calcul des limites de mouvement (Contact Parfait)
        this.limitX = (this.baseWidth - (this.borderWidth * 2) - this.handleSize) / 2;
        this.limitY = (this.baseHeight - (this.borderWidth * 2) - this.handleSize) / 2;
        
        this.x = 0;
        this.y = 0;
        this.isDragging = false;
        this.lastSend = 0;
    }

    static get styles() {
        return css`
            :host { 
                display: block; 
                background: none !important;
            }
            ha-card {
                background: none !important;
                border: none !important;
                box-shadow: none !important;
                display: flex;
                justify-content: flex-end;
                align-items: center;
            }
            .card-content { 
                padding: 10px; 
                display: flex; 
                justify-content: flex-end; 
                background: none;
            }
            .base {
                width: 206px; 
                height: 165px; 
                border-radius: 40px; 
                position: relative;
                background: #000; 
                border: 4px solid #333;
                box-sizing: border-box;
                /* Aspect Soufflet Pur */
                background-image: 
                    radial-gradient(circle, transparent 30%, rgba(0,0,0,0.8) 100%),
                    repeating-radial-gradient(circle at center, #222 0px, #222 10px, #0a0a0a 12px, #000 15px);
                box-shadow: inset 0 0 30px rgba(0,0,0,1), inset 0 0 10px rgba(0,0,0,0.8);
                touch-action: none;
                display: flex; 
                justify-content: center; 
                align-items: center;
                z-index: 1;
                overflow: hidden;
            }
            .handle {
                width: 72px; 
                height: 72px; 
                border-radius: 50%; 
                position: absolute;
                top: 50%;
                left: 50%;
                margin-top: -36px;
                margin-left: -36px;
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
