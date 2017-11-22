/* Daan van Ingen
 * Beautify CSS
 *
 *
 */

function beautifyCSS_trigger(css_source_text, callback){
    var text = beautifyCSS(css_source_text);
    callback(text);
}

function beautifyCSS(source_text){
    var text = trim(source_text);
    var newText = '';
    var input_length = text.length;

    // newText += 'aa';
    // newText += '\n';
    // newText += '\t';
    // newText += 'bb';
    // newText += '\n';
    // newText += 'cc';
    var i = 0;
    var tabDepth = 0;
    while(i < input_length){
        if(text[i] === '{' || text[i] === ';'){
            newText += text[i] + '\n';
        }
        else if(text[i] === '}'){
            newText += text[i] + '\n\n';
        }
        else {
            newText += text[i];
        }
        i++;
    }

    return newText;
}

function trim(s) {
    return s.replace(/^\s\s*|\s\s*$/, '');
}
