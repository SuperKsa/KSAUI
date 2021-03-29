if (typeof KSA == 'undefined') {
    throw new Error("当前组件table需要KSA支持");
}

$.table = function (options) {
    $._tableID = $._tableID || 0;
    if(!options.data){
        options.data = {
            limit : 0,
            page : 1,
            list : [],
            count : 0,
            maxpage : 1,
            url : ''
        };
    }
    $._tableID++;
    var render = {
        el : $(options.el),
        //内部使用的数据
        $data : options.data || {ksauiLoading : 0},
        post : {}, //搜索框的数据
        //传递到外部的数据
        tplObj : {},
        page : 1,
        tableClass : 'ks-table-list-' + $._tableID,
        init : function () {
            var ths = this;
            ths.dom = ths.createHtml();
            ths.el.html('<div class="ks-tc ks-p5 ks-text-gray">数据加载中！请稍后...</div>');

            this.get(1, function (dt) {
                ths.$data.list = dt.list ? dt.list : {};
                if ($.isset(dt.count)) {
                    ths.dom += '{{if count && Math.ceil(count / limit) >1}}<div class="ks-tc ks-mt"><ks-page current="' + dt.page + '" total="' + Math.ceil(dt.count / dt.limit) + '" @change="toPages(this.value)"></ks-page></div>{{/if}}';
                }
                ths.tplObj = $.tpl({
                    debug : options.debug,
                    el : options.el,
                    tpl : ths.dom,
                    data : ths.$data,
                    init : function(ele){
                        ths.el = $(ele).filter('.'+ths.tableClass);
                    },
                    methods : {
                        btnEvent : function (key, value) {
                            var arg = [].slice.call(arguments);
                            var fun = options;
                            $.loop($.explode('.', key), function (val) {
                                fun = fun[val];
                            });
                            fun = $.isObject(fun) && fun.event ? fun.event : fun;

                            $.isFunction(fun) && fun.apply(ths, [value, ths.el, ths]);
                            if($.strpos(key, ['lineBtn', 'lineSelect'])){

                                return false;
                            }
                        },
                        //选中和取消选中 指定行
                        selectLine : function(line, value){
                            var tr = ths.el.find('tr[data-key="'+line+'"]');
                            if(tr.find('input').checked()){
                                tr.addClass('ks-table-tr-checked');
                            }else{
                                tr.removeClass('ks-table-tr-checked');
                            }
                            options.lineSelect && options.lineSelect.event && options.lineSelect.event.apply(ths, [value, ths.el, ths]);
                        },
                        //获得已选中数据
                        getSelect : function(){
                            return ths.getSelect();
                        },
                        //刷新
                        refresh : function () {

                            ths.refresh();
                        },
                        //转分页
                        toPages : function (val) {
                            ths.get(val);
                        }
                    }
                });
                ths.bindEvent();
                options.endFun && options.endFun(ths);
            });
            return this;
        },

        //刷新当前列表
        refresh : function () {

            this.get(this.page);
        },
        //从API获取数据
        get : function (page, callFun) {
            var ths = this;

            //工具栏按钮状态全部禁用
            ths.el.find('.ks-table-toolbar ks-btn[data-table-btnindex]').each(function(_, ele){
                ele = $(ele);
                var btnIndex = ele.data('table-btnindex');
                var obj = options;
                $.loop(btnIndex.split('.'), function(v){
                    obj = obj[v];
                });
                obj.disabled  &&ele.disabled(obj.disabled);
            });
            var checkedAllinput = ths.el.find('input[ischeckall]');
            if(checkedAllinput.length){
                checkedAllinput[0].checked = true;
                checkedAllinput.checked(false).trigger('changeALL');
            }
            ths.page = page || 1;

            ths.post = $.arrayMerge({}, options.post || {});
            if (options.search) {
                ths.post = $.arrayMerge(ths.post, $(options.search).formData());
            }
            ths.post = $.arrayMerge(ths.post, {page : ths.page});
            ths.$data.ksauiLoading = 1;
            //请求API数据
            $.API(options.listAPI, ths.post, function (dt) {
                ths.$data.list = $.isArray(ths.$data.list) ? [] : {};
                $.loop(dt, function (val, k) {
                    ths.$data[k] = val;
                });
                if(dt.page){
                    ths.page = dt.page;
                }
                ths.$data.ksauiLoading = 0;
                callFun && callFun.call(ths, dt);
                options.render && options.render(ths);
                //行右侧按钮 menu菜单绑定
                ths.el.find('td[data-linebtn-key] *[data-table-btnindex]').each(function(_, ele){
                    ele = $(ele);
                    var btnIndex = ele.attr('data-table-btnindex');
                    var obj = options;
                    $.loop(btnIndex.split('.'), function(v){
                        obj = obj[v];
                    });
                    //hover菜单处理
                    if(obj.menu){
                        var hoverEvn = [];
                        $.loop(obj.menu, function(val){
                            hoverEvn.push({
                                label : val.text,
                                icon : val.icon,
                                style : val.style,
                                event : function(){
                                    val.event.apply(ths, [ths.$data.list[ele.data('line-key')], ths.el, ths]);
                                }
                            });
                        });
                        hoverEvn.length && ele.showMenu(obj.menuHover ? 'hover' : 'click', hoverEvn);
                    }
                });


            });
        },
        createBtn : function (dt, objIndex, eventParm, attrs) {
            attrs = attrs ? attrs : {};
            var bindLineDataName = objIndex =='lineBtn' ? 'value' : '';
            var h = '';
            if (dt) {
                if ($.isObject(dt)) {
                    $.loop(dt, function (value, key) {
                        var btnIndex = objIndex ? (objIndex + '.' + key) : '';
                        if ($.isString(value)) {
                            value = {text : value};
                        }
                        var click = btnIndex ? ('btnEvent(\'' + btnIndex + '\', ' + (eventParm || "''") + ', this)') : '';
                        h += $.tag('ks-btn', $.arrayMerge({
                            'data-table-btnIndex' : btnIndex,
                            'data-key' : key,
                            size : 'small',
                            icon : value.icon,
                            color : value.color,
                            style : value.style,
                            disabled : value.disabled ? 'disabled' : null,
                            '@click' : click,
                            cap : value.cap,
                            line : value.line
                        }, attrs), value.text)+ ' ';
                    });
                } else {
                    h += dt;
                }
            }

            return h;
        },
        //获得已选中数据
        getSelect : function(){
            var ths = this;
            var tr = ths.el.find('tr.ks-table-tr-checked');
            var data = {};
            $.loop(tr, function(ele){
                ele = $(ele);
                var key = ele.data('key');
                if(ths.$data.list && $.isset(ths.$data.list[key])){
                    data[key] = ths.$data.list[key];
                }
            });
            return data;
        },
        createHtml : function () {
            var ths = this;
            var html = '<div class="' + ths.tableClass + '">';

            //处理工具栏按钮
            if (options.toolBtn) {
                html += '<div class="ks-table-toolbar ks-clear ks-plr1">';
                if ($.isObject(options.toolBtn)) {
                    if (options.toolBtn.left) {
                        html += '<div class="ks-fl ks-mr1-sub">' + ths.createBtn(options.toolBtn.left, 'toolBtn.left', 'getSelect()') + '</div>';
                    }
                    html += '<div class="ks-fr"><ks-btn data-key="_refresh" size="small" icon="refresh" @click="refresh()">刷新</ks-btn><ks-btn-group class="ks-ml1">' + ths.createBtn(options.toolBtn.right, 'toolBtn.right', 'this') + '</ks-btn-group></div>';
                } else if ($.isString(options.toolBtn)) {
                    html += options.toolBtn;
                }
                html += '</div>';
            }
            html += '<div class="ks-pos">';
            html += '{{if ksauiLoading}}<div class="ks-pos-1" style="width: 100%; height: 100%; z-index: 99; text-align: center; color: #9a9a9a; background: rgba(255,255,255,.8); padding-top: 80px"><span icon="loader" class="ks-text-primary" style="font-size: 2.5em"></span></div>{{/if}}';
            html += '<table class="ks-table" line hover>';
            html += '<thead><tr>';
            //处理表格头 标题字段栏
            if (options.lineSelect) {
                html += '<th width="45"><input type="ks-checkbox-all" name="__checkall__" selector=".' + ths.tableClass + '" value="" @change="btnEvent(\'lineSelect\');"></th>';
            }
            //表头处理
            $.loop(options.colData, function (value, key) {
                if($.isset(value.show) && !value.show){
                    value.style = value.style ? value.style : '';
                    value.style += 'display:none;';
                }
                html += $.tag('th', {'data-field' : key, style : value.style, width : value.width}, value.name);
            });
            if (options.lineBtn) {
                html += '<th width="160">操作</th>';
            }
            html += '</tr></thead>';
            html += '<tbody>';
            html += '{{if !count}}';
            html += '<tr><td colspan="999"><ks-empty>暂无数据</ks-empty></td></tr>';
            html += '  {{else}}  ';
            html += ' {{loop list key value}} ';
            html += '<tr :trlist="key" :data-key="key"  ' + (options.lineDblclick ? ' @dblclick="btnEvent(\'lineDblclick\', value)"' : '') + ' ' + (options.lineClick ? ' @click="btnEvent(\'lineClick\', value)"' : '') + '>';
            //全选按钮
            if (options.lineSelect) {
                html += '<td><input type="ks-checkbox" name="__checkall__" :data-ks-line-key="key" :value="value.' + options.lineSelect.field + '" @change="selectLine(key, value);"></td>';
            }
            //第二次渲染 合入模板
            $.loop(options.colData, function (value, key) {
                if($.isset(value.show) && !value.show){
                    value.style = value.style ? value.style : '';
                    value.style += 'display:none;';
                }
                if(value.type == 'price'){
                    value.tpl = $.tag('ks-price',  {color:value.color, style : value.style}, (value.unit ? value.unit : '￥')+'{{value.'+key+'}}');
                }else if(value.type == 'tag'){
                    value.tpl = $.tag('ks-tag', {color:value.color, icon:value.icon, style : value.style}, '{{value.'+key+'}}');
                }
                //展示的列数据合入
                html += $.tag('td', {style : value.style}, value.tpl ? value.tpl : '{{value.' + key + '}}');
            });
            //行操作按钮
            if (options.lineBtn) {
                html += '<td :data-linebtn-key="key">' + ths.createBtn(options.lineBtn, 'lineBtn', 'value', {':data-line-key' :'key'}) + '</td>';
            }
            html += '</tr>';
            html += '{{/loop}}';
            html += '{{/if}}';
            html += '</tbody>';
            html += '</table></div></div>';
            return html;
        },
        bindEvent : function () {
            var ths = this;
            if (options.search) {
                $(options.search).submit(function () {
                    ths.get(1);
                });
            }
        }
    };
    return render.init();
}