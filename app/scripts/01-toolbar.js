'use strict';
console.log('01-toolbar.js');
(function() {
    String.prototype.parseValue = function(value) {
        return this.replace(/%{value}/,value);
    };

    var monkey = window.monkey;

    // Set toolbars to be displayed
    monkey.toolbar = {
        options: {
            toolbar: {
                selector: '[data-role=editor-toolbar]',
                commandKey: 'data-edit',
                actionKey: 'data-action',
                activeClass: 'active',
                disabledClass: 'disabled',
                enableOnCodeviewSelector: '[data-enable-codeview]',
                commandBtnSelector: 'a[data-edit],button[data-edit],input[type=button][data-edit]',
                keydownTriggerInputSelector: 'input[type=text],input[type=number]',
                changeTriggerInputSelector: 'input[type=color]',
                fileSelector: 'input[type=file]',
                actionBtnSelector: 'a[data-action],button[data-action],input[type=button][data-action]',
            },
        },

        callbacks: {
            beforeInitialize: [],
        },

        actions: {
            codeview: function () {
                var mk = this.mk;
                if (mk.activeView === mk.editor) {
                    mk.switchView(mk.codeview);
                } else {
                    mk.switchView(mk.editor);
                }
            },
            setCss: function (cssStr) {
                var mk = this.mk,
                    target = mk.divSelector.lastSelectedTarget;

                $(mk.divSelector.lastSelectedTarget).css(JSON.parse(cssStr));

                mk.divSelector.triggerSelect(target);
            },
            fullscreen: function () {
                this.mk.toggleFullscreen(!this.mk.fullscreen);
            },
            fontSize: function (size) {
                var sel= window.getSelection(),
                    text = sel.toString(),
                    rng = sel.getRangeAt(0),
                    parent = rng.commonAncestorContainer;

                if (parent.nodeType !== 1) {
                    parent = parent.parentNode;
                }

                if (!sel.isCollapsed) {
                    var $parent = $(parent);
                    if ($parent.text().trim() === text.trim()) {
                        $parent.css({
                            'font-size': size,
                        });
                        $parent.children('span').each(function() {
                            var $this = $(this);
                            $this.css({'font-size': ''});
                            if ($this.styles.length === 0) {
                                $this.after($this.contents());
                                $this.remove();
                            }
                        });
                    } else {
                        var $span = $('<span>')
                        .append(text)
                        .css({'font-size': size});

                        rng.deleteContents();
                        rng.insertNode($span[0]);
                    }
                }
            },
        },

        bindings: {
            btnClick: function () {
                var $this = $(this),
                    mk = $this.data('monkey-editor'),
                    command = $this.attr(mk.options.toolbar.commandKey),
                    action = $this.attr(mk.options.toolbar.actionKey);

                mk.toolbar.processCommandOrAction(command,action);
            },
            inputClick: function(e) {
                e.preventDefault();
                return false;
            },
            inputFocus: function() {
            },
            inputBlur: function() {
                var $this = $(this),
                    mk = $this.data('monkey-editor'),
                    editor = mk.editor;
                editor.restoreSelection();
            },
            inputChange: function(e) {
                var $this = $(this),
                    mk = $this.data('monkey-editor'),
                    command = $this.attr(mk.options.toolbar.commandKey),
                    action = $this.attr(mk.options.toolbar.actionKey);

                if (!!command) {
                    command = command.parseValue($this.val());
                }
                if (!!action) {
                    action = action.parseValue($this.val());
                }
                mk.toolbar.processCommandOrAction(command, action);
            },
            inputKeydown: function(e) {
                var $this = $(this),
                    mk = $this.data('monkey-editor'),
                    command = $this.attr(mk.options.toolbar.commandKey),
                    action = $this.attr(mk.options.toolbar.actionKey);

                /* Return key */
                if (e.keyCode === 13) {
                    if (!!command) {
                        command = command.parseValue($this.val());
                    }
                    if (!!action) {
                        action = action.parseValue($this.val());
                    }
                    mk.toolbar.processCommandOrAction(command, action);
                    e.preventDefault();
                }
            },
            fileChange: function() {
                var $this = $(this),
                    mk = $this.data('monkey-editor');
                    //command = $this.attr(mk.options.toolbar.commandKey),
                    //action = $this.attr(mk.options.toolbar.actionKey);
                if (this.type === 'file' && this.files && this.files.length > 0) {
                    mk.toolbar.insertFiles(this.files);
                    $(this).val('');
                }
            },
        },

        fn: {
            processCommandOrAction: function (command,action) {
                var editor = this.mk.editor;

                editor.restoreSelection();
                editor.$.focus();

                if (!!command) {
                    editor.execCommand(command);
                }
                if (!!action) {
                    this.processAction(action);
                }

                editor.saveSelection();
            },
            processAction: function (actionAndArgs) {
                var arr = actionAndArgs.split(' '),
                    action = arr.shift();

                    console.log("action", action);
                monkey.toolbar.actions[action].apply(this, arr);

                this.mk.$.trigger({
                    type: 'monkey:execAction',
                    action: action,
                });
            },
            update: function () {
                var options = this.options.toolbar;
                if (options.activeClass) {
                    $(options.selector).find(options.commandBtnSelector).each(function () {
                        var command = $(this).attr(options.commandKey);
                        $(this).toggleClass(options.activeClass, document.queryCommandState(command));
                    });
                }
            },
            switchView: function (toView) {
                var mk = this.mk,
                    options = this.options.toolbar,
                    activeClass = options.activeClass,
                    disabledClass = options.disabledClass,
                    $codeviewBtn = $('[' + options.actionKey + '=codeview]', this),
                    $enableBtn = $(options.enableOnCodeviewSelector, this);

                if (toView === mk.codeview) {
                    $codeviewBtn.addClass(activeClass);
                    $('.btn', this).addClass(disabledClass);
                    $enableBtn.removeClass(disabledClass);
                } else {
                    $codeviewBtn.removeClass(activeClass);
                    $('.btn', this).removeClass(disabledClass);
                }
            },
            resetFullscreenWrapperTop: function () {
                var mk = this.mk;
                setTimeout(function () {
                    mk.wrapper.$.css({
                        'top': mk.toolbar.outerHeight(),
                    });
                });
            },
            toggleFullscreen: function (fullscreen) {
                var mk = this.mk,
                    options = this.options.toolbar,
                    $fullscreenBtn = $('['+ options.actionKey+'=fullscreen]', this);

                mk.toolbar.toggleClass('mk-toolbar-float', fullscreen);
                $fullscreenBtn.toggleClass(options.activeClass, fullscreen);

                /* Set top space for toolbar */
                if (fullscreen) {
                    setTimeout(this.resetFullscreenWrapperTop);
                } else {
                    mk.wrapper.$.css({ 'top': '' });
                }
            },
            convertFileIntoUrl: function (fileInfo) {
                var loader = $.Deferred(),
                    fReader = new FileReader();

                fReader.onload = function (e) {
                    loader.resolve(e.target.result);
                };
                fReader.onerror = loader.reject;
                fReader.onprogress = loader.notify;
                fReader.readAsDataURL(fileInfo);
                return loader.promise();
            },

            insertFiles: function (files) {
                var mk = this.mk,
                    editor = mk.editor;
                $.each(files, function (idx, fileInfo) {
                    if (/^image\//.test(fileInfo.type)) {
                        $.when(monkey.toolbar.fn.convertFileIntoUrl(fileInfo))
                        .done(function (dataUrl) {
                            editor.execCommand('insertImage ' + dataUrl);
                        }).fail(function () {
                            //options.fileUploadError("file-reader", e);
                        });
                    } else {
                        //options.fileUploadError("unsupported-file-type", fileInfo.type);
                    }
                });
            },
        },
    };

    $.fn.monkeyToolbar = function (monkeyEditor) {
        var fn = monkey.toolbar.fn;
        this.mk = monkeyEditor;
        this.editor = this.mk.editor;
        this.options = this.mk.options;
        this.processAction = fn.processAction;
        this.update = fn.update;
        this.switchView = fn.switchView;
        this.toggleFullscreen = fn.toggleFullscreen;
        this.resetFullscreenWrapperTop = fn.resetFullscreenWrapperTop;
        this.processCommandOrAction = fn.processCommandOrAction;
        this.insertFiles = fn.insertFiles;
        this.addClass('mk-toolbar');
        return this;
    };

    monkey.callbacks.afterInitialize.push(function objectBarAfterInitialize() {
        var editor = this.editor;

        /* BeforeToolbarInitialize callback */
        this.execCallbacks(monkey.toolbar.callbacks.beforeInitialize);

        /* Extend options */
        this.extendOptions(monkey.toolbar.options);

        var toolbar = $(this.options.toolbar.selector).monkeyToolbar(this);
        this.toolbar = toolbar;
            
        /* Bind events */
        // Command buttons
        this.toolbar.find(this.options.toolbar.commandBtnSelector)
        .data('monkey-editor', this)
        .click(monkey.toolbar.bindings.btnClick);
       
        // Text inputs
        this.toolbar.find(this.options.toolbar.keydownTriggerInputSelector)
        .data('monkey-editor', this)
        .click(monkey.toolbar.bindings.inputClick)
        .focus(monkey.toolbar.bindings.inputFocus)
        .blur(monkey.toolbar.bindings.inputBlur)
        .keydown(monkey.toolbar.bindings.inputKeydown);

        // Change trigger inputs
        this.toolbar.find(this.options.toolbar.changeTriggerInputSelector)
        .data('monkey-editor', this)
        .click(monkey.toolbar.bindings.inputClick)
        .focus(monkey.toolbar.bindings.inputFocus)
        .blur(monkey.toolbar.bindings.inputBlur)
        .change(monkey.toolbar.bindings.inputChange);


        // File inputs
        this.toolbar.find(this.options.toolbar.fileSelector)
        .data('monkey-editor', this)
        .change(monkey.toolbar.bindings.fileChange);

        // Action buttons
        this.toolbar.find(this.options.toolbar.actionBtnSelector)
        .data('monkey-editor', this)
        .click(monkey.toolbar.bindings.btnClick);

        // Editor
        editor.$.on('mouseup keyup mouseout', function() {
            editor.saveSelection();
            toolbar.update();
        });

        /* Monkey events */
        this.$.on('monkey:execCommand', function() {
            toolbar.update();
        });

        this.$.on('monkey:afterViewSwitch', function (e) {
            toolbar.switchView(e.toView);
        });

        this.$.on('monkey:toggleFullscreen', function (e) {
            toolbar.toggleFullscreen(e.fullscreen);
        });

        /* Window events */
        $(window).on('resize', toolbar.resetFullscreenWrapperTop);
    });

    // Translations
    monkey.fn.extendLocales({
    });
})();
