import { substituteParams } from '../../../../../script.js';
import { delay, uuidv4 } from '../../../../utils.js';
import { Wizard } from './Wizard.js';

export class WizardContent {
    /**@type {object} */ dom;
    /**@type {string} */ uuid;




    constructor() {
        this.uuid = uuidv4();
    }




    /**
     *
     * @param {string} text
     * @param {Wizard} wizard
     * @returns
     */
    substituteParams(text, wizard) {
        return substituteParams(text)
            .replace(/{{wizpipe}}/g, wizard.pipe?.toString() ?? '')
            .replace(/{{wizvar::((?:(?!::|}}).)+)(?:::((?:(?!::|}}).)+))?}}/g, (_, key, index)=>{
                return wizard.variables[key]?.toString() ?? '';
            })
        ;
    }


    /**
     * @param {Wizard} wizard
     * @returns {Promise<HTMLElement>}
     */
    async render(wizard) {
        throw new Error('WizardContent.render() is not implemented');
    }

    unrender() {
        Object.keys(this.dom).forEach(it=>{
            this.dom[it]?.remove();
            this.dom[it] = null;
        });
    }

    async remove() {
        if (this.dom.root) {
            this.dom.root.classList.add('stwiz--fadeOut');
            await delay(1010);
            this.unrender();
        }
    }
}
