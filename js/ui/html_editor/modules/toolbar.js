import { getQuill } from "../quill_importer";

import $ from "../../../core/renderer";

import Toolbar from "../../toolbar";
import "../../select_box";
import "../../color_box/color_view";

import { each } from "../../../core/utils/iterator";
import { isString, isObject, isDefined, isEmptyObject } from "../../../core/utils/type";
import { extend } from "../../../core/utils/extend";
import { format } from "../../../localization/message";
import { titleize } from "../../../core/utils/inflector";

import eventsEngine from "../../../events/core/events_engine";
import { addNamespace } from "../../../events/utils";

const BaseModule = getQuill().import("core/module");

const TOOLBAR_WRAPPER_CLASS = "dx-htmleditor-toolbar-wrapper";
const TOOLBAR_CLASS = "dx-htmleditor-toolbar";
const TOOLBAR_FORMAT_WIDGET_CLASS = "dx-htmleditor-toolbar-format";
const TOOLBAR_SEPARATOR_CLASS = "dx-htmleditor-toolbar-separator";
const TOOLBAR_MENU_SEPARATOR_CLASS = "dx-htmleditor-toolbar-menu-separator";
const ACTIVE_FORMAT_CLASS = "dx-format-active";

const ICON_CLASS = "dx-icon";

const SELECTION_CHANGE_EVENT = "selection-change";

const DIALOG_COLOR_CAPTION = "dxHtmlEditor-dialogColorCaption";
const DIALOG_BACKGROUND_CAPTION = "dxHtmlEditor-dialogBackgroundCaption";
const DIALOG_LINK_CAPTION = "dxHtmlEditor-dialogLinkCaption";
const DIALOG_LINK_FIELD_URL = "dxHtmlEditor-dialogLinkUrlField";
const DIALOG_LINK_FIELD_TEXT = "dxHtmlEditor-dialogLinkTextField";
const DIALOG_LINK_FIELD_TARGET = "dxHtmlEditor-dialogLinkTargetField";
const DIALOG_LINK_FIELD_TARGET_CLASS = "dx-formdialog-field-target";
const DIALOG_IMAGE_CAPTION = "dxHtmlEditor-dialogImageCaption";
const DIALOG_IMAGE_FIELD_URL = "dxHtmlEditor-dialogImageUrlField";
const DIALOG_IMAGE_FIELD_ALT = "dxHtmlEditor-dialogImageAltField";
const DIALOG_IMAGE_FIELD_WIDTH = "dxHtmlEditor-dialogImageWidthField";
const DIALOG_IMAGE_FIELD_HEIGHT = "dxHtmlEditor-dialogImageHeightField";

const USER_ACTION = "user";

const HEADING_TEXT = format("dxHtmlEditor-heading");
const NORMAL_TEXT = format("dxHtmlEditor-normalText");

class ToolbarModule extends BaseModule {
    constructor(quill, options) {
        super(quill, options);

        this._editorInstance = options.editorInstance;
        this._formats = {};
        this._formatHandlers = this._getFormatHandlers();

        if(isDefined(options.items)) {
            this._renderToolbar();

            this.quill.on('editor-change', (eventName) => {
                const isSelectionChanged = eventName === SELECTION_CHANGE_EVENT;

                this.updateFormatWidgets(isSelectionChanged);
                this.updateHistoryWidgets();
            });
        }
    }

    _getDefaultClickHandler(formatName) {
        return (e) => {
            const formats = this.quill.getFormat();
            const value = !formats[formatName];

            this.quill.format(formatName, value, USER_ACTION);

            this._updateFormatWidget(formatName, value, formats);
        };
    }

    _updateFormatWidget(formatName, isApplied, formats) {
        const widget = this._formats[formatName];

        if(!widget) {
            return;
        }

        if(isApplied) {
            this._markActiveFormatWidget(formatName, widget, formats);
        } else {
            this._resetFormatWidget(formatName, widget);
            formats.hasOwnProperty(formatName) && delete formats[formatName];
        }

        this._toggleClearFormatting(isApplied || !isEmptyObject(formats));
    }

