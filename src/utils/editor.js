import jSuites from 'jsuites';

import dispatch from "./dispatch.js";
import { getMask, isFormula, updateCell } from "./internal.js";
import { setHistory } from './history.js';

/**
 * Open the editor
 *
 * @param object cell
 * @return void
 */
export const openEditor = function(cell, empty, e) {
    const obj = this;

    // Get cell position
    const y = cell.getAttribute('data-y');
    const x = cell.getAttribute('data-x');
    // Cell name for cell-level config
    const getColumnNameFromId = obj.getColumnNameFromId || require('./internalHelpers.js').getColumnNameFromId;
    const cellName = getColumnNameFromId([x, y]);
    const cellConfig = obj.options.cells && obj.options.cells[cellName] ? obj.options.cells[cellName] : null;
    // Priority: cellConfig > column config
    const type = cellConfig && cellConfig.type ? cellConfig.type : (obj.options.columns && obj.options.columns[x] && obj.options.columns[x].type);
    const source = cellConfig && cellConfig.source ? cellConfig.source : (obj.options.columns && obj.options.columns[x] && obj.options.columns[x].source);
    const options = cellConfig && cellConfig.options ? cellConfig.options : (obj.options.columns && obj.options.columns[x] && obj.options.columns[x].options);

    // On edition start
    dispatch.call(obj, 'oneditionstart', obj, cell, parseInt(x), parseInt(y));

    // Overflow
    if (x > 0) {
        obj.records[y][x-1].element.style.overflow = 'hidden';
    }

    // Create editor
    const createEditor = function(type) {
        // Cell information
        const info = cell.getBoundingClientRect();
        // Create dropdown
        const editor = document.createElement(type);
        editor.style.width = (info.width) + 'px';
        editor.style.height = (info.height - 2) + 'px';
        editor.style.minHeight = (info.height - 2) + 'px';
        // Edit cell
        cell.classList.add('editor');
        cell.innerHTML = '';
        cell.appendChild(editor);
        return editor;
    }

    // Readonly
    if (cell.classList.contains('readonly') == true) {
        // Do nothing
    } else {
        // Holder
        obj.edition = [ obj.records[y][x].element, obj.records[y][x].element.innerHTML, x, y ];

        // If there is a custom editor for it
        if (typeof type === 'object' && typeof type.openEditor === 'function') {
            // Custom editors
            type.openEditor(cell, obj.options.data[y][x], parseInt(x), parseInt(y), obj, type, e);
            // On edition start
            dispatch.call(obj, 'oncreateeditor', obj, cell, parseInt(x), parseInt(y), null, type);
        } else {
            // Native functions
            if (type == 'hidden') {
                // Do nothing
            } else if (type == 'checkbox' || type == 'radio') {
                // Get value
                const value = cell.children[0].checked ? false : true;
                // Toggle value
                obj.setValue(cell, value);
                // Do not keep edition open
                obj.edition = null;
            } else if (type == 'dropdown') {
                // Get current value
                let value = obj.options.data[y][x];
                // Support multiple
                if (options && options.multiple && !Array.isArray(value)) {
                    value = value.split(';');
                }
                // Use cell-level source if present
                let dropdownSource = source;
                if (typeof(options && options.filter) == 'function') {
                    dropdownSource = options.filter(obj.element, cell, x, y, source);
                }
                // Do not change the original source
                const data = [];
                if (dropdownSource) {
                    for (let j = 0; j < dropdownSource.length; j++) {
                        data.push(dropdownSource[j]);
                    }
                }
                // Create editor
                const editor = createEditor('div');
                // On edition start
                dispatch.call(obj, 'oncreateeditor', obj, cell, parseInt(x), parseInt(y), null, type);
                const dropdownOptions = {
                    data: data,
                    multiple: options && options.multiple ? true : false,
                    autocomplete: options && options.autocomplete ? true : false,
                    opened:true,
                    value: value,
                    width:'100%',
                    height:editor.style.minHeight,
                    position: (obj.options.tableOverflow == true || obj.parent.config.fullscreen == true) ? true : false,
                    onclose:function() {
                        closeEditor.call(obj, cell, true);
                    }
                };
                if (options && options.type) {
                    dropdownOptions.type = options.type;
                }
                jSuites.dropdown(editor, dropdownOptions);
            } else if (type == 'color' || type == 'calendar' || type == 'html' || type == 'image') {
                // Value
                const value = obj.options.data[y][x];
                // Create editor
                const editor = createEditor('input');

                dispatch.call(obj, 'oncreateeditor', obj, cell, parseInt(x), parseInt(y), null, type);

                editor.value = value;

                const opts = obj.options.columns && obj.options.columns[x] && obj.options.columns[x].options ? { ...obj.options.columns[x].options } : {};

                if (obj.options.tableOverflow == true || obj.parent.config.fullscreen == true) {
                    opts.position = true;
                }
                opts.value = obj.options.data[y][x];
                opts.opened = true;
                opts.onclose = function(el, value) {
                    closeEditor.call(obj, cell, true);
                }
                // Current value
                if (type == 'color') {
                    jSuites.color(editor, opts);

                    const rect = cell.getBoundingClientRect();

                    if (opts.position) {
                        editor.nextSibling.children[1].style.top = (rect.top + rect.height) + 'px';
                        editor.nextSibling.children[1].style.left = rect.left + 'px';
                    }
                } else if (type == 'calendar') {
                    if (!opts.format) opts.format = 'YYYY-MM-DD';
                    jSuites.calendar(editor, opts);
                } else if (type == 'html') {
                    const value = obj.options.data[y][x];
                    // Create editor
                    const editor = createEditor('div');

                    dispatch.call(obj, 'oncreateeditor', obj, cell, parseInt(x), parseInt(y), null, type);

                    editor.style.position = 'relative';
                    const div = document.createElement('div');
                    div.classList.add('jss_richtext');
                    editor.appendChild(div);
                    jSuites.editor(div, {
                        focus: true,
                        value: value,
                    });
                    const rect = cell.getBoundingClientRect();
                    const rectContent = div.getBoundingClientRect();
                    if (window.innerHeight < rect.bottom + rectContent.height) {
                        div.style.top = (rect.bottom - (rectContent.height + 2)) + 'px';
                    } else {
                        div.style.top = (rect.top) + 'px';
                    }

                    if (window.innerWidth < rect.left + rectContent.width) {
                        div.style.left = (rect.right - (rectContent.width + 2)) + 'px';
                    } else {
                        div.style.left = rect.left + 'px';
                    }
                } else if (type == 'image') {
                    // Value
                    const img = cell.children[0];
                    // Create editor
                    const editor = createEditor('div');

                    dispatch.call(obj, 'oncreateeditor', obj, cell, parseInt(x), parseInt(y), null, type);

                    editor.style.position = 'relative';
                    const div = document.createElement('div');
                    div.classList.add('jclose');
                    if (img && img.src) {
                        div.appendChild(img);
                    }
                    editor.appendChild(div);
                    jSuites.image(div, obj.options.columns[x]);
                    const rect = cell.getBoundingClientRect();
                    const rectContent = div.getBoundingClientRect();
                    if (window.innerHeight < rect.bottom + rectContent.height) {
                        div.style.top = (rect.top - (rectContent.height + 2)) + 'px';
                    } else {
                        div.style.top = (rect.top) + 'px';
                    }

                    div.style.left = rect.left + 'px';
                }
                // Focus on editor
                editor.focus();
            } else {
                // Default: text/textarea
                const value = empty == true ? '' : obj.options.data[y][x];
                let editor;
                if ((!obj.options.columns || !obj.options.columns[x] || obj.options.columns[x].wordWrap != false) && (obj.options.wordWrap == true || (obj.options.columns && obj.options.columns[x] && obj.options.columns[x].wordWrap == true))) {
                    editor = createEditor('textarea');
                } else {
                    editor = createEditor('input');
                }
                dispatch.call(obj, 'oncreateeditor', obj, cell, parseInt(x), parseInt(y), null, type);
                editor.focus();
                editor.value = value;
                // Column/cell options
                const opts = options ? { ...options } : {};
                if (obj.options.tableOverflow == true || obj.parent.config.fullscreen == true) {
                    opts.position = true;
                }
                opts.value = obj.options.data[y][x];
                opts.opened = true;
                opts.onclose = function(el, value) {
                    closeEditor.call(obj, cell, true);
                }
                // Current value
                if (type == 'color') {
                    jSuites.color(editor, opts);
                } else if (type == 'calendar') {
                    if (!opts.format) opts.format = 'YYYY-MM-DD';
                    jSuites.calendar(editor, opts);
                }
                editor.onblur = function() {
                    closeEditor.call(obj, cell, true);
                };
                editor.scrollLeft = editor.scrollWidth;
            }
        }
    }
}

