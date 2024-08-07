import { WizardHeroText } from './WizardHeroText.js';

/** @enum {string?} */
export const HERO_LAYOUT = {
    HORIZONTAL: 'horizontal',
    VERTICAL: 'vertical',
};

/** @enum {string?} */
export const HERO_POSITION = {
    START: 'start',
    END: 'end',
};


export class WizardHero {
    static from(props) {
        if (!props) return null;
        if (props.text) props.text = WizardHeroText.from(props.text);
        return Object.assign(new this(), props);
    }




    /**@type {HERO_LAYOUT} */ layout = HERO_LAYOUT.VERTICAL;
    /**@type {HERO_POSITION} */ position = HERO_POSITION.START;
    /**@type {number} */ size = 40;
    /**@type {string} */ image;
    /**@type {string} */ color;
    /**@type {WizardHeroText} */ text;


    // DOM
    dom = {
        /**@type {HTMLElement} */
        root: undefined,
    };


    toJSON() {
        return {
            layout: this.layout,
            position: this.position,
            size: this.size,
            image: this.image,
            color: this.color,
            text: this.text?.toJSON(),
        };
    }




    async render() {
        if (!this.dom.root) {
            const root = document.createElement('div'); {
                this.dom.root = root;
                root.classList.add('stwiz--hero');
                root.dataset.stwizLayout = this.layout;
                root.dataset.stwizPosition = this.position;
                root.style.setProperty('--size', this.size.toString());
                if (this.image) {
                    const img = new Image();
                    const prom = new Promise(resolve=>{
                        if (img.complete) return resolve();
                        img.addEventListener('load', resolve);
                        img.addEventListener('error', resolve);
                    });
                    img.src = this.image;
                    await prom;
                    root.style.setProperty('--image', `url("${this.image}")`);
                }
                if (this.color) root.style.setProperty('--color', this.color);
                if (this.text) {
                    root.append(await this.text.render());
                }
            }
        }
        return this.dom.root;
    }

    unrender() {
        Object.keys(this.dom).forEach(it=>this.dom[it] = null);
        this.text?.unrender();
    }
}