    _getFormatHandlers() {
        return {
            clear: (e) => {
                const range = this.quill.getSelection();
                if(range) {
                    this.quill.removeFormat(range);
                    this.updateFormatWidgets();
                }
            },
            link: this._prepareLinkHandler(),
            image: this._prepareImageHandler(),
            color: this._prepareColorClickHandler("color"),
            background: this._prepareColorClickHandler("background"),
            orderedList: this._prepareShortcutHandler("list", "ordered"),
            bulletList: this._prepareShortcutHandler("list", "bullet"),
            alignLeft: this._prepareShortcutHandler("align", "left"),
            alignCenter: this._prepareShortcutHandler("align", "center"),
            alignRight: this._prepareShortcutHandler("align", "right"),
            alignJustify: this._prepareShortcutHandler("align", "justify"),
            codeBlock: this._getDefaultClickHandler("code-block"),
            undo: () => {
                this.quill.history.undo();
            },
            redo: () => {
                this.quill.history.redo();
            },
            increaseIndent: () => {
                this.quill.format("indent", "+1", USER_ACTION);
            },
            decreaseIndent: () => {
                this.quill.format("indent", "-1", USER_ACTION);
            },
            superscript: this._prepareShortcutHandler("script", "super"),
            subscript: this._prepareShortcutHandler("script", "sub")
        };
    }

    _prepareShortcutHandler(formatName, shortcutValue) {
        return () => {
            const formats = this.quill.getFormat();
            const value = formats[formatName] === shortcutValue ? false : shortcutValue;

            this.quill.format(formatName, value, USER_ACTION);
            this.updateFormatWidgets(true);
        };
    }

    _prepareLinkHandler() {
        return () => {
            const selection = this.quill.getSelection();
            const formats = this.quill.getFormat();
            const formData = {
                href: formats.link || "",
                text: selection ? this.quill.getText(selection) : "",
                target: formats.hasOwnProperty("target") ? !!formats.target : true
            };
            this._editorInstance.formDialogOption("title", format(DIALOG_LINK_CAPTION));

            const promise = this._editorInstance.showFormDialog({
                formData: formData,
                items: this._getLinkFormItems()
            });

            promise.done((formData) => {
                let index;
                let length;

                if(selection && !formats.link) {
                    const text = formData.text;
                    formData.text = "";

                    index = selection.index;
                    length = selection.length;
                    length && this.quill.deleteText(index, length);
                    this.quill.insertText(index, text, "link", formData, USER_ACTION);
                    this.quill.setSelection(index + text.length, 0);

                } else {
                    this.quill.format("link", formData, USER_ACTION);
                }
            });

            promise.fail(() => {
                this.quill.focus();
            });
        };
    }

    _getLinkFormItems() {
        return [
            { dataField: "href", label: { text: format(DIALOG_LINK_FIELD_URL) } },
            { dataField: "text", label: { text: format(DIALOG_LINK_FIELD_TEXT) } },
            {
                dataField: "target",
                editorType: "dxCheckBox",
                editorOptions: {
                    text: format(DIALOG_LINK_FIELD_TARGET)
                },
                cssClass: DIALOG_LINK_FIELD_TARGET_CLASS,
                label: { visible: false }
            }
        ];
    }

    _prepareImageHandler() {
        return () => {
            const formData = this.quill.getFormat();
            const isUpdateDialog = formData.hasOwnProperty("src");
            const selection = this.quill.getSelection();
            const pasteIndex = selection && selection.index || this.quill.getLength();

            this._editorInstance.formDialogOption("title", format(DIALOG_IMAGE_CAPTION));

            const formItems = [
                { dataField: "src", label: { text: format(DIALOG_IMAGE_FIELD_URL) } },
                { dataField: "width", label: { text: format(DIALOG_IMAGE_FIELD_WIDTH) } },
                { dataField: "height", label: { text: format(DIALOG_IMAGE_FIELD_HEIGHT) } },
                { dataField: "alt", label: { text: format(DIALOG_IMAGE_FIELD_ALT) } },
            ];

            const promise = this._editorInstance.showFormDialog({
                formData: formData,
                items: formItems
            });

            promise.done((formData) => {
                if(isUpdateDialog) {
                    const formatIndex = selection && !selection.length && selection.index - 1 || pasteIndex;
                    this.quill.formatText(formatIndex, 1, {
                        width: formData.width,
                        height: formData.height,
                        alt: formData.alt
                    }, USER_ACTION);
                } else {
                    this.quill.insertEmbed(pasteIndex, "extendedImage", formData, USER_ACTION);
                }
            });
        };
    }

