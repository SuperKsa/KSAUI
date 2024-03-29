$.plugin.editor = function(option){
    this.each(function(_, textarea){
        textarea = $(this);
        var uploadUrl = option.imageAPI;
        if(!uploadUrl){
            uploadUrl = textarea.attr('image-api');
        }
        var editorDom = '<div class="ks-editor" style="display: none; line-height: initial"><div class="ks-editor-content"></div><input type="file" accept="image/png, image/jpeg, image/gif" style="display: none"></div>';
        editorDom = $(editorDom);
        var uploadInput = editorDom.find('input');
        var content = editorDom.find('.ks-editor-content');

        textarea.after(editorDom).hide();
        content.html(textarea.val());
        var quill;
        function _initQuill(){
            editorDom.show();
            var toolbarOption = {
                bold : 'bold',
                italic : 'italic',
                underline : 'underline',
                video : 'video',
                link : 'link',
                blockquote : 'blockquote',
                code : 'code-block',
                list : [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                size : [{ 'size': ['small', false, 'large', 'huge'] }],
                header : [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                color : [{ 'color': [] }],
                background : [{'background': []}],
                align : [{ 'align': [] }],
                clean : 'clean',
                indent :  [{ 'indent': '-1'},{ 'indent': '+1' }],
                image : 'image'
            };
            option.toolbar = option.toolbar ? option.toolbar : [
                'bold', 'italic', 'underline', 'image','video', 'link','blockquote', 'code', 'list', 'indent', 'size', 'header', 'color', 'background', 'align', 'clean'
                /*
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                [{ 'indent': '-1'}, { 'indent': '+1' }],
                [{ 'size': ['small', false, 'large', 'huge'] }],
                [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                [{ 'color': [] }, { 'background': [] }],
                [{ 'align': [] }],
                ['clean']*/
            ];
            var toolbar = [[]], toolbarN =0;
            $.loop(option.toolbar, function(val){
                if(val =='image' && !uploadUrl){
                    return;
                }
                if($.isObject(toolbarOption[val])){
                    toolbar.push(toolbarOption[val]);
                    toolbarN = toolbar.length -1;
                }else if(toolbarOption[val]){
                    if(!toolbar[toolbarN]){
                        toolbar[toolbarN] = [];
                    }
                    toolbar[0].push(toolbarOption[val]);
                }
            });
            quill = new Quill(content[0], {
                theme: 'snow',
                modules : {
                    toolbar : toolbar
                }
            });
            if(uploadUrl) {
                uploadInput.change(function () {
                    debug(this.value);
                    if (this.value) {
                        $.upload('file', this, uploadUrl, function (dt) {
                            if (dt.id) {
                                var addImageRange = quill.getSelection();
                                var newRange = 0 + (addImageRange !== null ? addImageRange.index : 0)
                                quill.insertEmbed(newRange, 'image', dt.src + '?#tempid=' + dt.id);
                            }
                        });
                    }
                });
                quill.getModule('toolbar').addHandler('image', function(){
                    uploadInput[0].click();
                    return true;
                });
            }
            quill.on('text-change', function(delta, oldDelta, source) {
                textarea.val(quill.container.firstChild.innerHTML);
            });
        }
        //如果没有载入编辑器脚本时载入
        if(!window.Quill){
            $.getCSS('//cdn.ksaos.com/module/quill/quill.snow.css', function(){
                $.getScript('//cdn.ksaos.com/module/quill/quill.js', function(){
                    _initQuill()
                });
            });

        }else{
            _initQuill();
        }
    });
    return this;
}
