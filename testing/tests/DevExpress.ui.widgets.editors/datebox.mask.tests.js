import $ from "jquery";
import { renderDateParts, getDatePartIndexByPosition } from "ui/date_box/ui.date_box.mask.parts";
import { noop } from "core/utils/common";
import pointerMock from "../../helpers/pointerMock.js";
import "ui/date_box";
import keyboardMock from "../../helpers/keyboardMock.js";
import devices from "core/devices";

QUnit.testStart(() => {
    $("#qunit-fixture").html("<div id='dateBox'></div>");
});

if(devices.real().deviceType === "desktop") {
    let setupModule = {
        beforeEach: () => {
            this.parts = renderDateParts("Tuesday, July 2, 2024 16:19 PM", "EEEE, MMMM d, yyyy HH:mm a");
            this.$element = $("#dateBox").dxDateBox({
                value: new Date("10/10/2012 13:07"),
                useMaskBehavior: true,
                mode: "text",
                displayFormat: "MMMM d yyyy"
            });

            this.instance = this.$element.dxDateBox("instance");
            this.$input = this.$element.find(".dx-texteditor-input");
            this.keyboard = keyboardMock(this.$input, true);
            this.pointer = pointerMock(this.$input);
            this.clock = sinon.useFakeTimers();
        },

        afterEach: () => {
            this.clock.restore();
        }
    };

    QUnit.module("Rendering", setupModule, () => {
        QUnit.test("Text option should depend on the input value", (assert) => {
            this.keyboard.press("up");
            assert.equal(this.instance.option("text"), "November 10 2012", "text is correct");
        });

        QUnit.test("Masks should be enabled when displayFormat is not specified", (assert) => {
            this.instance.option("displayFormat", undefined);
            this.keyboard.press("up");
            assert.equal(this.instance.option("text"), "11/10/2012", "mask behavior works");
        });

        QUnit.test("Masks should not be enabled when mode is not text", (assert) => {
            this.instance.option("mode", "date");
            this.keyboard.press("up");
            assert.equal(this.instance.option("text"), "October 10 2012", "mask behavior does not work");
        });

        QUnit.test("Rendering with non-ldml format", (assert) => {
            this.instance.option("displayFormat", "shortdate");
            assert.equal(this.instance.option("text"), "10/10/2012", "format works");
        });
    });

    QUnit.module("Date parts rendering", setupModule, () => {
        let checkAndRemoveAccessors = (part, stub, assert) => {
            assert.equal(part.getter(), stub, "stub getter");
            assert.deepEqual(part.setter, noop, "stub setter");

            delete part.setter;
            delete part.getter;
            delete part.limits;
        };

        let checkAndRemoveLimits = (part, expected, assert) => {
            let limits = part.limits;
            assert.deepEqual(limits(new Date(2012, 1, 4, 5, 6)), expected, "limits for " + part.pattern);

            delete part.limits;
        };

        QUnit.test("Check parts length", (assert) => {
            assert.equal(this.parts.length, 15);
        });

        QUnit.test("Day of week", (assert) => {
            checkAndRemoveLimits(this.parts[0], { min: 0, max: 6 }, assert);

            let date = new Date(2012, 1, 4, 15, 6);
            this.parts[0].setter(date, 2);
            assert.equal(date.getDay(), 2, "setter sets day of week");
            delete this.parts[0].setter;

            assert.deepEqual(this.parts[0], {
                index: 0,
                isStub: false,
                caret: { start: 0, end: 7 },
                getter: "getDay",
                pattern: "EEEE",
                text: "Tuesday"
            });
        });

        QUnit.test("Month", (assert) => {
            checkAndRemoveLimits(this.parts[3], { min: 0, max: 11 }, assert);

            let date = new Date(2012, 2, 30);
            this.parts[3].setter(date, 1);
            assert.equal(date.getMonth(), 1, "setter sets month");
            delete this.parts[3].setter;

            assert.deepEqual(this.parts[3], {
                index: 3,
                isStub: false,
                caret: { start: 9, end: 13 },
                getter: "getMonth",
                pattern: "MMMM",
                text: "July"
            });
        });

        QUnit.test("Day", (assert) => {
            checkAndRemoveLimits(this.parts[5], { min: 1, max: 29 }, assert);

            assert.deepEqual(this.parts[5], {
                index: 5,
                isStub: false,
                caret: { start: 14, end: 15 },
                getter: "getDate",
                setter: "setDate",
                pattern: "d",
                text: "2"
            });
        });

        QUnit.test("Year", (assert) => {
            checkAndRemoveLimits(this.parts[8], { min: 0, max: 9999 }, assert);

            let date = new Date(2012, 1, 4, 15, 6);
            this.parts[8].setter(date, 15);
            assert.equal(date.getFullYear(), 2015, "setter sets AM");
            delete this.parts[8].setter;

            assert.deepEqual(this.parts[8], {
                index: 8,
                isStub: false,
                caret: { start: 17, end: 21 },
                getter: "getFullYear",
                pattern: "yyyy",
                text: "2024"
            });
        });

        QUnit.test("Hours", (assert) => {
            checkAndRemoveLimits(this.parts[10], { min: 0, max: 23 }, assert);

            assert.deepEqual(this.parts[10], {
                index: 10,
                isStub: false,
                caret: { start: 22, end: 24 },
                getter: "getHours",
                setter: "setHours",
                pattern: "HH",
                text: "16"
            });
        });

        QUnit.test("Minutes", (assert) => {
            checkAndRemoveLimits(this.parts[12], { min: 0, max: 59 }, assert);

            assert.deepEqual(this.parts[12], {
                index: 12,
                isStub: false,
                caret: { start: 25, end: 27 },
                getter: "getMinutes",
                setter: "setMinutes",
                pattern: "mm",
                text: "19"
            });
        });

        QUnit.test("Time indication", (assert) => {
            checkAndRemoveLimits(this.parts[14], { min: 0, max: 1 }, assert);

            let date = new Date(2012, 1, 4, 15, 6);

            let isPm = this.parts[14].getter(date);
            assert.equal(isPm, 1, "getter returns PM");
            delete this.parts[14].getter;

            this.parts[14].setter(date, 0);
            assert.equal(date.getHours(), 3, "setter sets AM");
            delete this.parts[14].setter;

            assert.deepEqual(this.parts[14], {
                index: 14,
                isStub: false,
                caret: { start: 28, end: 30 },
                pattern: "a",
                text: "PM"
            });
        });

        QUnit.test("Comma stub", (assert) => {
            checkAndRemoveAccessors(this.parts[1], ",", assert);

            assert.deepEqual(this.parts[1], {
                index: 1,
                isStub: true,
                caret: { start: 7, end: 8 },
                pattern: ",",
                text: ","
            });
        });

        QUnit.test("Space stub", (assert) => {
            checkAndRemoveAccessors(this.parts[2], "\\", assert);

            assert.deepEqual(this.parts[2], {
                index: 2,
                isStub: true,
                caret: { start: 8, end: 9 },
                pattern: "\\ ",
                text: " "
            });
        });

        QUnit.test("Colon stub", (assert) => {
            checkAndRemoveAccessors(this.parts[11], ":", assert);

            assert.deepEqual(this.parts[11], {
                index: 11,
                isStub: true,
                caret: { start: 24, end: 25 },
                pattern: ":",
                text: ":"
            });
        });
    });

    QUnit.module("Date parts find", setupModule, () => {
        QUnit.test("Find day of week", (assert) => {
            assert.equal(getDatePartIndexByPosition(this.parts, 0), 0, "start position of the group");
            assert.equal(getDatePartIndexByPosition(this.parts, 3), 0, "middle position of the group");
            assert.equal(getDatePartIndexByPosition(this.parts, 7), 0, "end position of the group");
        });

        QUnit.test("Find month", (assert) => {
            assert.equal(getDatePartIndexByPosition(this.parts, 9), 3, "start position of the group");
            assert.equal(getDatePartIndexByPosition(this.parts, 10), 3, "middle position of the group");
            assert.equal(getDatePartIndexByPosition(this.parts, 13), 3, "end position of the group");
        });

        QUnit.test("Find day", (assert) => {
            assert.equal(getDatePartIndexByPosition(this.parts, 14), 5, "start position of the group");
            assert.equal(getDatePartIndexByPosition(this.parts, 15), 5, "end position of the group");
        });

        QUnit.test("Find year", (assert) => {
            assert.equal(getDatePartIndexByPosition(this.parts, 17), 8, "start position of the group");
            assert.equal(getDatePartIndexByPosition(this.parts, 19), 8, "middle position of the group");
            assert.equal(getDatePartIndexByPosition(this.parts, 21), 8, "end position of the group");
        });

        QUnit.test("Find hours", (assert) => {
            assert.equal(getDatePartIndexByPosition(this.parts, 22), 10, "start position of the group");
            assert.equal(getDatePartIndexByPosition(this.parts, 23), 10, "middle position of the group");
            assert.equal(getDatePartIndexByPosition(this.parts, 24), 10, "end position of the group");
        });

        QUnit.test("Find minutes", (assert) => {
            assert.equal(getDatePartIndexByPosition(this.parts, 25), 12, "start position of the group");
            assert.equal(getDatePartIndexByPosition(this.parts, 26), 12, "middle position of the group");
            assert.equal(getDatePartIndexByPosition(this.parts, 27), 12, "end position of the group");
        });

        QUnit.test("Find time indicator", (assert) => {
            assert.equal(getDatePartIndexByPosition(this.parts, 28), 14, "start position of the group");
            assert.equal(getDatePartIndexByPosition(this.parts, 29), 14, "middle position of the group");
            assert.equal(getDatePartIndexByPosition(this.parts, 30), 14, "end position of the group");
        });
    });

    QUnit.module("Keyboard navigation", setupModule, () => {
        QUnit.test("RegisterKeyHandler should work", (assert) => {
            const handler = sinon.spy();
            this.instance.registerKeyHandler("del", handler);

            this.keyboard.press("del");
            assert.equal(handler.callCount, 1, "registerKeyHandler works");
        });

        QUnit.test("Right and left arrows should move the selection", (assert) => {
            this.keyboard.press("right");
            assert.deepEqual(this.keyboard.caret(), { start: 8, end: 10 }, "next group is selected");

            this.keyboard.press("left");
            assert.deepEqual(this.keyboard.caret(), { start: 0, end: 7 }, "previous group is selected");
        });

        QUnit.test("Home and end keys should move selection to boundaries", (assert) => {
            this.keyboard.focus();
            this.keyboard.press("end");
            assert.deepEqual(this.keyboard.caret(), { start: 11, end: 15 }, "last group is selected");

            this.keyboard.press("home");
            assert.deepEqual(this.keyboard.caret(), { start: 0, end: 7 }, "first group is selected");
        });

        QUnit.test("Up and down arrows should increase and decrease current group value", (assert) => {
            const groups = [
                { pattern: "EEEE", up: "Thursday", down: "Wednesday" },
                { pattern: "d", up: "11", down: "10" },
                { pattern: "MMMM", up: "November", down: "October" },
                { pattern: "yyyy", up: "2013", down: "2012" },
                { pattern: "HH", up: "14", down: "13" },
                { pattern: "mm", up: "08", down: "07" }
            ];

            assert.equal(this.$input.val(), "October 10 2012", "initial value is correct");

            groups.forEach(function(group) {
                this.instance.option("displayFormat", group.pattern);

                this.keyboard.press("up");
                assert.equal(this.$input.val(), group.up, "group '" + group.pattern + "' increased");

                this.keyboard.press("down");
                assert.equal(this.$input.val(), group.down, "group '" + group.pattern + "' decreased");
            }.bind(this));
        });

        QUnit.test("Month changing should adjust days to limits", (assert) => {
            this.instance.option("value", new Date(2018, 2, 30));
            assert.equal(this.$input.val(), "March 30 2018", "initial text is correct");

            this.keyboard.press("down");
            assert.equal(this.$input.val(), "February 28 2018", "text is correct");
        });

        QUnit.test("Esc should restore the value", (assert) => {
            this.keyboard.press("up");
            assert.equal(this.$input.val(), "November 10 2012", "text was changed");
            assert.equal(this.instance.option("value").getMonth(), 9, "month did not changed in the value");

            this.keyboard.press("esc");
            assert.equal(this.$input.val(), "October 10 2012", "text was reverted");
        });

        QUnit.test("Enter should commit the value", (assert) => {
            this.keyboard.press("up");
            assert.equal(this.instance.option("value").getMonth(), 9, "month did not changed in the value");

            this.keyboard.press("enter");
            assert.equal(this.instance.option("value").getMonth(), 10, "November 10 2012", "month was changed in the value");

            this.keyboard.press("down");
            assert.equal(this.$input.val(), "November 9 2012", "text was changed");
            assert.equal(this.instance.option("value").getDate(), 10, "day did not changed in the value after commit");
        });

        QUnit.test("Mask should not catch arrows on opened dateBox", (assert) => {
            this.instance.open();
            this.keyboard.press("up");
            this.keyboard.press("right");
            this.keyboard.press("down");
            assert.equal(this.$input.val(), "October 10 2012", "text was not changed");
        });

        QUnit.test("Mask should catch char input on opened dateBox", (assert) => {
            this.instance.open();
            this.keyboard.type("3");
            assert.equal(this.$input.val(), "March 10 2012", "text has been changed");
        });

        QUnit.test("alt+down should open dxDateBox", (assert) => {
            this.keyboard.keyDown("down", { altKey: true });
            assert.ok(this.instance.option("opened"), "datebox is opened");
        });

        QUnit.test("delete should revert group to initial value and go to the next one", (assert) => {
            this.keyboard.press("up");
            assert.equal(this.instance.option("text"), "November 10 2012", "text has been changed");

            this.keyboard.press("del");

            assert.equal(this.instance.option("text"), "October 10 2012", "text is correct");
            assert.deepEqual(this.keyboard.caret(), { start: 8, end: 10 }, "caret is good");
        });

        QUnit.test("delete should not revert a part when the value is null", (assert) => {
            this.instance.option({
                displayFormat: "MMM yyyy",
                value: null
            });
            this.keyboard.press("up");

            let text = this.instance.option("text");
            assert.ok(this.instance.option("text"), "text has been rendered");

            this.keyboard.press("del");
            assert.equal(this.instance.option("text"), text, "text has not been changed");
            assert.deepEqual(this.keyboard.caret(), { start: 4, end: 8 }, "next group is selected");
        });

        QUnit.test("backspace should revert group to initial value and go to the previous one", (assert) => {
            this.keyboard.press("right");
            this.keyboard.press("up");
            assert.equal(this.instance.option("text"), "October 11 2012", "text has been changed");

            this.keyboard.press("backspace");

            assert.equal(this.instance.option("text"), "October 10 2012", "text is correct");
            assert.deepEqual(this.keyboard.caret(), { start: 0, end: 7 }, "caret is good");
        });

        QUnit.test("removing all text should be possible", (assert) => {
            this.keyboard
                .caret({ start: 0, end: 15 })
                .press("del")
                .change();

            assert.equal(this.instance.option("text"), "", "text has been changed");
            assert.equal(this.instance.option("value"), null, "value has been cleared");
        });

        QUnit.test("focusout should clear search value", (assert) => {
            this.keyboard.type("1");
            assert.equal(this.instance.option("text"), "January 10 2012", "text has been changed");

            this.$input.trigger("focusout");
            this.keyboard.type("2");
            assert.equal(this.instance.option("text"), "January 2 2012", "search value was cleared");
            assert.deepEqual(this.keyboard.caret(), { start: 8, end: 9 }, "next group has been selected");
        });

        QUnit.test("enter should clear search value", (assert) => {
            this.keyboard.type("1");
            assert.equal(this.instance.option("text"), "January 10 2012", "text has been changed");

            this.keyboard.press("enter");
            this.keyboard.type("2");
            assert.equal(this.instance.option("text"), "January 2 2012", "search value was cleared");
            assert.deepEqual(this.keyboard.caret(), { start: 8, end: 9 }, "next group has been selected");
        });

        QUnit.test("incorrect input should clear search value", (assert) => {
            this.keyboard.type("jqwed");
            assert.equal(this.instance.option("text"), "December 10 2012", "text has been changed");
        });
    });

    QUnit.module("Events", setupModule, () => {
        QUnit.test("Select date part on click", (assert) => {
            this.keyboard.caret(9);
            this.$input.trigger("dxclick");

            assert.deepEqual(this.keyboard.caret(), { start: 8, end: 10 }, "caret position is good");
        });

        QUnit.test("Increment and decrement date part by mouse wheel", (assert) => {
            this.pointer.wheel(10);
            assert.equal(this.$input.val(), "November 10 2012", "increment works");

            this.pointer.wheel(-10);
            assert.equal(this.$input.val(), "October 10 2012", "decrement works");
        });

        QUnit.test("it should not be possible to drag text in the editor", (assert) => {
            this.keyboard.type("3");
            assert.equal(this.$input.val(), "March 10 2012", "text has been changed");

            this.$input.trigger("drop");
            assert.equal(this.$input.val(), "March 10 2012", "text has not reverted");
            assert.deepEqual(this.keyboard.caret(), { start: 6, end: 8 }, "caret is good");
        });

        QUnit.test("paste should be possible when pasting data matches the format", (assert) => {
            this.instance.option("value", null);

            this.keyboard.paste("123456");
            assert.equal(this.$input.val(), "", "pasting incorrect value is not allowed");

            this.keyboard.paste("November 10 2018");
            assert.equal(this.$input.val(), "November 10 2018", "pasting correct value is allowed");
        });
    });


    QUnit.module("Search", setupModule, () => {
        QUnit.test("Time indication", (assert) => {
            this.instance.option("displayFormat", "a");

            this.keyboard.type("a");
            assert.equal(this.$input.val(), "AM", "select on typing");

            this.keyboard.type("p");
            assert.equal(this.$input.val(), "PM", "revert incorrect changes");
        });

        QUnit.test("Hour", (assert) => {
            this.instance.option("displayFormat", "hh");

            this.keyboard.type("31");
            assert.equal(this.$input.val(), "01", "don't accept out-of-limit values");

            this.keyboard.type("2");
            assert.equal(this.$input.val(), "12", "set new value");
        });

        QUnit.test("Day of week", (assert) => {
            this.instance.option("displayFormat", "EEEE");

            this.keyboard.type("monda");
            assert.equal(this.$input.val(), "Monday", "select on typing");

            this.keyboard.type("s");
            assert.equal(this.$input.val(), "Saturday", "revert incorrect changes");
        });

        QUnit.test("Day of week by a number", (assert) => {
            this.instance.option("displayFormat", "EEEE");

            this.keyboard.type("0");
            assert.equal(this.$input.val(), "Sunday", "week starts from the Sunday");

            this.keyboard.type("6");
            assert.equal(this.$input.val(), "Saturday", "week ends at the Saturday");

            this.keyboard.type("7");
            assert.equal(this.$input.val(), "Saturday", "out-of-limit values does not supported");
        });

        QUnit.test("Day", (assert) => {
            this.instance.option("displayFormat", "MMM, dd");

            this.keyboard
                .type("feb")
                .press("right")
                .type("3");

            assert.equal(this.$input.val(), "Feb, 03", "select on typing");

            this.keyboard.type("1");
            assert.equal(this.$input.val(), "Feb, 01", "don't accept out-of-limit values");
        });

        QUnit.test("Month", (assert) => {
            this.instance.option("displayFormat", "MMMM");

            this.keyboard.type("janu");
            assert.equal(this.$input.val(), "January", "select on typing");

            this.clock.tick(1);
            this.keyboard.type("d");
            assert.equal(this.$input.val(), "December", "revert incorrect chars");
        });

        QUnit.test("Short month", (assert) => {
            this.instance.option("displayFormat", "MMM");

            this.keyboard.type("jan");
            assert.equal(this.$input.val(), "Jan", "select on typing");

            this.keyboard.type("d");
            assert.equal(this.$input.val(), "Dec", "revert incorrect chars");
        });

        QUnit.test("Month by a number", (assert) => {
            this.instance.option("displayFormat", "MMMM");

            this.keyboard.type("1");
            assert.equal(this.$input.val(), "January");

            this.keyboard.type("30");
            assert.equal(this.$input.val(), "January");
        });

        QUnit.test("Year", (assert) => {
            this.instance.option("displayFormat", "yyyy");

            this.keyboard
                .type("99991");

            assert.equal(this.$input.val(), "9991", "year should be limited");
        });

        QUnit.test("Short Year", (assert) => {
            this.instance.option({
                value: new Date(1990, 4, 2),
                displayFormat: "yy"
            });

            this.keyboard
                .type("21")
                .press("enter");

            assert.equal(this.instance.option("value").getFullYear(), 1921, "only 2 last digits of the year should be changed");
        });

        QUnit.test("Hotkeys should not be handled by the search", (assert) => {
            this.instance.option("displayFormat", "EEEE");

            this.keyboard.keyDown("s", { altKey: true });
            assert.equal(this.$input.val(), "Wednesday", "alt was not handled");

            this.keyboard.keyDown("s", { ctrlKey: true });
            assert.equal(this.$input.val(), "Wednesday", "ctrl was not handled");
        });

        QUnit.test("Typing a letter in the year section should not lead to an infinite loop", (assert) => {
            this.instance.option("displayFormat", "yyyy");

            sinon.stub(this.instance, "_partIncrease").throws();

            try {
                this.keyboard.type("s");
                assert.equal(this.$input.val(), "2012", "year was not changed");
            } catch(e) {
                assert.notOk(true, "Infinite loop detected");
            }
        });
    });

    QUnit.module("Empty dateBox", {
        beforeEach: () => {
            this.$element = $("#dateBox").dxDateBox({
                value: null,
                useMaskBehavior: true,
                mode: "text",
                displayFormat: "MMMM d yyyy"
            });

            this.instance = this.$element.dxDateBox("instance");
            this.$input = this.$element.find(".dx-texteditor-input");
            this.keyboard = keyboardMock(this.$input, true);
            this.pointer = pointerMock(this.$input);

            this.dateStub = sinon.useFakeTimers(new Date(2015, 3, 14).getTime());
        },
        afterEach: () => {
            this.dateStub.restore();
        }
    }, () => {
        QUnit.test("Current date should be rendered on first input", (assert) => {
            this.keyboard.type("1");
            assert.equal(this.$input.val(), "January 14 2015", "first part was changed, other parts is from the current date");
        });

        QUnit.test("Bluring the input after first input should update the value", (assert) => {
            this.keyboard.type("1");
            this.$input.trigger("focusout");

            assert.equal(this.$input.val(), "January 14 2015", "text is correct");
            assert.equal(this.instance.option("value").getMonth(), 0, "value is correct");
        });

        QUnit.test("Clear button should work", (assert) => {
            this.instance.option({
                showClearButton: true,
                value: new Date(2018, 6, 19)
            });

            assert.equal(this.$input.val(), "July 19 2018", "initial value is correct");

            this.$element.find(".dx-clear-button-area").trigger("dxclick");

            assert.equal(this.$input.val(), "", "text was cleared");
            assert.equal(this.instance.option("value"), null, "value was cleared");

            this.$input.trigger("change");

            assert.equal(this.$input.val(), "", "text is still cleared");
            assert.equal(this.instance.option("value"), null, "value is still cleared");

            this.keyboard.type("1");
            assert.equal(this.$input.val(), "January 14 2015", "text is correct after clearing");
        });

        QUnit.test("Incorrect search on empty input should render current date", (assert) => {
            this.keyboard.type("qq");

            assert.equal(this.$input.val(), "April 14 2015", "text is correct");
            assert.equal(this.instance.option("value"), null, "value is correct");
        });

        QUnit.test("focus and blur empty input should not change it's value", (assert) => {
            this.$input.trigger("focusin");
            this.$input.trigger("focusout");

            assert.equal(this.$input.val(), "", "text is correct");
            assert.equal(this.instance.option("value"), null, "value is correct");
        });

        QUnit.test("focusing datebox by click should work", (assert) => {
            this.$input.trigger("dxclick");
            this.keyboard.type("2");

            assert.equal(this.$input.val(), "February 14 2015", "text is correct");
            assert.equal(this.instance.option("value"), null, "value is correct");
        });

        QUnit.test("focusing datebox by mousewheel should work", (assert) => {
            this.pointer.wheel(10);
            this.keyboard.type("2");

            assert.equal(this.$input.val(), "February 14 2015", "text is correct");
            assert.equal(this.instance.option("value"), null, "value is correct");
        });

        QUnit.test("moving between groups should work with empty dateBox", (assert) => {
            ["up", "down", "right", "left", "home", "end", "esc"].forEach((arrow) => {
                this.instance.option("value", null);
                this.keyboard.press(arrow);
                assert.ok(true, arrow + " key is good");
            });

            assert.equal(this.$input.val(), "", "text is correct");
            assert.equal(this.instance.option("value"), null, "value is correct");
        });

        QUnit.test("Short Year should use current date", (assert) => {
            this.instance.option({
                displayFormat: "yy"
            });

            let dateStart = new Date().getFullYear().toString().substr(0, 2);

            this.keyboard
                .type("21")
                .press("enter");

            assert.equal(this.instance.option("value").getFullYear(), dateStart + "21", "only 2 last digits of the year should be changed");
        });

        QUnit.test("Click and leave empty datebox should not change the value", (assert) => {
            this.instance.option({
                displayFormat: "yy",
                value: null
            });

            this.$input.trigger("dxclick");
            this.keyboard.press("enter");
            this.$input.trigger("focusout");

            assert.equal(this.$input.val(), "", "value is correct");
        });

        QUnit.test("navigation keys should do nothing in an empty datebox", (assert) => {
            this.keyboard.press("home");
            this.keyboard.press("end");
            this.keyboard.press("del");
            this.keyboard.press("backspace");
            this.keyboard.press("esc");
            this.keyboard.press("left");
            this.keyboard.press("right");
            this.keyboard.press("enter");

            assert.deepEqual(this.instance.option("value"), null, "value is good");
            assert.deepEqual(this.$input.val(), "", "text is good");
            assert.deepEqual(this.keyboard.caret(), { start: 0, end: 0 }, "caret is good");
        });
    });

    QUnit.module("Options changed", setupModule, () => {
        QUnit.test("The 'useMaskBehavior' option is changed to false", (assert) => {
            this.keyboard.caret(9);
            this.$input.trigger("dxclick");

            this.instance.option("useMaskBehavior", false);

            assert.notOk(this.instance._dateParts, "dateParts is undefined");
            assert.notOk(this.instance._activePartIndex, "activePartIndex is undefined");
            assert.notOk(this.instance._maskValue, "maskValue is undefined");

            this.keyboard.caret(9);
            this.$input.trigger("dxclick");

            assert.deepEqual(this.keyboard.caret(), { start: 9, end: 9 }, "caret is not changed");

            this.pointer.wheel(10);
            assert.equal(this.$input.val(), "October 10 2012", "date is not changed on mouse wheel");
        });

        QUnit.test("onValueChanged should have event", (assert) => {
            const valueChangedHandler = sinon.spy();

            this.instance.option({
                onValueChanged: valueChangedHandler
            });

            this.keyboard.press("up").press("enter");

            assert.equal(valueChangedHandler.callCount, 1, "handler has been called once");
            assert.equal(valueChangedHandler.getCall(0).args[0].event.type, "change", "event is correct");

            this.instance.option("value", new Date(2012, 4, 5));
            assert.equal(valueChangedHandler.callCount, 2, "handler has been called twice");
            assert.strictEqual(valueChangedHandler.getCall(1).args[0].event, undefined, "event has been cleared");
        });

        QUnit.test("It should be possible to set a value via calendar", (assert) => {
            this.instance.option({
                opened: true
            });

            this.keyboard.press("right").press("enter");
            assert.equal(this.$input.val(), "October 11 2012", "text is correct");
            assert.equal(this.instance.option("value").getDate(), 11, "value is correct");
            assert.deepEqual(this.keyboard.caret(), { start: 0, end: 7 }, "caret is good");
        });

        QUnit.test("Internal _maskValue and public value should be different objects", (assert) => {
            assert.ok(this.instance._maskValue !== this.instance.option("value"), "objects are different on init");

            this.instance.option("value", new Date(2012, 1, 2));
            assert.ok(this.instance._maskValue !== this.instance.option("value"), "objects are different when setting by value");

            this.keyboard.press("up").press("esc");
            assert.ok(this.instance._maskValue !== this.instance.option("value"), "objects are different after revert changes");

            this.keyboard.press("5").press("enter");
            assert.ok(this.instance._maskValue !== this.instance.option("value"), "objects are different after enter");

            this.keyboard.press("4");
            this.$input.trigger("focusout");
            assert.ok(this.instance._maskValue !== this.instance.option("value"), "objects are different after focusout");

            this.keyboard.press("7").change();
            assert.ok(this.instance._maskValue !== this.instance.option("value"), "objects are different after change event");
        });
    });

    QUnit.module("Advanced caret", setupModule, () => {
        QUnit.test("Move caret to the next group", (assert) => {
            this.instance.option({
                advanceCaret: true,
                displayFormat: "dd.MM"
            });

            this.keyboard.type("15");

            assert.deepEqual(this.keyboard.caret(), { start: 3, end: 5 }, "caret was moved");
        });

        QUnit.test("Move caret to the next group when next digit will overflow", (assert) => {
            this.instance.option({
                advanceCaret: true,
                displayFormat: "MM.dd"
            });

            this.keyboard.type("5");

            assert.deepEqual(this.keyboard.caret(), { start: 3, end: 5 }, "caret was moved");
        });

        QUnit.test("Move caret to the next group after limit overflow", (assert) => {
            this.instance.option({
                advanceCaret: true,
                displayFormat: "dd.MM"
            });

            this.keyboard.type("38");
            assert.deepEqual(this.keyboard.caret(), { start: 3, end: 5 }, "caret was not moved");
        });
    });
}
