import { substituteParams } from '../../../../../script.js';
import { Wizard } from './Wizard.js';

export class WizardContent {
    /**@type {object} */ dom;




    /**
     *
     * @param {string} text
     * @param {Wizard} wizard
     * @returns
     */
    substituteParams(text, wizard) {
        return text //substituteParams(text)
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
        Object.keys(this.dom).forEach(it=>this.dom[it] = null);
    }
}
