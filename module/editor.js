$.plugin.editor = function(option){
    this.each(function(_, textarea){
        textarea = $(this);
        var uploadUrl = option.imageAPI;
        if(!uploadUrl){
            uploadUrl = textarea.attr('image-api');
        }
        var editorDom = '<div class="ks-editor" style="display: none"><div class="ks-editor-content"></div><input type="file" accept="image/png, image/jpeg, image/gif" style="display: none"></div>';
        editorDom = $(editorDom);
        var uploadInput = editorDom.find('input');
        var content = editorDom.find('.ks-editor-content');

        textarea.after(editorDom).hide();
        content.html(textarea.val());
        var quill;
        function _initQuill(){
            editorDom.show();
            quill = new Quill(content[0], {
                theme: 'snow',
                modules : {
                    toolbar : [
                        ['bold', 'italic', 'underline', 'image','video'],
                        ['link','blockquote', 'code-block'],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        [{ 'indent': '-1'}, { 'indent': '+1' }],

                        [{ 'size': ['small', false, 'large', 'huge'] }],
                        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                        [{ 'color': [] }, { 'background': [] }],
                        [{ 'align': [] }],
                        ['clean']
                    ]
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