/**
 * Close the editor and save the information
 *
 * @param object cell
 * @param boolean save
 * @return void
 */
export const closeEditor = function(cell, save) {
    const obj = this;

    const x = parseInt(cell.getAttribute('data-x'));
    const y = parseInt(cell.getAttribute('data-y'));

    let value;

    // Get cell properties
    if (save == true) {
        // If custom editor
        if (obj.options.columns && obj.options.columns[x] && typeof obj.options.columns[x].type === 'object') {
            // Custom editor
            value = obj.options.columns[x].type.closeEditor(cell, save, parseInt(x), parseInt(y), obj, obj.options.columns[x]);
        } else {
            // Native functions
            if (obj.options.columns && obj.options.columns[x] && (obj.options.columns[x].type == 'checkbox' || obj.options.columns[x].type == 'radio' || obj.options.columns[x].type == 'hidden')) {
                // Do nothing
            } else if (obj.options.columns && obj.options.columns[x] && obj.options.columns[x].type == 'dropdown') {
                value = cell.children[0].dropdown.close(true);
            } else if (obj.options.columns && obj.options.columns[x] && obj.options.columns[x].type == 'calendar') {
                value = cell.children[0].calendar.close(true);
            } else if (obj.options.columns && obj.options.columns[x] && obj.options.columns[x].type == 'color') {
                value = cell.children[0].color.close(true);
            } else if (obj.options.columns && obj.options.columns[x] && obj.options.columns[x].type == 'html') {
                value = cell.children[0].children[0].editor.getData();
            } else if (obj.options.columns && obj.options.columns[x] && obj.options.columns[x].type == 'image') {
                const img = cell.children[0].children[0].children[0];
                value = img && img.tagName == 'IMG' ? img.src : '';
            } else if (obj.options.columns && obj.options.columns[x] && obj.options.columns[x].type == 'numeric') {
                value = cell.children[0].value;
                if ((''+value).substr(0,1) != '=') {
                    if (value == '') {
                        value = obj.options.columns[x].allowEmpty ? '' : 0;
                    }
                }
                cell.children[0].onblur = null;
            } else {
                value = cell.children[0].value;
                cell.children[0].onblur = null;

                // Column options
                const options = obj.options.columns && obj.options.columns[x];

                if (options) {
                    // Format
                    const opt = getMask(options);
                    if (opt) {
                        // Keep numeric in the raw data
                        if (value !== '' && ! isFormula(value) && typeof(value) !== 'number') {
                            const t = jSuites.mask.extract(value, opt, true);
                            if (t && t.value !== '') {
                                value = t.value;
                            }
                        }
                    }
                }
            }
        }

        // Ignore changes if the value is the same
        if (obj.options.data[y][x] == value) {
            cell.innerHTML = obj.edition[1];
        } else {
            obj.setValue(cell, value);
        }
    } else {
        if (obj.options.columns && obj.options.columns[x] && typeof obj.options.columns[x].type === 'object') {
            // Custom editor
            obj.options.columns[x].type.closeEditor(cell, save, parseInt(x), parseInt(y), obj, obj.options.columns[x]);
        } else {
            if (obj.options.columns && obj.options.columns[x] && obj.options.columns[x].type == 'dropdown') {
                cell.children[0].dropdown.close(true);
            } else if (obj.options.columns && obj.options.columns[x] && obj.options.columns[x].type == 'calendar') {
                cell.children[0].calendar.close(true);
            } else if (obj.options.columns && obj.options.columns[x] && obj.options.columns[x].type == 'color') {
                cell.children[0].color.close(true);
            } else {
                cell.children[0].onblur = null;
            }
        }

        // Restore value
        cell.innerHTML = obj.edition && obj.edition[1] ? obj.edition[1] : '';
    }

    // On edition end
    dispatch.call(obj, 'oneditionend', obj, cell, x, y, value, save);

    // Remove editor class
    cell.classList.remove('editor');

    // Finish edition
    obj.edition = null;
}

/**
 * Toogle
 */
export const setCheckRadioValue = function() {
    const obj = this;

    const records = [];
    const keys = Object.keys(obj.highlighted);
    for (let i = 0; i < keys.length; i++) {
        const x = obj.highlighted[i].element.getAttribute('data-x');
        const y = obj.highlighted[i].element.getAttribute('data-y');

        if (obj.options.columns[x].type == 'checkbox' || obj.options.columns[x].type == 'radio') {
            // Update cell
            records.push(updateCell.call(obj, x, y, ! obj.options.data[y][x]));
        }
    }

    if (records.length) {
        // Update history
        setHistory.call(obj, {
            action:'setValue',
            records:records,
            selection:obj.selectedCell,
        });

        // On after changes
        const onafterchangesRecords = records.map(function(record) {
            return {
                x: record.x,
                y: record.y,
                value: record.newValue,
                oldValue: record.oldValue,
            };
        });

        dispatch.call(obj, 'onafterchanges', obj, onafterchangesRecords);
    }
}