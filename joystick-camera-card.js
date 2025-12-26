// =========================================================================
// V1.2.6 - Joystick Carré 1:1 - Aspect Soufflet & Stick Concave
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
        this.size = 200; 
        this.handleSize = 75; 
        this.borderWidth = 4; 
        this.limit = (this.size - (this.borderWidth * 2) - this.handleSize) / 2;
        this.x = 0;
        this.y = 0;
        this.isDragging = false;
        this.lastSend = 0;
        this.centerAngle = 87;
        this.maxRange = 87;
    }

    static get styles() {
        return css`
            ha-card { background: none !important; border: none !important; box-shadow: none !important; display: flex; justify-content: center; align-items: center; padding: 20px; }
            
            /* Le fond avec l'effet soufflet (carrés concentriques) */
            .base {
                width: 200px; height: 200px; border-radius: 15px; position: relative;
                background: #111; border: 4px solid #333; box-sizing: border-box;
                background-image: 
                    repeating-linear-gradient(0deg, transparent, transparent 19px, rgba(255,255,255,0.05) 20px),
                    repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(255,255,255,0.05) 20px),
                    radial-gradient(circle, transparent 20%, rgba(0,0,0,0.8) 100%);
                box-shadow: inset 0 0 50px rgba(0,0,0,0.9);
                touch-action: none; display: flex; justify-content: center; align-items: center;
                overflow: hidden;
            }

            /* Simulation des parois du soufflet */
            .base::before {
                content: ""; position: absolute; top: 0; left: 0; right: 0; bottom: 0;
                background: repeating-radial-gradient(rect, transparent, #000 10%, transparent 20%);
                background-image: 
                    linear-gradient(45deg, #222 25%, transparent 25%), 
                    linear-gradient(-45deg, #222 25%, transparent 25%), 
                    linear-gradient(45deg, transparent 75%, #222 75%), 
                    linear-gradient(-45deg, transparent 75%, #222 75%);
                background-size: 40px 40px; opacity: 0.1;
            }

            /* Le stick bleu avec aspect concave */
            .handle {
                width: 75px; height: 75px; border-radius: 12px; position: absolute;
                top: 50%; left: 50%; margin-top: -37.5px; margin-left: -37.5px;
                /* Gradient inversé pour l'effet concave */
                background: radial-gradient(circle at center, #01579b 0%, #0288d1 70%, #03a9f4 100%);
                /* Ombre interne pour creuser l'aspect */
                box-shadow: 
                    0 10px 20px rgba(0,0,0,0.5),
                    inset 0 4px 10px rgba(0,0,0,0.6),
                    inset 0 -2px 5px rgba(255,255,255,0.2);
                border: 2px solid #014172;
                cursor: grab; transition: transform 0.1s ease-out;
                z-index: 10;
            }

            .handle:active { cursor: grabbing; }
        `;
    }

    render() {
        return html`
            <ha-card>
                <div id="camera-base" class="base">
                    <div id="camera-handle" class
