

/** @enum {string?} */
export const HERO_TEXT_POSITION = {
    START: 'start',
    CENTER: 'center',
    END: 'end',
    FULL: 'full',
};


export class WizardHeroText {
    static from(props) {
        if (!props) return null;
        return Object.assign(new this(), props);
    }




    /**@type {HERO_TEXT_POSITION} */ position = HERO_TEXT_POSITION.START;
    /**@type {number} */ blur = 6;
    /**@type {string} */ backgroundColor;
    /**@type {string} */ foregroundColor;
    /**@type {number} */ size;
    /**@type {string} */ text;


    // DOM
    dom = {
        /**@type {HTMLElement} */
        root: undefined,
    };

    toJSON() {
        return {
            position: this.position,
            blur: this.blur,
            backgroundColor: this.backgroundColor,
            foregroundColor: this.foregroundColor,
            size: this.size,
            text: this.text,
        };
    }




    async render() {
        if (!this.dom.root) {
            const root = document.createElement('div'); {
                this.dom.root = root;
                root.classList.add('stwiz--heroText');
                root.dataset.stwizPosition = this.position;
                root.style.setProperty('--blur', this.blur.toString());
                if (this.backgroundColor) root.style.setProperty('--background', this.backgroundColor);
                if (this.foregroundColor) root.style.setProperty('--foreground', this.foregroundColor);
                if (this.size) root.style.setProperty('--size', this.size.toString());
                root.textContent = this.text;
            }
        }
        return this.dom.root;
    }

    unrender() {
        Object.keys(this.dom).forEach(it=>this.dom[it] = null);
    }
}