    _renderToolbar() {
        const container = this.options.container || this._getContainer();
        const $container = $(container).addClass(TOOLBAR_WRAPPER_CLASS);
        const toolbarItems = this._prepareToolbarItems();
        const $toolbar = $("<div>")
            .addClass(TOOLBAR_CLASS)
            .appendTo(container);

        eventsEngine.on($toolbar, addNamespace("mousedown", this._editorInstance.NAME), (e) => {
            e.preventDefault();
        });

        this.toolbarInstance = this._editorInstance._createComponent($toolbar, Toolbar, { dataSource: toolbarItems });

        this._editorInstance.on("disposing", () => {
            $container
                .empty()
                .removeClass(TOOLBAR_WRAPPER_CLASS);
        });
    }

    _getContainer() {
        const $container = $("<div>");

        this._editorInstance.$element().prepend($container);

        return $container;
    }

    _prepareToolbarItems() {
        let resultItems = [];

        each(this.options.items, (index, item) => {
            let newItem;
            if(isObject(item)) {
                newItem = this._handleObjectItem(item);
            } else if(isString(item)) {
                const buttonItemConfig = this._prepareButtonItemConfig(item);
                newItem = this._getToolbarItem(buttonItemConfig);
            }
            if(newItem) {
                resultItems.push(newItem);
            }
        });

        return resultItems;
    }

    _handleObjectItem(item) {
        if(item.formatName && item.formatValues && this._isAcceptableItem("dxSelectBox")) {
            const selectItemConfig = this._prepareSelectItemConfig(item);

            return this._getToolbarItem(selectItemConfig);
        } else if(item.formatName && this._isAcceptableItem("dxButton")) {
            const defaultButtonItemConfig = this._prepareButtonItemConfig(item.formatName);
            const buttonItemConfig = extend(true, defaultButtonItemConfig, item);

            return this._getToolbarItem(buttonItemConfig);
        } else {
            return this._getToolbarItem(item);
        }
    }

    _isAcceptableItem(item, acceptableWidgetName) {
        return !item.widget || item.widget === acceptableWidgetName;
    }

    _prepareButtonItemConfig(formatName) {
        const iconName = formatName === "clear" ? "clearformat" : formatName;
        const buttonText = titleize(formatName);

        return {
            widget: "dxButton",
            formatName: formatName,
            options: {
                hint: buttonText,
                text: buttonText,
                icon: iconName.toLowerCase(),
                onClick: this._formatHandlers[formatName] || this._getDefaultClickHandler(formatName),
                stylingMode: "text"
            },
            showText: "inMenu"
        };
    }

    _prepareSelectItemConfig(item) {
        return extend(true, {
            widget: "dxSelectBox",
            formatName: item.formatName,
            options: {
                stylingMode: "filled",
                dataSource: item.formatValues,
                placeholder: titleize(item.formatName),
                onValueChanged: (e) => {
                    if(!this._isReset) {
                        this.quill.format(item.formatName, e.value, USER_ACTION);
                    }
                }
            }
        }, item);
    }

    _prepareColorClickHandler(formatName) {
        return () => {
            const formData = this.quill.getFormat();
            const caption = formatName === "color" ? DIALOG_COLOR_CAPTION : DIALOG_BACKGROUND_CAPTION;
            this._editorInstance.formDialogOption("title", format(caption));
            const promise = this._editorInstance.showFormDialog({
                formData: formData,
                items: [{
                    dataField: formatName,
                    editorType: "dxColorView",
                    editorOptions: {
                        focusStateEnabled: false
                    },
                    label: { visible: false }
                }]
            });

            promise.done((formData) => {
                this.quill.format(formatName, formData[formatName], USER_ACTION);
            });
            promise.fail(() => {
                this.quill.focus();
            });
        };
    }

    _getToolbarItem(item) {
        const baseItem = {
            options: {
                onInitialized: (e) => {
                    if(item.formatName) {
                        e.component.$element().addClass(TOOLBAR_FORMAT_WIDGET_CLASS);
                        e.component.$element().toggleClass(`dx-${item.formatName.toLowerCase()}-format`, !!item.formatName);
                        this._formats[item.formatName] = e.component;
                    }
                }
            }
        };

        return extend(true, { location: "before", locateInMenu: "auto" }, this._getDefaultConfig(item.formatName), item, baseItem);
    }

