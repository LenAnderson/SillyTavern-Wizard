// @ts-nocheck
import { SlashCommandClosure } from '../../../../slash-commands/SlashCommandClosure.js';
import { delay } from '../../../../utils.js';
import { Wizard } from './Wizard.js';
import { WizardContent } from './WizardContent.js';
import { WizardHero } from './WizardHero.js';
import { WizardNav } from './WizardNav.js';
import { WizardCrumbs } from './WizCrumbs.js';

export class WizardPage {
    /**@type {string} */ id;
    /**@type {string} */ icon;

    /**@type {WizardHero} */ hero;
    /**@type {WizardNav} */ nav;
    /**@type {WizardTransition} */ transition;
    /**@type {WizardCrumbs} */ crumbs;
    /**@type {string[]} */ classList = [];

    /**@type {WizardContent[]} */ contentList = [];

    /**@type {SlashCommandClosure} */ before;
    /**@type {SlashCommandClosure} */ after;


    // DOM
    dom = {
        /**@type {HTMLElement} */
        root: undefined,
        /**@type {HTMLElement} */
        page: undefined,
    };




    /**
     *
     * @param {Wizard} wizard
     * @returns
     */
    async render(wizard) {
        if (!this.dom.root) {
            const root = document.createElement('div'); {
                this.dom.root = root;
                root.classList.add('stwiz--pageContainer');
                for (const c of this.classList) root.classList.add(c);
                root.dataset.stwizId = this.id;
                if (this.hero) {
                    root.dataset.stwizLayout = this.hero.layout;
                    root.dataset.stwizPosition = this.hero.position;
                    root.append(await this.hero.render());
                }
                const main = document.createElement('div'); {
                    main.classList.add('stwiz--pageMainContainer');
                    if (this.crumbs) {
                        main.append(await this.crumbs.render(wizard, this));
                    }
                    if (this.nav) {
                        main.append(await this.nav.render(wizard, this));
                    }
                    const page = document.createElement('div'); {
                        this.dom.page = page;
                        page.classList.add('stwiz--page');
                        const contentDom = await Promise.all(this.contentList.map(content=>content.render(wizard)));
                        for (const content of contentDom) {
                            page.append(content);
                        }
                        main.append(page);
                    }
                    root.append(main);
                }
            }
        }
        return this.dom.root;
    }

    unrender() {
        Object.keys(this.dom).forEach(it=>this.dom[it] = null);
        this.hero?.unrender();
        this.nav?.unrender();
        this.contentList.forEach(it=>it.unrender());
    }


    /**
     *
     * @param {Wizard} wizard
     * @param {WizardContent} content
     * @param {string} adjacent
     * @param {'after'|'before'} where
     */
    async addContent(wizard, content, adjacent = null, where = null) {
        where ??= 'after';
        let anchor;
        if (adjacent) {
            anchor = this.contentList.find(it=>it.uuid == adjacent);
            this.contentList.splice(this.contentList.indexOf(anchor) + (where == 'after' ? 1 : 0), 0, content);
        } else {
            this.contentList.push(content);
        }
        if (this.dom.page) {
            const dom = await content.render(wizard);
            dom.classList.add('stwiz--fadeIn');
            if (adjacent) {
                anchor.dom.root.insertAdjacentElement(`${where == 'after' ? 'afterend' : 'beforebegin'}`, dom);
            } else {
                this.dom.page.append(dom);
            }
            await delay(510);
            dom.classList.remove('stwiz--fadeIn');
        }
    }

    async removeContent(id) {
        const content = this.contentList.find(it=>it.uuid == id);
        if (content) {
            this.contentList.splice(this.contentList.indexOf(content), 1);
            if (this.dom.page) {
                await content.remove();
            }
        }
    }
}
