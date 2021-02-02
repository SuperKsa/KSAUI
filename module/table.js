if (typeof KSA == 'undefined') {
    throw new Error("当前组件table需要KSA支持");
}

$.table = function (options) {
    $._tableID = $._tableID || 0;

    $._tableID++;
    var render = {
        el : $(options.el),
        //内部使用的数据
        $data : options.data || {},
        //传递到外部的数据
        tplObj : {},
        page : 1,
        tableClass : 'ks-table-list-' + $._tableID,
        init : function () {
            var ths = this;
            ths.el.map(function (ele) {
                ele.KS_TABLE = ths;
            });
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
                    init : function(e){
                        $(e.EL).find('[data-table-btnindex]').each(function(_, ele){
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
                                            val.event.call(ele[0], ele.data('table-line-data'));
                                        }
                                    });
                                });
                                hoverEvn.length && ele.showMenu('hover', hoverEvn);
                            }
                        });
                    },
                    methods : {
                        btnEvent : function (key) {
                            var arg = [].slice.call(arguments);
                            var fun = options;
                            $.loop($.explode('.', key), function (val) {
                                fun = fun[val];
                            });
                            fun = $.isObject(fun) && fun.event ? fun.event : fun;

                            $.isFunction(fun) && fun.apply(ths, arg.slice(1));
                            if($.strpos(key, ['lineBtn', 'lineSelect'])){

                                return false;
                            }
                        },
                        selectLine : function(n){
                          ths.setLineSelect(n);
                        },
                        refresh : function () {

                            ths.refresh();
                        },
                        toPages : function (val) {
                            ths.get(val);
                        }
                    }
                });
                ths.bindEvent();
                options.endFun && options.endFun.call(this, ths.tplObj.el);
            });
            return this;
        },
        //选中和取消选中 指定行
        setLineSelect : function(line){
            var ths = this;

            var tr = ths.el.find('tr[data-key="'+line+'"]');

            if(tr.find('input').checked()){
                tr.addClass('ks-table-tr-checked');
            }else{
                tr.removeClass('ks-table-tr-checked');
            }
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
            var p = $.arrayMerge({}, options.post || {});

            if (options.search) {
                p = $.arrayMerge(p, $(options.search).formData());
            }
            ths.$data.ksauiLoading = 1;
            $.API($.urlAdd(options.listAPI, {page : ths.page}), p, function (dt) {
                $.loop(dt, function (val, k) {
                    ths.$data[k] = val;
                });
                //将字段预置选项值对应到列表数据中
                $.loop(dt.list, function (value, key) {
                    if ($.isObject(value)) {
                        $.loop(value, function (val, k) {
                            if (options.fieldOption && options.fieldOption[k] && options.fieldOption[k][val]) {
                                ths.$data.list[key]['_' + k] = options.fieldOption[k][val];
                            }
                        });
                    }
                });
                callFun && callFun.call(ths, dt);
                ths.$data.ksauiLoading = 0;
            });
        },
        createBtn : function (dt, objIndex, eventParm) {
            var bindLineDataName = objIndex =='lineBtn' ? '{{value}}' : '';
            var h = '';
            if (dt) {
                if ($.isObject(dt)) {
                    $.loop(dt, function (value, key) {
                        var btnIndex = objIndex ? (objIndex + '.' + key) : '';
                        if ($.isString(value)) {
                            value = {text : value};
                        }
                        var click = btnIndex ? ('btnEvent(\'' + btnIndex + '\', ' + (eventParm || "''") + ', _$tpl_.EL, _$tpl_.EL.KS_TABLE)') : '';
                        h += $.tag('ks-btn', {
                            'data-table-btnIndex' : btnIndex,
                            'data-table-line-data' : bindLineDataName,
                            'data-key' : key,
                            size : 'small',
                            icon : value.icon,
                            color : value.color,
                            style : value.style,
                            disabled : value.disabled ? 'disabled' : null,
                            '@click' : click,
                            cap : value.cap,
                            line : value.line
                        }, value.text);
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
            var table = ths.el.find('.'+ths.tableClass).find('.ks-table-tr-checked');
            var data = [];
            $.loop(table, function(ele){
                ele = $(ele);
                var key = ele.data('key');
                ths.$data.list && ths.$data.list[key] && data.push(ths.$data.list[key]);
            });
            return data;
        },
        createHtml : function () {
            var ths = this;
            var html = '<div class="' + ths.tableClass + '">';
            //处理工具栏按钮
            if (options.toolBtn) {
                html += '<div class="ks-table-toolbar ks-clear ks-plr">';
                if ($.isObject(options.toolBtn)) {
                    if (options.toolBtn.left) {
                        html += '<ks-btn-group class="ks-fl">' + ths.createBtn(options.toolBtn.left, 'toolBtn.left', '_$tpl_.EL.KS_TABLE.getSelect()') + '</ks-btn-group>';
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
                html += '<th width="45"><input type="ks-checkbox-all" name="__checkall__" selector=".' + ths.tableClass + '" value="" @change="btnEvent(\'lineSelect\', _$tpl_.EL);"></th>';
            }
            //表头处理
            $.loop(options.colData, function (value, key) {
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
            html += '<tr trlist="{{key}}" data-key="{{key}}"  ' + (options.lineDblclick ? ' @dblclick="btnEvent(\'lineDblclick\', value)"' : '') + ' ' + (options.lineClick ? ' @click="btnEvent(\'lineClick\', value)"' : '') + '>';
            //全选按钮
            if (options.lineSelect) {
                html += '<td><input type="ks-checkbox" name="__checkall__" data-ks-line-key="{{key}}" value="{{value.' + options.lineSelect.field + '}}" @change="selectLine(key); btnEvent(\'lineSelect\', _$tpl_.EL);"></td>';
            }
            //第二次渲染 合入模板
            $.loop(options.colData, function (value, key) {
                if(value.type == 'price'){
                    value.tpl = $.tag('ks-price',  {color:value.color}, (value.unit ? value.unit : '￥')+'{{value.'+key+'}}');
                }else if(value.type == 'tag'){
                    value.tpl = $.tag('ks-tag', {color:value.color, icon:value.icon}, '{{value.'+key+'}}');
                }
                //展示的列数据合入
                html += $.tag('td', {style : value.style}, value.tpl ? value.tpl : '{{value.' + key + '}}');
            });
            //行操作按钮
            if (options.lineBtn) {
                html += '<td data-linebtn-key="{{key}}">' + ths.createBtn(options.lineBtn, 'lineBtn', 'value') + '</td>';
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