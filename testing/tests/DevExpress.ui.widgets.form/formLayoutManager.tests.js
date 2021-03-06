var $ = require("jquery"),
    internals = require("ui/form/ui.form.layout_manager").__internals;

require("ui/switch");
require("ui/lookup");
require("ui/text_area");
require("ui/radio_group");

require("common.css!");

QUnit.testStart(function() {
    var markup =
        '<div id="container"></div>';

    $("#qunit-fixture").html(markup);
});

QUnit.module("Layout manager");

QUnit.test("Layout strategy when flex is not supported", function(assert) {
    // arrange, act
    var items = [
        {
            dataField: "test1",
            editorType: "dxTextBox"
        },
        {
            dataField: "test2",
            editorType: "dxTextBox",
            helpText: "help"
        },
        {
            dataField: "test3",
            editorType: "dxRadioGroup"
        },
        {
            dataField: "test4",
            editorType: "dxCalendar"
        },
        {
            dataField: "test5",
            editorType: "dxTextArea"
        }
        ],
        $testContainer = $("#container").dxLayoutManager(),
        layoutManager = $testContainer.dxLayoutManager("instance");

    // act
    layoutManager._hasBrowserFlex = function() {
        return false;
    };
    layoutManager.option("items", items);

    // assert
    assert.equal(layoutManager._responsiveBox.option("_layoutStrategy"), "fallback");
    assert.equal($testContainer.find("." + internals.FIELD_ITEM_CLASS + "." + internals.FLEX_LAYOUT_CLASS).length, 0, "flex layout class");
});

QUnit.test("Layout strategy when flex is supported", function(assert) {
    // arrange, act
    var items = [
        {
            dataField: "test1",
            editorType: "dxTextBox"
        },
        {
            dataField: "test2",
            editorType: "dxTextBox",
            helpText: "help"
        },
        {
            dataField: "test3",
            editorType: "dxRadioGroup"
        },
        {
            dataField: "test4",
            editorType: "dxCalendar"
        },
        {
            dataField: "test5",
            editorType: "dxTextArea"
        }
        ],
        $testContainer = $("#container").dxLayoutManager(),
        layoutManager = $testContainer.dxLayoutManager("instance");

    // act
    layoutManager._hasBrowserFlex = function() {
        return true;
    };
    layoutManager.option("items", items);

    // assert
    assert.equal(layoutManager._responsiveBox.option("_layoutStrategy"), "flex");
    assert.equal($testContainer.find("." + internals.FIELD_ITEM_CLASS + "." + internals.FLEX_LAYOUT_CLASS).length, 5, "flex layout class");
});

QUnit.test("Check label alignment classes when browser is not supported flex", function(assert) {
    // arrange, act
    var items = [
        {
            dataField: "test1",
            editorType: "dxTextBox"
        },
        {
            dataField: "test2",
            editorType: "dxTextBox",
            helpText: "help"
        },
        {
            dataField: "test3",
            editorType: "dxRadioGroup"
        },
        {
            dataField: "test4",
            editorType: "dxCalendar"
        },
        {
            dataField: "test5",
            editorType: "dxTextArea"
        }
        ],
        $testContainer = $("#container").dxLayoutManager(),
        layoutManager = $testContainer.dxLayoutManager("instance"),
        $items;

    // act
    layoutManager._hasBrowserFlex = function() {
        return false;
    };
    layoutManager.option("items", items);
    $items = $testContainer.find("." + internals.FIELD_ITEM_CLASS);

    // assert
    assert.ok(!$items.eq(0).hasClass(internals.FIELD_ITEM_LABEL_ALIGN_CLASS), "item doesn't have baseline alignment class");
    assert.ok($items.eq(1).hasClass(internals.FIELD_ITEM_LABEL_ALIGN_CLASS), "item have baseline alignment class");
    assert.ok($items.eq(2).hasClass(internals.FIELD_ITEM_LABEL_ALIGN_CLASS), "item have baseline alignment class");
    assert.ok($items.eq(3).hasClass(internals.FIELD_ITEM_LABEL_ALIGN_CLASS), "item have baseline alignment class");
    assert.ok($items.eq(4).hasClass(internals.FIELD_ITEM_LABEL_ALIGN_CLASS), "item have baseline alignment class");
});

QUnit.test("Check clickable fielditem", function(assert) {
    // arrange
    var clock = sinon.useFakeTimers(),
        $testContainer = $("#container").dxLayoutManager({
            items: [
                {
                    dataField: "isRich",
                    editorType: "dxSwitch",
                    editorOptions: { value: false }
                },
                {
                    dataField: "hasMansion",
                    editorType: "dxCheckBox",
                    editorOptions: { value: false }
                }
            ]
        }),
        $fieldItemLabels = $testContainer.find("." + internals.FIELD_ITEM_LABEL_CLASS),
        instance = $testContainer.dxLayoutManager("instance");

    // act
    assert.deepEqual(instance.option("layoutData"), { isRich: false, hasMansion: false }, "Correct initial data");

    $($fieldItemLabels.eq(0)).trigger("dxclick");
    clock.tick();

    $($fieldItemLabels.eq(1)).trigger("dxclick");
    clock.tick(200);

    // assert
    assert.deepEqual(instance.option("layoutData"), { isRich: true, hasMansion: true }, "Correct data");
    clock.restore();
});

