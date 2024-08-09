import { SlashCommand } from '../../../slash-commands/SlashCommand.js';
import { SlashCommandClosure } from '../../../slash-commands/SlashCommandClosure.js';
import { SlashCommandParser } from '../../../slash-commands/SlashCommandParser.js';
import { ARGUMENT_TYPE, SlashCommandArgument, SlashCommandNamedArgument } from '../../../slash-commands/SlashCommandArgument.js';

import { log } from './src/lib/log.js';
import { Wizard, WIZARD_SIZE } from './src/Wizard.js';
import { WizardPage } from './src/WizardPage.js';
import { HERO_LAYOUT, HERO_POSITION, WizardHero } from './src/WizardHero.js';
import { WizardTitle } from './src/content/WizardTitle.js';
import { WizardText } from './src/content/WizardText.js';
import { WizardTextArea } from './src/content/WizardTextArea.js';
import { WizardTextBox } from './src/content/WizardTextBox.js';
import { HERO_TEXT_POSITION, WizardHeroText } from './src/WizardHeroText.js';
import { isFalseBoolean, isTrueBoolean } from '../../../utils.js';
import { WizardButton } from './src/content/WizardButton.js';
import { WizardCheckbox } from './src/content/WizardCheckbox.js';
import { NAV_POSITION, WizardNav } from './src/WizardNav.js';
import { CRUMBS__POSITION, WizardCrumbs } from './src/WizCrumbs.js';
import { TRANSITION_TYPE, WizardTransition } from './src/WizardTransition.js';

// wizard UI
//x handle Escape closing modal
//TODO /wiz-crumbs
//TODO /wizard linear=true (go through pages one-by-one, no /goto, no /stop -> allows full crumbs and "step 2 of 5" display)
//TODO a way to validate in /wiz-after (and abort | return | message when invalid)

SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'wizard',
    /**
     * @param {import('../../../slash-commands/SlashCommand.js').NamedArguments & {
     *  size:string,
     *  title:string,
     *  blur:string,
     *  background:string,
     *  first:string,
     *  class:string,
     *  linear:string,
     * }} args
     * @param {SlashCommandClosure} contentClosure
     */
    callback: async(args, contentClosure)=>{
        if (!contentClosure) throw new Error('/wizard requires the unnamed argument to be set');
        const wiz = new Wizard();

        wiz.size = Object.values(WIZARD_SIZE).find(it=>it == args.size) ?? wiz.size;
        wiz.title = args.title;
        wiz.blur = Number(args.blur ?? wiz.blur);
        wiz.backgroundImage = args.background;
        wiz.firstPage = args.first;
        let classList = args.class;
        try { classList = JSON.parse(args.class ?? '[]'); } catch { /* not JSON */ }
        wiz.classList = Array.isArray(classList) ? classList : [classList];
        wiz.isLinear = isTrueBoolean(args.linear);

        args._scope.variables['_STWIZ_'] = wiz;
        await contentClosure.execute();
        log('Wizard:', wiz);

        if (wiz.pageList.length == 0) throw new Error('/wizard requires at least one /wiz-page');

        const result = await wiz.start();
        if (result) {
            if (typeof result == 'string') return result;
            return JSON.stringify(result);
        }

        return '';
    },
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({ name: 'size',
            description: 'wizard size',
            enumList: Object.values(WIZARD_SIZE),
            defaultValue: 'inset',
        }),
        SlashCommandNamedArgument.fromProps({ name: 'title',
            description: 'title to show across all pages',
        }),
        SlashCommandNamedArgument.fromProps({ name: 'blur',
            description: 'blur strength for background behind the wizard',
            typeList: ARGUMENT_TYPE.NUMBER,
            defaultValue: '6',
        }),
        SlashCommandNamedArgument.fromProps({ name: 'background',
            description: 'URL pointing to a background image to put behind the wizard',
        }),
        SlashCommandNamedArgument.fromProps({ name: 'first',
            description: 'ID of the page to show first instead of the first page in order',
        }),
        SlashCommandNamedArgument.fromProps({ name: 'class',
            description: 'a single class or list of classes to add to the Wizard element, for targeting with custom CSS',
            typeList: [ARGUMENT_TYPE.LIST, ARGUMENT_TYPE.STRING],
        }),
    ],
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({ description: '/wiz-... commands that define the Wizard\'s contents',
            typeList: ARGUMENT_TYPE.CLOSURE,
            isRequired: true,
        }),
    ],
    returns: 'piped value from /wiz-after or piped value from the last Wizard page',
    helpString: `
        <div>Shows a Wizard to guide the user step-by-step through a list of pages.</div>
        <div>Use <code>/wiz-...</code> commands to define the contents.</div>
    `,
}));

SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'wiz-before',
    aliases: ['wiz-page-before'],
    /**
     * @param {import('../../../slash-commands/SlashCommand.js').NamedArguments & {
     * }} args
     * @param {SlashCommandClosure} closure
     */
    callback: async(args, closure)=>{
        const wiz = /**@type {Wizard}*/(args._scope.existsVariable('_STWIZ_') && args._scope.getVariable('_STWIZ_'));
        const page = /**@type {WizardPage}*/(args._scope.existsVariable('_STWIZ_PAGE_') && args._scope.getVariable('_STWIZ_PAGE_'));
        if (!page && !wiz) throw new Error('Cannot call "/wiz-before" outside of "/wiz-page" or "/wizard"');

        (page ?? wiz).before = closure;

        return '';
    },
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({ description: 'closure to execute before the Wizard or page is loaded',
            typeList: ARGUMENT_TYPE.CLOSURE,
            isRequired: true,
        }),
    ],
    helpString: `
        <div>Set a closure that will be executed before the Wizard or page is loaded.</div>
        <div>Use <code>/wiz-cmd-...</code> commands for Wizard-specific actions.</div>
    `,
}));
SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'wiz-after',
    aliases: ['wiz-page-after'],
    /**
     * @param {import('../../../slash-commands/SlashCommand.js').NamedArguments & {
     * }} args
     * @param {SlashCommandClosure} closure
     */
    callback: async(args, closure)=>{
        const wiz = /**@type {Wizard}*/(args._scope.existsVariable('_STWIZ_') && args._scope.getVariable('_STWIZ_'));
        const page = /**@type {WizardPage}*/(args._scope.existsVariable('_STWIZ_PAGE_') && args._scope.getVariable('_STWIZ_PAGE_'));
        if (!page && !wiz) throw new Error('Cannot call "/wiz-after" outside of "/wiz-page" or "/wizard"');

        (page ?? wiz).after = closure;

        return '';
    },
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({ description: 'closure to execute after the Wizard or page is unloaded',
            typeList: ARGUMENT_TYPE.CLOSURE,
            isRequired: true,
        }),
    ],
    helpString: `
        <div>Set a closure that will be executed after the Wizard or page is unloaded.</div>
        <div>Use <code>/wiz-cmd-...</code> commands for Wizard-specific actions.</div>
    `,
}));

SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'wiz-page',
    /**
     * @param {import('../../../slash-commands/SlashCommand.js').NamedArguments & {
     *  id:string,
     *  title:string,
     *  icon:string,
     *  class:string,
     * }} args
     * @param {SlashCommandClosure} contentClosure
     */
    callback: async(args, contentClosure)=>{
        const wiz = /**@type {Wizard}*/(args._scope.existsVariable('_STWIZ_') && args._scope.getVariable('_STWIZ_'));
        if (!wiz) throw new Error('Cannot call "/wiz-page" outside of "/wizard"');

        const page = new WizardPage();
        page.id = args.id;
        if (wiz.title !== undefined) {
            const title = new WizardTitle();
            title.text = wiz.title;
            title.level = 0;
            page.contentList.push(title);
        }
        if (args.title !== undefined) {
            const title = new WizardTitle();
            title.text = args.title;
            page.contentList.push(title);
        }
        page.hero = WizardHero.from(wiz.hero?.toJSON());
        page.nav = WizardNav.from(wiz.nav?.toJSON());
        page.transition = WizardTransition.from(wiz.transition?.toJSON());
        page.crumbs = WizardCrumbs.from(wiz.crumbs?.toJSON());

        args._scope.variables['_STWIZ_PAGE_'] = page;
        if (contentClosure) await contentClosure.execute();

        wiz.pageList.push(page);

        return '';
    },
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({ name: 'id',
            description: 'page ID to refernce in /wiz-cmd-goto',
        }),
        SlashCommandNamedArgument.fromProps({ name: 'title',
            description: 'title to be shown at the top of the page',
        }),
    ],
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({ description: '/wiz-page-... commands that define the page\'s contents',
            typeList: ARGUMENT_TYPE.CLOSURE,
        }),
    ],
    returns: 'piped value from /wiz-page-after',
    helpString: `
        <div>Adds a page to the Wizard.</div>
        <div>Use <code>/wiz-page-...</code> commands to define the contents.</div>
    `,
}));

SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'wiz-transition',
    aliases: ['wiz-page-transition'],
    /**
     * @param {import('../../../slash-commands/SlashCommand.js').NamedArguments & {
     *  type:string,
     *  time:string,
     *  clear:string,
     * }} args
     * @param {SlashCommandClosure} contentClosure
     */
    callback: async(args, contentClosure)=>{
        const wiz = /**@type {Wizard}*/(args._scope.existsVariable('_STWIZ_') && args._scope.getVariable('_STWIZ_'));
        const page = /**@type {WizardPage}*/(args._scope.existsVariable('_STWIZ_PAGE_') && args._scope.getVariable('_STWIZ_PAGE_'));
        if (!page && !wiz) throw new Error('Cannot call "/wiz-transition" outside of "/wiz-page" or "/wizard"');

        if (args.clear != undefined) {
            (page ?? wiz).transition = null;
            return '';
        }

        const transition = new WizardTransition();
        transition.type = Object.values(TRANSITION_TYPE).find(it=>it == args.type) ?? page?.transition?.type ?? wiz.transition?.type ?? transition.type;
        transition.time = Number(args.time ?? page?.transition?.time ?? wiz.transition?.time ?? transition.time);

        (page ?? wiz).transition = transition;

        return '';
    },
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({ name: 'type',
            description: 'the type of transition to apply',
            enumList: Object.values(TRANSITION_TYPE),
            defaultValue: TRANSITION_TYPE.FADE,
        }),
        SlashCommandNamedArgument.fromProps({ name: 'time',
            description: 'duration of the transition animation in milliseconds',
            typeList: ARGUMENT_TYPE.NUMBER,
            defaultValue: '400',
        }),
        SlashCommandNamedArgument.fromProps({ name: 'clear',
            description: 'add "clear=" to remove a transition from a page when a default was set on the Wizard',
        }),
    ],
    helpString: `
        <div>Sets a transition to be used between pages.</div>
        <div>Call this command directly in the Wizard to set a default transition for all pages. Defaults can be selectively overwritten by each page.</div>
    `,
}));

SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'wiz-hero',
    aliases: ['wiz-page-hero'],
    /**
     * @param {import('../../../slash-commands/SlashCommand.js').NamedArguments & {
     *  layout:string,
     *  position:string,
     *  size:string,
     *  image:string,
     *  color:string
     *  clear:string
     * }} args
     * @param {SlashCommandClosure} contentClosure
     */
    callback: async(args, contentClosure)=>{
        const wiz = /**@type {Wizard}*/(args._scope.existsVariable('_STWIZ_') && args._scope.getVariable('_STWIZ_'));
        const page = /**@type {WizardPage}*/(args._scope.existsVariable('_STWIZ_PAGE_') && args._scope.getVariable('_STWIZ_PAGE_'));
        if (!page && !wiz) throw new Error('Cannot call "/wiz-hero" outside of "/wiz-page" or "/wizard"');

        if (args.clear != undefined) {
            (page ?? wiz).hero = null;
            return '';
        }

        const hero = new WizardHero();
        hero.layout = Object.values(HERO_LAYOUT).find(it=>it == args.layout) ?? page?.hero?.layout ?? wiz.hero?.layout ?? hero.layout;
        hero.position = Object.values(HERO_POSITION).find(it=>it == args.position) ?? page?.hero?.position ?? wiz.hero?.position ?? hero.position;
        hero.size = Number(args.size ?? page?.hero?.size ?? wiz.hero?.size ?? hero.size);
        hero.image = args.image ?? page?.hero?.image ?? wiz.hero?.image;
        hero.color = args.color ?? page?.hero?.color ?? wiz.hero?.color;
        hero.text = page?.hero?.text ?? wiz.hero?.text;

        args._scope.variables['_STWIZ_HERO_'] = hero;
        if (contentClosure) await contentClosure.execute();

        (page ?? wiz).hero = hero;

        return '';
    },
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({ name: 'layout',
            description: 'in which direction to split the page',
            enumList: Object.values(HERO_LAYOUT),
            defaultValue: HERO_LAYOUT.VERTICAL,
        }),
        SlashCommandNamedArgument.fromProps({ name: 'position',
            description: 'where to place the hero panel',
            enumList: Object.values(HERO_POSITION),
            defaultValue: HERO_POSITION.START,
        }),
        SlashCommandNamedArgument.fromProps({ name: 'size',
            description: 'percentage of the page to be filled with the hero panel',
            typeList: ARGUMENT_TYPE.NUMBER,
            defaultValue: '40',
        }),
        SlashCommandNamedArgument.fromProps({ name: 'image',
            description: 'URL to an image to be placed in the hero panel',
        }),
        SlashCommandNamedArgument.fromProps({ name: 'color',
            description: 'color to fill the hero panel with (any valid CSS color, google "MDN color")',
            defaultValue: 'transparent',
        }),
        SlashCommandNamedArgument.fromProps({ name: 'clear',
            description: 'add "clear=" to remove a hero panel from a page when a default was set on the Wizard',
        }),
    ],
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({ description: '/wiz-hero-... commands that define the hero panel\'s contents',
            typeList: ARGUMENT_TYPE.CLOSURE,
        }),
    ],
    helpString: `
        <div>Adds a hero panel to the page.</div>
        <div>Call this command directly in the Wizard to set a default hero for all pages. Defaults can be selectively overwritten by each page.</div>
        <div>Use <code>/wiz-hero-...</code> commands to define the contents.</div>
    `,
}));
SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'wiz-hero-text',
    aliases: ['wiz-page-hero-text'],
    /**
     * @param {import('../../../slash-commands/SlashCommand.js').NamedArguments & {
     *  position:string,
     *  blur:string,
     *  background:string,
     *  foreground:string,
     *  size:string,
     * }} args
     * @param {string} text
     */
    callback: async(args, text)=>{
        const hero = /**@type {WizardHero}*/(args._scope.existsVariable('_STWIZ_HERO_') && args._scope.getVariable('_STWIZ_HERO_'));
        if (!hero) throw new Error('Cannot call "/wiz-hero-text" outside of "/wiz-hero"');

        const heroText = new WizardHeroText();
        heroText.position = Object.values(HERO_TEXT_POSITION).find(it=>it == args.position) ?? hero.text?.position ?? heroText.position;
        heroText.blur = Number(args.blur ?? hero.text?.blur ?? heroText.blur);
        heroText.backgroundColor = args.background ?? hero.text?.backgroundColor ?? heroText.backgroundColor;
        heroText.foregroundColor = args.foreground ?? hero.text?.foregroundColor ?? heroText.foregroundColor;
        heroText.size = Number(args.size ?? hero.text?.size ?? heroText.size);
        heroText.text = text;

        hero.text = heroText;

        return '';
    },
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({ name: 'position',
            description: 'where to place the text inside the hero panel',
            enumList: Object.values(HERO_TEXT_POSITION),
            defaultValue: HERO_TEXT_POSITION.START,
        }),
        SlashCommandNamedArgument.fromProps({ name: 'blur',
            description: 'blur strength for area behind the text',
            typeList: ARGUMENT_TYPE.NUMBER,
            defaultValue: '6',
        }),
        SlashCommandNamedArgument.fromProps({ name: 'background',
            description: 'color to fill the area behind the text with (any valid CSS color, google "MDN color")',
            defaultValue: 'transparent',
        }),
        SlashCommandNamedArgument.fromProps({ name: 'foreground',
            description: 'text color (any valid CSS color, google "MDN color")',
            defaultValue: 'default text color',
        }),
        SlashCommandNamedArgument.fromProps({ name: 'size',
            description: 'text size, factor applied to default size',
            typeList: ARGUMENT_TYPE.NUMBER,
            defaultValue: '1.0',
        }),
    ],
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({ description: 'text to display in the hero panel' }),
    ],
    helpString: `
        <div>Adds text into the hero panel.</div>
        <div>Call this command directly in the Wizard's hero to set a default hero for all pages. Defaults can be selectively overwritten by each page.</div>
    `,
}));

SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'wiz-nav',
    aliases: ['wiz-page-nav'],
    /**
     * @param {import('../../../slash-commands/SlashCommand.js').NamedArguments & {
     *  position:string,
     *  prev:string,
     *  next:string,
     *  stop:string,
     *  clear:string,
     * }} args
     * @param {SlashCommandClosure} contentClosure
     */
    callback: async(args, contentClosure)=>{
        const wiz = /**@type {Wizard}*/(args._scope.existsVariable('_STWIZ_') && args._scope.getVariable('_STWIZ_'));
        const page = /**@type {WizardPage}*/(args._scope.existsVariable('_STWIZ_PAGE_') && args._scope.getVariable('_STWIZ_PAGE_'));
        if (!page && !wiz) throw new Error('Cannot call "/wiz-nav" outside of "/wiz-page" or "/wizard"');

        if (args.clear != undefined) {
            (page ?? wiz).hero = null;
            return '';
        }

        const nav = new WizardNav();
        nav.position = Object.values(NAV_POSITION).find(it=>it == args.position) ?? wiz.nav?.position ?? nav.position;
        nav.prev = !isFalseBoolean(args.prev ?? page?.nav?.prev?.toString() ?? wiz?.nav?.prev?.toString() ?? 'true');
        nav.next = !isFalseBoolean(args.next ?? page?.nav?.next?.toString() ?? wiz?.nav?.next?.toString() ?? 'true');
        nav.stop = !isFalseBoolean(args.stop ?? page?.nav?.stop?.toString() ?? wiz?.nav?.stop?.toString() ?? 'true');

        args._scope.variables['_STWIZ_NAV_'] = nav;
        if (contentClosure) await contentClosure.execute();

        (page ?? wiz).nav = nav;

        return '';
    },
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({ name: 'position',
            description: 'where to place the navigation buttons inside the page',
            enumList: Object.values(NAV_POSITION),
            defaultValue: NAV_POSITION.END,
        }),
        SlashCommandNamedArgument.fromProps({ name: 'prev',
            description: 'use prev=false to hide the back / previous page button',
            typeList: ARGUMENT_TYPE.BOOLEAN,
        }),
        SlashCommandNamedArgument.fromProps({ name: 'next',
            description: 'use next=false to hide the next page button',
            typeList: ARGUMENT_TYPE.BOOLEAN,
        }),
        SlashCommandNamedArgument.fromProps({ name: 'prev',
            description: 'use stop=false to hide the cancel (X) button',
            typeList: ARGUMENT_TYPE.BOOLEAN,
        }),
        SlashCommandNamedArgument.fromProps({ name: 'clear',
            description: 'add "clear=" to remove navigation from a page when a default was set on the Wizard',
        }),
    ],
    helpString: `
        <div>Adds navigation buttons to the page.</div>
        <div>Call this command directly in the Wizard to set a default for all pages. Defaults can be selectively overwritten by each page.</div>
    `,
}));

// SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'wiz-crumbs',
//     aliases: ['wiz-page-crumbs'],
//     /**
//      * @param {import('../../../slash-commands/SlashCommand.js').NamedArguments & {
//      *  position:string,
//      *  clear:string,
//      * }} args
//      * @param {SlashCommandClosure} contentClosure
//      */
//     callback: async(args, contentClosure)=>{
//         const wiz = /**@type {Wizard}*/(args._scope.existsVariable('_STWIZ_') && args._scope.getVariable('_STWIZ_'));
//         const page = /**@type {WizardPage}*/(args._scope.existsVariable('_STWIZ_PAGE_') && args._scope.getVariable('_STWIZ_PAGE_'));
//         if (!page && !wiz) throw new Error('Cannot call "/wiz-crumbs" outside of "/wiz-page" or "/wizard"');

//         if (args.clear != undefined) {
//             (page ?? wiz).crumbs = null;
//             return '';
//         }

//         const crumbs = new WizardCrumbs();
//         crumbs.position = Object.values(CRUMBS__POSITION).find(it=>it == args.position) ?? wiz.crumbs?.position ?? crumbs.position;

//         args._scope.variables['_STWIZ_CRUMBS_'] = crumbs;
//         if (contentClosure) await contentClosure.execute();

//         (page ?? wiz).crumbs = crumbs;

//         return '';
//     },
// }));


/* */

// content
//TODO checkbox (compact:checkbox+label, image+label, large-label)
//TODO select
//TODO radio group (=button group? overlap with select?)
//x image (just use markdown)
//x textInput
//TODO numberInput (range+number?)
//x textarea (needs optional label, placeholder)
//TODO fileInput (Files Plugin / File Explorer Extension)

SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'wiz-page-title',
    /**
     * @param {import('../../../slash-commands/SlashCommand.js').NamedArguments & {
     *  level:string,
     * }} args
     * @param {string} text
     */
    callback: async(args, text)=>{
        const page = /**@type {WizardPage}*/(args._scope.existsVariable('_STWIZ_PAGE_') && args._scope.getVariable('_STWIZ_PAGE_'));
        if (!page) throw new Error('Cannot call "/wiz-page-title" outside of "/wiz-page"');

        const content = new WizardTitle();
        content.text = text;
        if (args.level !== undefined) content.level = Number(args.level);

        page.contentList.push(content);

        return '';
    },
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({ name: 'level',
            description: 'level / weight of the title',
            typeList: ARGUMENT_TYPE.NUMBER,
            enumList: ['1', '2', '3'],
            defaultValue: '1',
        }),
    ],
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({ description: 'title text' }),
    ],
    helpString: `
        <div>Adds a title / header element to the page.</div>
        <div>You can also create markdown titles in <code>/wiz-page-text</code>.</div>
    `,
}));

SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'wiz-page-text',
    /**
     * @param {import('../../../slash-commands/SlashCommand.js').NamedArguments & {
     * }} args
     * @param {string} text
     */
    callback: async(args, text)=>{
        const page = /**@type {WizardPage}*/(args._scope.existsVariable('_STWIZ_PAGE_') && args._scope.getVariable('_STWIZ_PAGE_'));
        if (!page) throw new Error('Cannot call "/wiz-page-text" outside of "/wiz-page"');

        const content = new WizardText();
        content.text = text;

        page.contentList.push(content);

        return '';
    },
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({ description: 'markdown text' }),
    ],
    helpString: `
        <div>Adds a markdown text to the page.</div>
    `,
}));

SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'wiz-page-textarea',
    /**
     * @param {import('../../../slash-commands/SlashCommand.js').NamedArguments & {
     *  label:string,
     *  placeholder:string,
     *  var:string,
     * }} args
     * @param {string} value
     */
    callback: async(args, value)=>{
        const page = /**@type {WizardPage}*/(args._scope.existsVariable('_STWIZ_PAGE_') && args._scope.getVariable('_STWIZ_PAGE_'));
        if (!page) throw new Error('Cannot call "/wiz-page-textarea" outside of "/wiz-page"');

        const content = new WizardTextArea();
        content.label = args.label;
        content.placeholder = args.placeholder;
        content.value = value ?? '';
        content.varName = args.var;

        page.contentList.push(content);

        return '';
    },
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({ name: 'label',
            description: 'label text to show above the textarea',
        }),
        SlashCommandNamedArgument.fromProps({ name: 'placeholder',
            description: 'placeholder text to show in the empty the textarea',
        }),
        SlashCommandNamedArgument.fromProps({ name: 'var',
            description: 'variable name to assign the entered value to, access with {{wizvar::varname}}',
        }),
    ],
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({ description: 'initial value' }),
    ],
    helpString: `
        <div>Adds a multi-line textarea for user input to the page.</div>
    `,
}));

SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'wiz-page-textbox',
    /**
     * @param {import('../../../slash-commands/SlashCommand.js').NamedArguments & {
     *  label:string,
     *  placeholder:string,
     *  var:string,
     * }} args
     * @param {string} value
     */
    callback: async(args, value)=>{
        const page = /**@type {WizardPage}*/(args._scope.existsVariable('_STWIZ_PAGE_') && args._scope.getVariable('_STWIZ_PAGE_'));
        if (!page) throw new Error('Cannot call "/wiz-page-textbox" outside of "/wiz-page"');

        const content = new WizardTextBox();
        content.label = args.label;
        content.placeholder = args.placeholder;
        content.value = value ?? '';
        content.varName = args.var;

        page.contentList.push(content);

        return '';
    },
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({ name: 'label',
            description: 'label text to show above the textbox',
        }),
        SlashCommandNamedArgument.fromProps({ name: 'placeholder',
            description: 'placeholder text to show in the empty the textbox',
        }),
        SlashCommandNamedArgument.fromProps({ name: 'var',
            description: 'variable name to assign the entered value to, access with {{wizvar::varname}}',
        }),
    ],
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({ description: 'initial value' }),
    ],
    helpString: `
        <div>Adds a single-line textbox for user input to the page.</div>
    `,
}));

SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'wiz-page-button',
    /**
     * @param {import('../../../slash-commands/SlashCommand.js').NamedArguments & {
     *  label:string,
     *  icon:string,
     *  image:string,
     *  small:string,
     * }} args
     * @param {SlashCommandClosure} callback
     */
    callback: async(args, callback)=>{
        const page = /**@type {WizardPage}*/(args._scope.existsVariable('_STWIZ_PAGE_') && args._scope.getVariable('_STWIZ_PAGE_'));
        if (!page) throw new Error('Cannot call "/wiz-page-button" outside of "/wiz-page"');

        callback?.scope?.letVariable('_STWIZ_PAGE_', page);

        const content = new WizardButton();
        content.label = args.label;
        content.icon = args.icon;
        content.image = args.image;
        content.isSmall = isTrueBoolean((args.small ?? 'false') || 'true');
        content.callback = callback;

        page.contentList.push(content);

        return '';
    },
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({ name: 'label',
            description: 'label text to show on the button',
        }),
        SlashCommandNamedArgument.fromProps({ name: 'icon',
            description: 'icon to show on the button, look up icons with /pick-icon',
        }),
        SlashCommandNamedArgument.fromProps({ name: 'image',
            description: 'image to show on the button',
        }),
        SlashCommandNamedArgument.fromProps({ name: 'small',
            description: 'add "small=" to show a smaller button',
            typeList: ARGUMENT_TYPE.BOOLEAN,
            defaultValue: 'false',
        }),
    ],
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({ description: 'closure to execute when the button is clicked',
            typeList: ARGUMENT_TYPE.CLOSURE,
            isRequired: true,
        }),
    ],
    helpString: `
        <div>Adds a clickable button to the page.</div>
    `,
}));

SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'wiz-page-checkbox',
    /**
     * @param {import('../../../slash-commands/SlashCommand.js').NamedArguments & {
     *  label:string,
     *  icon:string,
     *  image:string,
     *  value:string,
     *  small:string,
     *  var:string,
     *  group:string,
     *  checked:string,
     * }} args
     * @param {SlashCommandClosure} callback
     */
    callback: async(args, callback)=>{
        const wiz = /**@type {Wizard}*/(args._scope.existsVariable('_STWIZ_') && args._scope.getVariable('_STWIZ_'));
        const page = /**@type {WizardPage}*/(args._scope.existsVariable('_STWIZ_PAGE_') && args._scope.getVariable('_STWIZ_PAGE_'));
        if (!page) throw new Error('Cannot call "/wiz-page-checkbox" outside of "/wiz-page"');

        callback?.scope?.letVariable('_STWIZ_PAGE_', page);

        const content = new WizardCheckbox();
        content.label = args.label;
        content.group = args.group;
        content.var = args.var;
        content.value = args.value ?? args.label;
        content.checked = isTrueBoolean((args.checked ?? 'false') || 'true');
        content.icon = args.icon;
        content.image = args.image;
        content.isSmall = isTrueBoolean((args.small ?? 'false') || 'true');

        if (content.var !== undefined) wiz.setVariable(content.var, JSON.stringify(content.checked));
        if (content.group !== undefined) {
            let group = [];
            try { group = JSON.parse(wiz.getVariable(content.group)); } catch { /* not JSON */ }
            if (content.checked) {
                const val = content.value ?? content.label;
                if (!group.includes(val)) group.push(val);
            }
            wiz.setVariable(content.group, JSON.stringify(group));
        }

        page.contentList.push(content);

        return '';
    },
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({ name: 'label',
            description: 'label text to show on the checkbox',
        }),
        SlashCommandNamedArgument.fromProps({ name: 'icon',
            description: 'icon to show on the checkbox, look up icons with /pick-icon',
        }),
        SlashCommandNamedArgument.fromProps({ name: 'image',
            description: 'image to show on the checkbox',
        }),
        SlashCommandNamedArgument.fromProps({ name: 'small',
            description: 'add "small=" to show a smaller checkbox',
            typeList: ARGUMENT_TYPE.BOOLEAN,
            defaultValue: 'false',
        }),
        SlashCommandNamedArgument.fromProps({ name: 'var',
            description: 'variable to assign checked state to - {{wizvar::...}} = true|false',
            typeList: ARGUMENT_TYPE.VARIABLE_NAME,
        }),
        SlashCommandNamedArgument.fromProps({ name: 'group',
            description: 'list variable to add the checkbox value to if checked - {{wizvar:...}} = ["a", "b", ...]',
            typeList: ARGUMENT_TYPE.VARIABLE_NAME,
        }),
        SlashCommandNamedArgument.fromProps({ name: 'value',
            description: 'value to add to the group= list if checked, uses label= if not set',
        }),
        SlashCommandNamedArgument.fromProps({ name: 'checked',
            description: 'add "checked=" to start the checkbox already checked',
            typeList: ARGUMENT_TYPE.BOOLEAN,
            defaultValue: 'false',
        }),
    ],
    helpString: `
        <div>Adds a checkbox to the page.</div>
    `,
}));




// commands

SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'wiz-cmd-goto',
    /**
     * @param {import('../../../slash-commands/SlashCommand.js').NamedArguments & {
     * }} args
     * @param {string} id
     */
    callback: async(args, id)=>{
        const wiz = /**@type {Wizard}*/(args._scope.existsVariable('_STWIZ_') && args._scope.getVariable('_STWIZ_'));
        if (!wiz) throw new Error('Cannot call "/wiz-cmd-goto" outside of "/wizard"');

        await wiz.goto(id);

        return '';
    },
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({ description: 'ID of the page to go to' }),
    ],
    helpString: `
        <div>Jump directly to another page.</div>
    `,
}));

SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'wiz-cmd-busy',
    /**
     * @param {import('../../../slash-commands/SlashCommand.js').NamedArguments & {
     * }} args
     * @param {string} value
     */
    callback: async(args, value)=>{
        const page = /**@type {WizardPage}*/(args._scope.existsVariable('_STWIZ_PAGE_') && args._scope.getVariable('_STWIZ_PAGE_'));
        if (!page) throw new Error('Cannot call "/wiz-cmd-busy" outside of "/wiz-page"');

        page.dom.root?.classList?.[isFalseBoolean(value ?? 'true') ? 'remove' : 'add']('stwiz--busy');

        return '';
    },
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({ description: 'whether to block or unblock the page',
            typeList: ARGUMENT_TYPE.BOOLEAN,
            defaultValue: 'true',
        }),
    ],
    helpString: `
        <div>Block interaction on the current page.</div>
    `,
}));

SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'wiz-cmd-var',
    aliases: ['setwizvar'],
    /**
     * @param {import('../../../slash-commands/SlashCommand.js').NamedArguments & {
     *  key:string,
     *  index:string,
     * }} args
     * @param {string|string[]} value
     */
    callback: async(args, value)=>{
        const wiz = /**@type {Wizard}*/(args._scope.existsVariable('_STWIZ_') && args._scope.getVariable('_STWIZ_'));
        if (!wiz) throw new Error('Cannot call "/wiz-cmd-var" outside of "/wizard" or "/wiz-page"');

        if (!Array.isArray(value)) value = [value];
        if (args.key !== undefined) {
            const key = args.key;
            if (typeof key != 'string') throw new Error('Key must be a string');
            if (args._hasUnnamedArgument) {
                const val = typeof value[0] == 'string' ? value.join(' ') : value[0];
                wiz.setVariable(key, val, args.index);
                return val;
            } else {
                return wiz.getVariable(key, args.index);
            }
        }
        const key = value.shift();
        if (typeof key != 'string') throw new Error('Key must be a string');
        if (value.length > 0) {
            const val = typeof value[0] == 'string' ? value.join(' ') : value[0];
            wiz.setVariable(key, val, args.index);
            return val;
        } else {
            return wiz.getVariable(key, args.index);
        }
    },
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({
            name: 'key',
            description: 'variable name; forces setting the variable, even if no value is provided',
            typeList: [ARGUMENT_TYPE.VARIABLE_NAME],
        }),
        new SlashCommandNamedArgument(
            'index',
            'optional index for list or dictionary',
            [ARGUMENT_TYPE.NUMBER],
            false, // isRequired
            false, // acceptsMultiple
        ),
    ],
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: 'variable name',
            typeList: [ARGUMENT_TYPE.VARIABLE_NAME],
        }),
        new SlashCommandArgument(
            'variable value',
            [ARGUMENT_TYPE.STRING, ARGUMENT_TYPE.NUMBER, ARGUMENT_TYPE.BOOLEAN, ARGUMENT_TYPE.LIST, ARGUMENT_TYPE.DICTIONARY, ARGUMENT_TYPE.CLOSURE],
            false, // isRequired
            false, // acceptsMultiple
        ),
    ],
    splitUnnamedArgument: true,
    splitUnnamedArgumentCount: 1,
    helpString: `
        <div>
            Get or set a variable specific to the Wizard.
        </div>
        <div>
            You can use the <code>{{wizvar::varname}}</code> macro on Wizard pages.
        </div>
        <div>
            <strong>Examples:</strong>
            <ul>
                <li>
                    <pre><code class="language-stscript">/wiz-cmd-var x foo bar | /wiz-cmd-var x | /echo</code></pre>
                </li>
                <li>
                    <pre><code class="language-stscript">/wiz-cmd-var key=x foo bar | /wiz-cmd-var x | /echo</code></pre>
                </li>
            </ul>
        </div>
    `,
}));

SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'wiz-cmd-stop',
    /**
     * @param {import('../../../slash-commands/SlashCommand.js').NamedArguments & {
     * }} args
     * @param {string} value
     */
    callback: async(args, value)=>{
        const wiz = /**@type {Wizard}*/(args._scope.existsVariable('_STWIZ_') && args._scope.getVariable('_STWIZ_'));
        if (!wiz) throw new Error('Cannot call "/wiz-cmd-stop" outside of "/wizard"');

        await wiz.stop(value);

        return '';
    },
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({ description: 'value to return from the Wizard' }),
    ],
    helpString: `
        <div>Stop the Wizard and return the optional unnamed argument.</div>
    `,
}));

SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'wiz-cmd-next',
    /**
     * @param {import('../../../slash-commands/SlashCommand.js').NamedArguments & {
     * }} args
     * @param {string} value
     */
    callback: async(args, value)=>{
        const wiz = /**@type {Wizard}*/(args._scope.existsVariable('_STWIZ_') && args._scope.getVariable('_STWIZ_'));
        if (!wiz) throw new Error('Cannot call "/wiz-cmd-next" outside of "/wizard"');

        await wiz.next();

        return '';
    },
    helpString: `
        <div>Go to the next page.</div>
    `,
}));

SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'wiz-cmd-prev',
    /**
     * @param {import('../../../slash-commands/SlashCommand.js').NamedArguments & {
     * }} args
     * @param {string} value
     */
    callback: async(args, value)=>{
        const wiz = /**@type {Wizard}*/(args._scope.existsVariable('_STWIZ_') && args._scope.getVariable('_STWIZ_'));
        if (!wiz) throw new Error('Cannot call "/wiz-cmd-prev" outside of "/wizard"');

        await wiz.prev();

        return '';
    },
    helpString: `
        <div>Go to the previous page.</div>
    `,
}));
