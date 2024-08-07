import { substituteParams } from '../../../../../../script.js';
import { markdownUnderscoreExt } from '../../../../../showdown-underscore.js';
import { uuidv4 } from '../../../../../utils.js';

export const messageFormattingWithLanding = (messageText, stripCustom = false)=>{
    const converter = new showdown.Converter({
        emoji: true,
        literalMidWordUnderscores: true,
        parseImgDimensions: true,
        tables: true,
        underline: true,
        simpleLineBreaks: true,
        strikethrough: true,
        disableForced4SpacesIndentedSublists: true,
        extensions: [markdownUnderscoreExt()],
    });
    const html = document
        .createRange()
        .createContextualFragment(messageText)
    ;
    const tags = [];
    const tagMap = {};
    const subUnknown = (root)=>{
        for (const el of [...root.children]) {
            subUnknown(el);
        }
        if (root instanceof HTMLUnknownElement) {
            const match = /^(<.+?>).*(<\/.+?>)$/s.exec(root.outerHTML);
            if (!tags.includes(match[1])) tags.push(match[1]);
            if (!tags.includes(match[2])) tags.push(match[2]);
        }
    };
    subUnknown(html);
    for (const tag of tags) {
        const id = uuidv4();
        tagMap[tag] = id;
        messageText = messageText.replaceAll(tag, `§§§${id}§§§`);
    }
    messageText = substituteParams(messageText);
    messageText = converter.makeHtml(messageText);
    for (const tag of tags) {
        messageText = messageText.replaceAll(`§§§${tagMap[tag]}§§§`, tag);
    }
    if (stripCustom) {
        messageText = messageText.replace(/(custom-)+stcdx--/g, 'stcdx--');
    }
    return messageText;
};