    _getDefaultItemsConfig() {
        return {
            header: {
                options: {
                    displayExpr: (item) => {
                        const isHeaderValue = isDefined(item) && item !== false;
                        return isHeaderValue ? `${HEADING_TEXT} ${item}` : NORMAL_TEXT;
                    }
                }
            },
            clear: {
                options: {
                    disabled: true
                }
            },
            undo: {
                options: {
                    disabled: true
                }
            },
            redo: {
                options: {
                    disabled: true
                }
            },
            separator: {
                template: (data, index, element) => {
                    $(element).addClass(TOOLBAR_SEPARATOR_CLASS);
                },
                menuItemTemplate: (data, index, element) => {
                    $(element).addClass(TOOLBAR_MENU_SEPARATOR_CLASS);
                }
            }
        };
    }

    _getDefaultConfig(formatName) {
        return this._getDefaultItemsConfig()[formatName];
    }

    updateHistoryWidgets() {
        const historyModule = this.quill.history;

        if(!historyModule) {
            return;
        }

        const undoOps = historyModule.stack.undo;
        const redoOps = historyModule.stack.redo;

        this._updateHistoryWidget(this._formats["undo"], undoOps);
        this._updateHistoryWidget(this._formats["redo"], redoOps);
    }

    _updateHistoryWidget(widget, operations) {
        if(!widget) {
            return;
        }

        widget.option("disabled", !operations.length);
    }

    updateFormatWidgets(isResetRequired) {
        const selection = this.quill.getSelection();
        if(!selection) {
            return;
        }

        const formats = this.quill.getFormat(selection);
        const hasFormats = !isEmptyObject(formats);

        if(!hasFormats || isResetRequired) {
            this._resetFormatWidgets();
        }

        for(const formatName in formats) {
            const widgetName = this._getFormatWidgetName(formatName, formats);
            const formatWidget = this._formats[widgetName] || this._formats[formatName];

            if(!formatWidget) {
                continue;
            }

            this._markActiveFormatWidget(formatName, formatWidget, formats);
        }

        this._toggleClearFormatting(hasFormats);
    }

    _markActiveFormatWidget(name, widget, formats) {
        if(this._isColorFormat(name)) {
            this._updateColorWidget(name, formats[name]);
        }

        if(widget.option("value") === undefined) {
            widget.$element().addClass(ACTIVE_FORMAT_CLASS);
        } else {
            this._setValueSilent(widget, formats[name]);
        }
    }

    _toggleClearFormatting(hasFormats) {
        if(this._formats.clear) {
            this._formats.clear.option("disabled", !hasFormats);
        }
    }

    _isColorFormat(formatName) {
        return formatName === "color" || formatName === "background";
    }

    _updateColorWidget(formatName, color) {
        const formatWidget = this._formats[formatName];
        if(!formatWidget) {
            return;
        }

        formatWidget
            .$element()
            .find(`.${ICON_CLASS}`)
            .css("borderBottomColor", color || "transparent");
    }

    _getFormatWidgetName(formatName, formats) {
        let widgetName;
        switch(formatName) {
            case "align":
                widgetName = formatName + titleize(formats[formatName]);
                break;
            case "list":
                widgetName = formats[formatName] + titleize(formatName);
                break;
            case "code-block":
                widgetName = "codeBlock";
                break;
            case "script":
                widgetName = formats[formatName] + formatName;
                break;
            default:
                widgetName = formatName;
        }

        return widgetName;
    }

    _setValueSilent(widget, value) {
        this._isReset = true;
        widget.option("value", value);
        this._isReset = false;
    }

    _resetFormatWidgets() {
        each(this._formats, (name, widget) => {
            this._resetFormatWidget(name, widget);
        });
    }

    _resetFormatWidget(name, widget) {
        widget.$element().removeClass(ACTIVE_FORMAT_CLASS);

        if(this._isColorFormat(name)) {
            this._updateColorWidget(name);
        }
        if(name === "clear") {
            widget.option("disabled", true);
        }
        if(widget.NAME === "dxSelectBox") {
            this._setValueSilent(widget, null);
        }
    }

    addClickHandler(formatName, handler) {
        this._formatHandlers[formatName] = handler;
        const formatWidget = this._formats[formatName];
        if(formatWidget && formatWidget.NAME === "dxButton") {
            formatWidget.option("onClick", handler);
        }
    }
}

export default ToolbarModule;