QUnit.test("Generate several various widgets in layout", function(assert) {
    // arrange, act
    var $testContainer = $("#container").dxLayoutManager({
            items: [
                {
                    label: { text: "label1" },
                    dataField: "name",
                    editorType: "dxTextBox"
                },
                {
                    label: { text: "label2" },
                    dataField: "name",
                    editorType: "dxNumberBox"
                },
                {
                    label: { text: "label3" },
                    dataField: "name",
                    editorType: "dxDateBox"
                }
            ]
        }),
        $fieldItems = $testContainer.find("." + internals.FIELD_ITEM_CLASS),
        $dateBox = $fieldItems.eq(2).find(".dx-datebox");


    // assert
    assert.ok($fieldItems.eq(0).find(".dx-textbox").length, "First item is dxTextBox");
    assert.ok($fieldItems.eq(1).find(".dx-numberbox").length, "Second item is dxNumberBox");
    assert.ok($dateBox.length, "Third item is dxDateBox");
    assert.ok($dateBox.width() < $fieldItems.eq(2).width(), "dxDateBox width");
});


QUnit.test("Editors with object value correctly work with values from data", function(assert) {
    // arrange, act
    var layoutManager,
        $testContainer = $("#container"),
        items = [
            { myText: "test1", number: 1 },
            { myText: "test2", number: 2 },
            { myText: "test3", number: 3 }
        ];

    layoutManager = $testContainer.dxLayoutManager({
        layoutData: { testItem: items[1] },
        items: [
            {
                dataField: "testItem",
                editorType: "dxLookup",
                editorOptions: {
                    items: items,
                    displayExpr: "myText"
                }
            }
        ]
    }).dxLayoutManager("instance");

    var lookupCurrentItemText = layoutManager.$element().find(".dx-lookup-field").text();

    // assert
    assert.equal(lookupCurrentItemText, "test2", "lookup has correct current item");
});

QUnit.test("Change a layoutData object", function(assert) {
    // arrange
    var $editors,
        layoutManager,
        $testContainer = $("#container");

    layoutManager = $testContainer.dxLayoutManager({
        layoutData: {
            name: "Patti",
            active: true,
            price: 1200,
            birthDate: new Date("10/10/2010")
        },
        customizeItem: function(item) {
            if(item.dataField === "active") {
                item.editorType = "dxSwitch";
            }
        }
    }).dxLayoutManager("instance");

    // act
    layoutManager.option("layoutData", {
        name: "Vadim",
        active: null,
        price: 450,
        birthDate: new Date("1/1/2001")
    });

    $editors = $testContainer.find(".dx-texteditor, .dx-switch");

    // assert
    assert.equal($editors.eq(0).dxTextBox("instance").option("value"), "Vadim");
    assert.equal($editors.eq(1).dxSwitch("instance").option("value"), false);
    assert.equal($editors.eq(2).dxNumberBox("instance").option("value"), 450);
    assert.deepEqual($editors.eq(3).dxDateBox("instance").option("value"), new Date("1/1/2001"));
});

function triggerKeyUp($element, keyCode) {
    var e = $.Event("keyup");
    e.which = keyCode;
    $($element.find("input").first()).trigger(e);
}

QUnit.test("onEditorEnterKey", function(assert) {
    // arrange
    var testArgs,
        editor,
        layoutManager;

    layoutManager = $("#container").dxLayoutManager({
        layoutData: {
            name: "Test Name",
            profession: "Test profession"
        },
        onEditorEnterKey: function(args) {
            testArgs = args;
        }
    }).dxLayoutManager("instance");

    // act
    editor = layoutManager.getEditor("profession");
    triggerKeyUp(editor.$element(), 13);

    // assert
    assert.notEqual(testArgs.component, undefined, "component");
    assert.notEqual(testArgs.element, undefined, "element");
    assert.notEqual(testArgs.event, undefined, "Event");
    assert.equal(testArgs.dataField, "profession", "dataField");
    assert.equal(testArgs.component.NAME, "dxLayoutManager", "correct component");

    // act
    editor = layoutManager.getEditor("name");
    triggerKeyUp(editor.$element(), 13);

    // assert
    assert.notEqual(testArgs.component, undefined, "component");
    assert.notEqual(testArgs.element, undefined, "element");
    assert.notEqual(testArgs.event, undefined, "Event");
    assert.equal(testArgs.dataField, "name", "dataField");
});


QUnit.module("Render multiple columns");

QUnit.test("Change from fixed colCount to auto and vice versa", function(assert) {
    // arrange
    var $testContainer = $("#container").width(450);

    $testContainer.dxLayoutManager({
        layoutData: { test1: "abc", test2: "qwe", test3: "xyz" },
        colCount: 1,
        minColWidth: 200
    });

    // act
    var instance = $testContainer.dxLayoutManager("instance");

    // assert
    assert.equal(instance._getColCount(), 1, "We have only 1 column");

    instance.option("colCount", "auto");
    assert.equal(instance._getColCount(), 2, "We have only 2 columns");

    instance.option("colCount", 3);
    assert.equal(instance._getColCount(), 3, "We have only 3 columns");
});
