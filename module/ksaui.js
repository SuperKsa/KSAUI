/*
 * KSAUI 前端UI组件库 V1.0
 *
 * 目前版本还处于开发中，请勿保存并用于生产环境！
 *  * ---------------------------------------
 * 待正式发布版本后，源代码将会公开开源
 *
 * @Author: cr180(cr180.com & ksaOS.com)
 * @Date: 2017-06-12 01:24:09
 * @LastEditors: CR180
 * @LastEditTime: 2020-08-23 17:25:34
 * @Description: file content
 */

$.ZINDEX = 999;
$.WINID = 1; //弹窗层初始ID
$.W = 0; //当前窗口宽度
$.H = 0; //当前窗口高度
$.mouseX = 0;
$.mouseY = 0;
$.device = 'PC'; //设备类型 PC MOBILE
$.deviceView = 0; //横屏竖屏 0=横屏 1=竖屏
$.ksauiRenderTree = {};


(function ($) {
    var UserAgent = navigator.userAgent;
    //低版本IE给html增加 .ks-ie9
    $.IE = _getIEversion();
    $.IE > 0 && $('html').addClass('ks-ie' + $.IE + ' ks-ie');

    function _getIEversion() {
        var ie = UserAgent.match(/msie\s([\d.]+)/i)
        var ie11 = UserAgent.match(/trident\/([\d.]+)/i);
        return parseInt(ie && ie[1] ? ie[1] : (ie11 && ie11[1] ? '11' : '0'));
    }

    $.isMobile = false;
    $.isWechat = false;
    $.W = window.innerWidth;
    $.H = window.innerHeight;

    var agent = navigator.userAgent.toLowerCase();
    //判断是否移动端
    if (/android|ipad|iphone|applewebkit|windows phone|windows ce|windows mobile/.test(agent) && ('ontouchstart' in document.documentElement)) {
        $.device = 'MOBILE';
        $.isMobile = true;
        $('html').attr('mobile', 'true');
        $.isWechat = agent.match(/MicroMessenger/i) === 'micromessenger';
    }
    if ($.device == 'PC') {
        //监听鼠标坐标
        $(document).on('mousemove', function (e) {
            $.mouseX = e.x || e.layerX || 0;
            $.mouseY = e.y || e.layerY || 0;
        });
    }
    $(window).resize(function () {
        $.W = window.innerWidth;
        $.H = window.innerHeight;
    });


    /**
     * 内部DOM渲染函数
     * @private
     */
    function _KSArenderStart() {
        //回调渲染函数
        function _documentRenderFun(option, ele, selector) {
            if (!ele._KSAUIRENDER_) {
                ele._KSAUIRENDER_ = {};
            }
            if (ele._KSAUIRENDER_[selector]) {
                return;
            }
            ele._KSAUIRENDER_[selector] = true;
            //渲染回调
            option.callback && option.callback.call(ele, ele);
            //检查是否有DOMchange监听事件
            option.monitor && $(ele).DOMchange(option.monitor, function () {
                option.callback && option.callback.call(ele, ele, true);
            });
        }

        //创建回调渲染
        function _documentRender(ele) {
            if (ele.nodeType !== 1) {
                return;
            }
            ele = $(ele);
            $.loop($.ksauiRenderTree, function (option, selector) {
                ele.find(selector).map(function (ele) {
                    _documentRenderFun(option, ele, selector);
                });
                var thisEl = ele.filter(selector);
                thisEl.length && _documentRenderFun(option, thisEl[0], selector);
            });
        }

        var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
        //监听节点变动 HTML5
        if (MutationObserver) {
            var observer = new MutationObserver(function (Mut) {

                $.loop(Mut, function (val) {
                    //if(val.target.tagName ==='KS'){
                        //debug(val, val.target, val.target.clientWidth);
                    //}
                    if ((val.type === 'childList' || val.type ==='attributes') && val.addedNodes.length) {
                        $.loop(val.addedNodes, function (ele) {
                            if (ele.nodeType === 1 && $.isIndom(ele)) {
                                //debug(ele, ele.clientWidth);
                                _documentRender(ele);
                            }
                        });
                    }
                });
            });
            observer.observe(document, {
                attributes : true , //检测属性变动
                childList : true , //检测子节点变动
                subtree : true , //整个子孙节点变动
                attributeFilter : ['style', 'clientWidth', 'clientHeight', 'offsetWidth', 'offsetHeight']
            });
            //监听节点变动 低版本浏览器
        } else {

            $(document).on('DOMContentLoaded DOMNodeInserted', function (Mut) {
                if (Mut.type === 'DOMNodeInserted') {
                    _documentRender(Mut.target);
                } else {
                    $.loop(document.body.children, function (ele) {
                        _documentRender(ele);
                    });
                }
            });
        }
    };

    $.render = function (selector, func, monitor) {
        if ($.isObject(selector) && !func) {
            $.loop(selector, function (val, key) {
                $.ksauiRenderTree[key] = {callback : val, monitor : monitor};
            });
        } else {
            $.ksauiRenderTree[selector] = {callback : func, monitor : monitor};
        }
    };

    /**
     * 移动端 不转页后退事件监听
     * @param {string} id 标识
     * @param {document} showID 需要关闭的dom(jquery) 不传入表示取消id监听
     * 后退检测到需要关闭的dom时会直接remove
     */
    $.BackEvent = function (id, showID) {
        var $this = this;
        $this.BackEventData = $this.BackEventData ? $this.BackEventData : {};
        $this.BackEventData.doms = $this.BackEventData.doms ? $this.BackEventData.doms : {};
        var Url = window.location.href;
        var idMrk = '#' + id;
        if (showID) {
            if (Url.indexOf(idMrk) == -1) {
                //history.pushState('', '', Url+idMrk);
                location.hash += idMrk;
            }
            $this.BackEventData.doms[id] = showID;
        } else {
            if (Url.indexOf(idMrk) != -1) {
                var newevn = {};
                $.loop($this.BackEventData.doms, function (v, k) {
                    if (k != id) {
                        newevn[k] = v;
                    }
                });
                $this.BackEventData.doms = newevn;
                window.history.go(-1);
            }
            return;
        }

        if (!$this.BackEventData.init) {
            $this.BackEventData.init = 1;
            $(window).on('popstate', function () {
                var u = window.location.href.indexOf('#');
                u = u == -1 ? '' : window.location.href.substr(u);
                var urlexps = {};
                $.loop($.explode('#', u), function (value) {
                    if (value) {
                        urlexps[value] = value;
                    }
                });
                var newevn = {};
                $.loop($this.BackEventData.doms, function (v, k) {
                    if (!urlexps[k]) {
                        $.layerHide($(v).attr('key'));
                    } else {
                        newevn[k] = v;
                    }
                });
                $this.BackEventData.doms = newevn;
            });
        }
    };

    /**
     * 监听窗口变化并在窗口变化后回调
     * @param {func} Fun 回调函数 参数1=宽度 参数2=高度
     * @param {number} ime 是否立即执行一次 1=立刻执行 2=dom完毕执行 3=1、2同时
     */
    $.resize = function (Fun, ime) {
        var $this = this;
        if (ime == 1 || ime == 3) {
            Fun(window.innerWidth, window.innerHeight);
        } else if (ime == 2 || ime == 3) {
            $(document).ready(function () {
                Fun(window.innerWidth, window.innerHeight);
            })
        }
        //监听窗口变化
        $(window).resize(function () {
            Fun && typeof (Fun) == 'function' && Fun(window.innerWidth, window.innerHeight);
            $this.deviceView = typeof (window.orientation) && $.inArray(window.orientation, [0, -90]) ? 0 : 1;
        });
    };

    /**
     * 本地缓存操作
     写：Val= string || JSON
     删：Val=''
     读：Val=false
     * @constructor
     * @param {String} Key 键名
     * @param {String} Val 缓存内容（可以是一个JSON对象）
     */
    $.Cache = function (Key, Val) {
        if (typeof (Storage) !== "undefined") {

            if (typeof (Val) === 'string' && !Val) {//删除
                localStorage.removeItem(Key);
                localStorage.removeItem(Key + '_jsjson');
                return true;
            } else if (typeof (Val) !== 'undefined') {//添加
                if (typeof (Val) === 'object') {
                    Val = JSON.stringify(Val);
                    localStorage.setItem(Key + '_jsjson', 1);
                }
                localStorage.setItem(Key, Val);
                return this.Cache(Key);
            } else {//获取
                Val = localStorage.getItem(Key);
                if (localStorage.getItem(Key + '_jsjson') == '1') {
                    Val = JSON.parse(Val);
                }
                return Val;
            }
        } else {
            return false;
        }
    };
    /**
     * 定位浮动层 限制在当前窗口内自适应围绕
     * @param centerObj 相对DOM对象
     * @param fellows 浮动层DOM对象
     * @constructor
     */
    $.Position = function (centerObj, fellows) {
        centerObj = $(centerObj);
        fellows = $(fellows);
        var offset = {left : centerObj.offset().left, top : (centerObj.offset().top + centerObj.height(true))};
        if (offset.left > this.W - fellows.width(true)) {
            offset.left = offset.left - fellows.width(true) - centerObj.height(true);
        }
        if (offset.top > this.H - fellows.height(true)) {
            offset.top = offset.top - fellows.height(true) - centerObj.height(true);
        }
        fellows.css(offset);
    };

    /**
     * 关闭当前iframe所在的父级layer
     */
    $.layerHideF = function () {
        if (!typeof (window.parent)) {
            return;
        }
        var id = $('body').attr('parentlayerid');
        if (id) {
            window.parent.$.layerHide(id);
        }
    };

    /**
     * 删除弹出层
     * @param {number} Id 弹出层ID
     */
    $.layerHide = function (Id, Fun) {
        $('body').removeClass('ks-body-layer-overflow');
        var o;
        if (!Id) {
            return;
        }
        o = $('#ks-layer-' + Id);
        if (!o.length) {
            return;
        }
        var option = LayerObject[Id] ? LayerObject[Id].option : {};
        if (Id) {
            var coverEle = o.next('[data-layer-key="' + Id + '"]');
            o.addClass('ks-anim-hide');
            coverEle.addClass('ks-anim-fadeout');
            option.backEvent && $.BackEvent('KsaLayer' + Id);
            setTimeout(function () {
                o.active(false);
                Fun && Fun(Id);
                !option.cancel && option.close && option.close();
                option.hide && option.hide();
                if (option.cache) {
                    coverEle.length && coverEle.hide();
                    o.hide();
                } else {
                    coverEle.length && coverEle.remove();
                    o.remove();
                    delete LayerObject[Id];
                }
            }, 200);
        }
    };

    /**
     * 创建一个弹窗（所有弹出层 底层驱动）
     * @param {JSON/html/document} option 窗口HTML内容 或 JSON配置参数 或 jquery元素对象
     * @param {number} pos 窗口定位 （可选，可在参数1通过json配置）
     *                        00 : 从右到左滑出一个全屏（移动端适用 cover参数固定为0）
     *                    自动定位传值： jQ选择器 (根据元素坐标相对定位 适合各种下拉菜单、提示框)
     *                    指定定位传值：
     *                            1 2 3
     *                            4 5 6
     *                            7 8 9
     * @param {number} cover 是否遮罩层 0=否 1=是 2=是（带点击关闭窗口事件） 3=是（带双击关闭窗口事件）
     * @param {func} showFun 弹窗显示后回调（可选，可在参数1通过json配置）
     * @param {func} closeFun 弹窗关闭后回调（可选，可在参数1通过json配置）
     * @param {func} btnFun 底部按钮点击回调（可选，可在参数1通过json配置）
     * @param {func} initFun 初始化后回调函数（可选，可在参数1通过json配置）
     * @returns {k.fn.init}
     */
    var LayerObject = {};
    $.layer = function (option, pos, cover, showFun, closeFun, btnFun, initFun) {

        var EL = $(option.el || 'body');
        var ELoffset = EL.offset();
        //EL尺寸与位置
        var ELSize = {W : EL.width(true), H : EL.height(true), L : ELoffset.left, T : ELoffset.top};

        //layer动画样式名称
        var layerAnim = {
            0 : 'ks-anim-up',
            1 : 'ks-anim-right',
            2 : 'ks-anim-down',
            3 : 'ks-anim-left',
            4 : 'ks-anim-right',
            5 : 'ks-anim-scale',
            6 : 'ks-anim-left',
            7 : 'ks-anim-right',
            8 : 'ks-anim-up',
            9 : 'ks-anim-left',
            '00' : 'ks-anim-left',
        };

        var R = {
            ID : 1,
            layer : null, //当前layer KSA对象
            obj : {},
            isCache : false,
            autoCloseObj : null, //自动关闭 setTimeout对象
            init : function(){
                var _this = this;
                if(option.cache){
                    //从缓存抽取layer
                    $.loop(LayerObject, function(val){
                        if(val.cache === option.cache){
                            _this.obj = val;
                            _this.isCache = true;
                            _this.layer = $(_this.obj.dom);
                        }
                    });
                }
                _this.optionInit();
                !_this.isCache && _this.createDom();

                _this.sizeInit();
                this.show();

                if (!_this.isCache && option.ajaxUrl) {
                    $.API(option.ajaxUrl, option.ajaxPost, function (d) {
                        _this.layer.children('.ks-layer-content').html(d);
                        option.ajaxCall && option.ajaxCall.call(_this.layer, _this.layer.children('.ks-layer-content').children('*'));
                        window.setTimeout(function(){
                            _this.pos();
                        });
                    });
                }
                return this.obj;
            },
            //配置初始化
            optionInit : function(){
                if (typeof (option) == 'string' || (option instanceof $ && option[0].innerHTML)) {
                    option = {content : option};
                }
                //如果layer是一个远程url 则提示稍后
                if(option.ajaxUrl){
                    option.content = '请稍后';
                }
                option = $.arrayMerge({
                    el : $.layerEL || 'body', //弹窗位置被限制在哪个元素中
                    title : null, //弹窗标题
                    content : null, //弹窗内容
                    class : '', //附加class 可以自定义样式
                    iframe : null, //iframe框架URL地址
                    ajaxUrl : null, //ajax地址 （注意ajax类型窗口调用不会返回任何数据）
                    ajaxPost : null,//ajaxPost 数据
                    type : '', //弹窗类型 与class组合 {class}_{type}
                    pos : pos ? pos : 5, //弹窗位置 参考layer pos介绍
                    btn : null, //按钮名称 数组
                    btnFun : btnFun, //按钮点击后回调 参数[index=按钮序号, txt=按钮文字, btnobj=按钮dom对象, dom=整个KSAUI对象]
                    cover : $.isset(cover) ? cover : 0, //是否遮罩层 0=否 1=是 2=是（带点击关闭窗口事件） 3=是（带双击关闭窗口事件） 坐标={top:0,right:0,bottom:0,left:0,event:click|dblclick}
                    outTime : 0,//自动关闭时间 秒
                    init : initFun, //初始化回调（还未添加到body中） 参数[layerDom]
                    show : showFun, //弹出后回调 参数[layerDom]
                    close : closeFun, //关闭后回调 无参数
                    closeBtn : 1, //是否需要右上角关闭按钮 1=是 0=否
                    backEvent : null, //是否需要监听后退事件 1=是 0=否
                    cache : null, //是否缓存 传入唯一缓存键名
                    maxHeight : 0, //内容区最大高度
                    height : null, //内容区固定高度
                }, option);

                //手机端默认监听后退事件
                if (option.backEvent === null && $.isMobile) {
                    option.backEvent = 1;
                }

                option.type = option.type ? option.class + ' ' + option.class + '_' + option.type : '';
                option.cache = option.cache ? option.cache : null;
                if (option.iframe) {
                    option.class += ' ks-layer-iframe';
                    option.content = '<iframe src="' + option.iframe + '" width="100%" height="100%"></iframe>';
                }
            },
            //layer 尺寸、位置处理
            pos : function() {
                var _this = this;
                var style = {};
                var pos = option.pos;
                _this.countSize();
                var w = _this.obj.width,
                    h = _this.obj.height;
                if ($.inArray(pos, ['00', 1, 2, 3, 4, 5, 6, 7, 8, 9])) {
                    if ($.inArray(pos, [1, 4, 7])) {
                        style.left = 0;
                    }
                    if ($.inArray(pos, [1, 2, 3])) {
                        style.top = 0;
                    }
                    //X轴居中
                    if ($.inArray(pos, [2, 5, 8])) {
                        style['margin-left'] = $.intval(0 - w / 2);
                    }
                    //X轴居右
                    if ($.inArray(pos, [3, 6, 9])) {
                        style.right = 0;
                        style.left = 'initial';
                    }
                    //Y轴居中
                    if ($.inArray(pos, [4, 5, 6])) {
                        style['margin-top'] = $.intval(0 - h / 2);
                    }
                    //Y轴底部
                    if ($.inArray(pos, [7, 8, 9])) {
                        style.top = 'initial';
                        style.bottom = '0';
                    }
                    //全屏
                    if (pos == '00') {
                        style.top = '0';
                        style.bottom = '0';
                        style['margin-left'] = '-100%';
                    }
                    //如果定位不是既定位置 则认为是一个选择器 自适应定位
                } else {
                    var trigger = $(pos),
                        teiggerW = trigger.width(true),
                        teiggerH = trigger.height(true),
                        layerW = this.layer.width(true),
                        layerH = this.layer.height(true);
                    style.left = trigger.offset().left;
                    style.top = trigger.offset().top + teiggerH;

                    var seH = trigger.offset().top - $(document).scrollTop() + teiggerH + layerH;
                    if (ELSize.W - (style.left + layerW) < 0) {
                        style.left = style.left - layerW + teiggerW;
                    }
                    //如果弹出层Y坐标与自身高度超出可视区 则定位到基点上方
                    if ($.H - seH < 0) {
                        style.top = trigger.offset().top - layerH;
                        _this.obj.pos = 2;
                    } else {
                        _this.obj.pos = 8;
                    }
                }
                this.layer.css(style);
            },
            close : function(isCancel){
                this.autoCloseObj && clearTimeout(this.autoCloseObj);
                option.cancel = !!isCancel;
                $.layerHide(this.ID);
            },
            //创建DOM
            createDom : function(){
                var _this = this;
                var id = $.ZINDEX ++;
                var dom = '';
                //关闭按钮
                if (option.closeBtn) {
                    dom += '<span class="ks-layer-close" icon="close"></span>';
                }
                //标题栏
                if (option.title) {
                    dom += '<div class="ks-layer-title">' + option.title + '</div>';
                }
                dom += '<div class="ks-layer-content"></div>';
                //按钮处理
                if (option.btn) {
                    var s = '';
                    if ($.isString(option.btn)) {
                        s += $.tag('ks-btn', {'data-btn-index' : 0}, option.btn);
                    } else {
                        $.loop(option.btn, function (val, k) {
                            val = val.split(':');
                            s += $.tag('ks-btn', {class : '_' + k, 'data-btn-index' : k, color : val[1], cap:$.isMobile}, val[0]);
                        });
                    }
                    dom += s ? '<div class="ks-layer-bottom">' + s + '</div>' : '';
                }

                var pos = $.isObject(option.pos) ? 0 : option.pos;
                dom = $.tag('div', {
                    class : ('ks-layer ' + option.class + ' ' + option.type),
                    pos : pos,
                    id : 'ks-layer-' + id,
                    style : 'z-index:' + id,
                    key : id
                }, dom);
                dom = $(dom);
                dom.find('.ks-layer-content').html(option.content);

                //创建当前layer对象到全局变量
                LayerObject[id] = this.obj = {
                    dom : dom[0],
                    coverDom : '',
                    id : id,
                    selector : '#ks-layer-'+id,
                    option : option,
                    width : 0,
                    height : 0,
                    cache : option.cache,
                    pos : pos,
                    resize : function(){
                        _this.pos();
                    },
                    close : function(){
                        _this.close();
                    },
                    show : function(){
                        _this.show();
                    }
                };

                _this.ID = id;
                _this.layer = dom;
                //添加layerID
                _this.layer.layerID = id;
                //DOM插入到前台
                $(EL).append(dom);

                //iframe body加当前ID
                if (option.iframe) {
                    dom.iframe = null;
                    dom.find('iframe')[0].onload = function () {
                        dom.iframe = $(this.contentWindow.document.body);
                        dom.iframe.attr('parentlayerid', id);
                    };
                }

                //关闭事件 右上角按钮
                dom.find('.ks-layer-close').click(function () {
                    _this.close(true);
                });

                //底部按钮处理
                if (option.btn) {
                    dom.find('.ks-layer-bottom > ks-btn').click(function () {
                        var t = $(this);
                        if (!t.disabled() && (!option.btnFun || (typeof (option.btnFun) == 'function' && option.btnFun.call(this, t.data('btn-index'), dom) !== false))) {
                            _this.close(t.data('btn-index') ==='cancel');
                        }
                    }).filter('ks-btn:last-child:not([color])').attr('color', 'primary');
                }

                //遮罩层点击关闭事件
                if (option.cover) {
                    var cover = $('<div class="ks-layer-cover" data-layer-key="' + id + '" style="z-index: ' + (id - 1) + '"></div>');
                    _this.obj.coverDom = cover[0];
                    cover.css($.arrayMerge({
                        top : 0,
                        right : 0,
                        bottom : 0,
                        left : 0
                    }, $.isObject(option.cover) ? option.cover : {}));
                    if(option.cover >1){
                        var coverEvent = ($.isMobile ? 'touchend' : option.cover == 3 ? 'dblclick' : option.cover == 2 ? 'click' : '');
                        //触发事件
                        coverEvent && cover.on(coverEvent, function () {
                                _this.close(true);
                        });
                    }
                    _this.layer.after(cover);
                }

                //初始化回调
                $.isFunction(option.init) && option.init(dom, id);
            },
            sizeInit : function () {
                var style = {};
                //内容区最大高度处理
                var cententMaxH = $.H;
                if (option.title) {
                    cententMaxH -= this.layer.children('.ks-layer-title').height(true, true);
                }
                if (option.btn) {
                    cententMaxH -= this.layer.children('.ks-layer-bottom').height(true, true);
                }

                if (option.height) {
                    style.height = option.height;
                    //百分比值支持
                    if ($.strpos(style.height, '%')) {
                        style.height = cententMaxH * $.floatval(style.height) / 100;
                    }
                }
                if (option.maxHeight) {
                    style['max-height'] = option.maxHeight;
                    //百分比值支持
                    if ($.isString(style['max-height']) && style['max-height'].indexOf('%')) {
                        style['max-height'] = cententMaxH * $.floatval(style['max-height']) / 100;
                    }
                }

                if (option.width) {
                    style.width = option.width;
                    //百分比值支持
                    if ($.isString(style.width) && style.width.indexOf('%')) {
                        style.width = $.floatval(style.width);
                        style.width = ELSize.W * style.width / 100;
                    }
                }
                this.layer.children('.ks-layer-content').css(style);
            },
            show : function() {
                var _this = this;

                var pos = _this.obj.pos,
                    id = _this.ID;

                if (!$.isset(option.bodyOver) || option.bodyOver) {
                    $(EL).addClass('ks-body-layer-overflow');
                }
                this.layer.removeClass('ks-anim-hide').show();
                $(this.obj.coverDom).removeClass('ks-anim-fadeout').show();
                //延迟show 防止回调函数中click 同步响应
                window.setTimeout(function () {
                    layerAnim[pos] && _this.layer.addClass(layerAnim[pos]);
                    _this.layer.active(true);
                    //后退事件监听
                    option.backEvent && $.BackEvent('KsaLayer' + id, '#ks-layer-' + id);

                    //show回调函数
                    $.isFunction(option.show) && option.show(_this.layer, id);

                    //N秒自动关闭
                    if (option.outTime > 0) {
                        _this.autoCloseObj = setTimeout(function () {
                            _this.close(true);
                        }, option.outTime * 1000 + 50);
                    }
                    _this.pos();
                    window.setTimeout(function(){
                        _this.pos();
                    }, 200);

                });



                //按ESC键处理
                $(document).off('keydown.ks-layer').on('keydown.ks-layer', function (e) {
                    if (e.keyCode == 27) {
                        //关闭浮动窗口
                        var o = $('.ks-layer').last();
                        if (o.length) {
                            $.layerHide(o.attr('key'));
                        }
                    }
                });
                return _this.layer;
            },
            //计算当前layer宽高并写入obj
            countSize : function(){
                this.obj.width = this.layer.width(true);
                this.obj.height = this.layer.height(true);
            }
        };


        return R.init();
    };;

    /**
     * 对话框操作 (基于layer层)
     * 参数介绍：
     * 普通        参数：    1=标题 2=内容 3=自动关闭时间 4=按钮文字 5=按钮回调函数 6=关闭回调函数
     * 成功|失败    参数：    1=success|error 2=内容 3=关闭回调函数 4=按钮文字
     * 确认框    参数：    1=confirm 2=标题 3=内容 4=确认回调函数 5=按钮文字
     * 表单框    参数：    1=form 2=标题 3=数据 4=确认回调函数 5=按钮文字
     */
    $.Dialog = function (type) {
        var p = arguments;
        var op = {class : 'ks-Dialog'};
        switch (true) {
            //成功|失败 参数：2=内容 3=关闭回调函数 4=按钮文字
            case $.inArray(type, ['success', 'error']):
                op.content = p[1];
                op.close = p[2];
                op.btn = p[3] || {'cancel' : '知道了:primary'};
                op.class += '_' + type;
                op.closeBtn = 0;
                //op.outTime = 3;
                op.cover = 2;
                op.backEvent = false;
                break;

            //确认 参数： 2=标题 3=内容 4=确认回调函数 5=按钮文字
            case type == 'confirm':
                var btn = p[4], callFun = p[3];
                btn = btn && $.isString(btn) ? {'confirm' : btn} : (btn || {'cancel' : '取消', 'confirm' : '确认:primary'});
                op.title = p[1];
                op.content = p[2];
                op.close = null;
                op.btn = btn;
                op.outTime = 0;
                op.cover = 1;
                op.maxWidth = '80%';
                op.btnFun = function (a) {
                    if (a == 'confirm' && typeof (callFun) == 'function') {
                        return callFun.apply(this, arguments);
                    }
                };
                op.class += '_' + type;
                op.closeBtn = 0;
                break;
            /*表单弹窗 第三个参数：
            [
                {name:'字段名', type:'展现类型select/radio/checkbox/switch/text', text:'表单标题名称', value:'默认值', option:[多个选项列表键名=值 键值=名称]},
                ...
            ]
        */
            case type == 'form':
                var H = $.createForm(p[2]);

                var callFun = p[3];
                op.title = p[1];
                op.content = H;
                op.close = null;
                op.btn = {'cancel' : '取消', 'confirm' : (p[4] ? p[4] : '确认')};
                op.outTime = 0;
                op.cover = 1;
                op.btnFun = function (a, layer) {
                    if (a == 'confirm') {
                        if(p[2].action){
                            layer.find('form').submit();
                        }else{
                            callFun && callFun.apply(this, arguments);
                        }
                        return false;
                    }
                };
                op.class += '_' + type;
                op.closeBtn = 1;
                op.maxHeight = '100%';
                op.show = function (layer) {
                    layer.find('form').submit(function (e) {
                        e.stop();
                        var ts = this;
                        $(ts).formSubmit(function (d) {
                            callFun && callFun.call(ts, d);
                            if (d.success) {
                                $.layerHide(layer.layerID);
                            }
                        });
                    });
                };
                op.pos = 5;
                if($.isMobile){
                    op.pos = 8;
                    op.width = '100%';
                }
                break;
            //默认 参数： 1=标题 2=内容 3=自动关闭时间 4=按钮文字 5=按钮回调函数 6=关闭回调函数
            default:
                op.title = p[0];
                op.content = p[1];
                op.outTime = p[2];
                op.btn = p[3];
                op.btnFun = p[4];
                op.close = p[5];
                op.cover = 1;
                op.pos = 5;
                break;
        }
        return $.layer(op);
    };

    /**
     * mini提示框
     * @param {html} msg 提示内容
     * @param {success/error/null} tps 状态 success=成功 error=错误
     * @param {func} callFun 窗口关闭后回调函数
     * @param {number} outTime 关闭时间(秒) 0=一直显示
     * @returns {k.fn.init}
     */
    $.toast = function (msg, tps, callFun, outTime) {
        var cover = 0;
        outTime = typeof (outTime) == 'undefined' ? 2 : outTime;
        if (msg == 'loading') {
            msg = '数据加载中';
            callFun = tps;
            tps = 'loading';
            cover = 3;
        }
        if (tps) {
            msg = '<div icon="' + tps + '">' + msg + '</div>';
        }
        return $.layer({
            content : msg,
            class : 'ks-Dialog_toast',
            type : tps,
            cover : cover,
            close : callFun,
            outTime : outTime,
            backEvent : false
        });
    };

    /**
     * 创建一个新的全屏页面
     * @param option 参数同layer
     */
    $.openWindow = function (option) {
        var h = '<div class="ks-hdbar">';
        if (option.backBtn === null || option.backBtn !== false) {
            h += '<span icon="back" onclick="window.history.go(-1);"></span>';
        }
        h += '<div class="ks-hdbar-title">' + option.title + '</div>';
        h += '</div>';

        return this.layer($.arrayMerge(option, {
            title : h,
            content : option.content || '<div class="layer-loading"><i icon="loading"></i>加载中</div>',
            width : '100%',
            height : '100%',
            maxHeight : false,
            pos : '00',
            class : 'openWindow'
        }));
    };


    /**
     * 将各种日期/时间戳转换为对象
     * @param str 带格式的日期/时间戳
     * @param F 需要输出的格式(存在则输出日期，否则输出对象) Y-m-d H:i:s || Y年m月d日 H:i:s等
     * @returns {object} {Y: number, m: number, d: number, H: number, i: number, s: number}
     */
    $.times = function (str, F) {
        if ($.isNumber(str) && $.inArray($.strlen(str), [10, 13])) {
            if (str.length == 10) {
                str = str * 1000;
            }
            str = parseInt(str);
        }
        if (typeof (str) == 'string') {
            str = str.replace(/年|月/g, '-');
            str = str.replace(/时|分|点/g, ':');
            str = str.replace(/日|秒/g, '');
        }

        var date = str ? new Date(str) : new Date();
        var obj = {
            'Y' : date.getFullYear(),
            'm' : (date.getMonth() + 1),
            'd' : date.getDate(),
            'H' : date.getHours(),
            'i' : date.getMinutes(),
            's' : date.getSeconds(),
            'str' : '',
            'timestamp' : date.getTime()
        };
        obj.str = obj.Y + '-' + obj.m + '-' + obj.d + ' ' + obj.H + ':' + obj.i + ':' + obj.s;
        $.loop(obj, function (val, k) {
            obj[k] = val < 10 ? '0' + val : val;
            F && (F = F.replace(k, val));
        });
        return F ? F : obj;
    };

//指定月份多少天
    $.days = function (y, m) {
        return new Date(y, m, 0).getDate();
    };

//指定日期星期几
    $.week = function (y, m, d) {
        var w = new Date(y + '-' + m + '-' + d).getDay();
        return w == 0 ? 7 : w; //周日序号为7
    };

    /**
     * AJAX请求
     * @param {url} url 请求地址（末尾自动追加ajax=1）
     * @param {json} postdata POST数据 json格式 不传则发起GET请求
     * @param {func} fun 回调函数(API必须返回result字段) 参数1=result值, 参数2=原始返回
     * @param {func} errfun 请求错误时的回调函数(通讯不畅、非标准API返回等底层级错误返回)
     * @param {string} datatype 请求结果数据格式 (默认json)
     * @param {type} isBflow 是否为数据流（上传文件）
     * @returns {Boolean}
     */
    $.API = function (url, postdata, fun, errfun, datatype, isBflow) {
        datatype = datatype ? datatype : 'json';
        url = $.urlAdd(url, {ajax:1});
        var option = {
            type : postdata ? 'POST' : 'GET',
            url : url,
            dataType : datatype,
            data : postdata,
            success : function (s) {
                if (s && typeof (s) == 'object') {
                    //成功回调函数 只在API返回result字段时回调
                    if ($.isset(s.result)) {
                        if (s.result.KSAUI) {
                            $[s.result.KSAUI.type].apply('', s.result.KSAUI.param)
                        }
                        typeof (fun) == 'function' && fun(s.result, s);
                    } else {
                        console.log('%cKSAUI-AJAX-ERROR API异常返回！URL：' + url + "\n", 'background:#f00; color:#fff', s);//debug
                        typeof (errfun) === 'function' && errfun(s);
                    }

                    if ($.isset(s.msg) && s.msg) {
                        if (s.success) {
                            $.toast(s.msg, 'success', function () {
                                if (s.success && s.locationUrl) {
                                    window.location.href = s.locationUrl;
                                }
                            });
                        } else {
                            $.toast(s.msg, 'error');
                        }
                    }

                } else {
                    $.toast('error', 'ajax远端系统错误');
                }
            },
            error : function (s) {
                console.log('%cKSAUI-AJAX-ERROR (Code:' + s.status + ')', 'background:#f00; color:#fff', 'URL:' + url);//debug
                $.toast('ajax远端系统错误', 'error');
                if (typeof (errfun) === 'function') {
                    errfun(s);
                }
            }
        };
        if (isBflow) {
            option.processData = false;
            option.contentType = false;
        }
        $.ajax(option);
        return false;
    };

    /**
     * AJAX url 并弹出一个远端内容框
     * @param {type} tit
     * @param {type} url
     * @returns {undefined}
     */
    $.ajaxWin = function (tit, url) {
        return $.API(url, '', function (data) {
            $.layer({
                title : tit,
                content : data,
                cover : 1
            });
        });
    };

    /**
     * 表单AJAX提交
     * 实例化后使用
     * @param {type} callFun 回调函数
     * @returns {Boolean}
     */
    $.plugin.formSubmit = function (callFun) {
        var loadingLayerID = $.toast('请稍后','','','',0).id;
        this.map(function (obj) {
            obj = $(obj);
            var btn = obj.find('button[type=submit], input[type=submit], ks-btn[submit]');
            var btnTxt = btn.html();
            btn.addClass('btn-load').disabled(true).text(btnTxt);
            var formData = obj.formData(true);
            if (obj.attr('id')) {
                formData.append('FORMID', obj.attr('id'));
            }
            $.API($.urlAdd(obj.attr('action'), 'formsubmit=true'), formData, function (dt) {
                $.layerHide(loadingLayerID);
                if (typeof callFun == 'function') {
                    callFun(dt);
                }
                btn.removeClass('btn-load').disabled(false).html(btnTxt);

                //如果当前是一个iframeLayer 则关闭当前layer
                if($.isObject(dt) && dt.success && $('body').attr('parentlayerid')){
                    $.layerHideF();
                    window.parent.$.layerHide(loadingLayerID);
                }
            }, function () {
                $.layerHide(loadingLayerID);
                btn.removeClass('btn-load').disabled(false).html(btnTxt);
            }, 'json', 1);

            //30秒后解除提交按钮限制
            setTimeout(function () {
                btn.removeClass('btn-load').disabled(false).html(btnTxt);
                $.layerHide(loadingLayerID);
            }, 30 * 1000);
        });

        return false;
    };

    /**
     * 快速上传函数
     * @param {string} name 传递给后端的表单名称
     * @param {document} files inputDOM 或 input.files对象
     * @param {url} url 上传地址
     * @param {func} callFun 上传后回调函数
     */
    $.upload = function (name, files, url, callFun) {
        name = name ? name : 'upload';
        var formData = new FormData();
        debug(files);
        if(files instanceof Blob) {
            formData.append(name, files);
        }else{
            files = files.files;
            if (files.length > 1 && name.indexOf('[]') === -1) {
                name += '[]';
            }
            $.loop(files, function (val) {
                if (val.size && val.type) {
                    formData.append(name, val);
                }
            });
        }


        this.API(url, formData, function (data) {
            callFun(data);
        }, null, 'json', 1);
    };

    /**
     * html标签生成
     * 属性值不存在则不输出对应属性
     * @param {string} tp 标签名称 div/span/input
     * @param {json} dt 属性数据 {class:'test',type:'text'}
     * @param {html} txt 附加在标签中或者后面的html
     * @param {string} ed 是否不需要结尾 input等传入1
     * @returns {string} 返回一个标签html源码
     */
    $.tag = function (tp, dt, txt, ed) {
        var h = '<' + tp;
        $.loop(dt, function (v, k) {
            v = v === '' ? null : v;
            v = v === true ? k : v;
            h += k && v != null ? (' ' + k + '="' + v + '"') : '';
        });
        h += '>' + (txt ? txt : '');
        if (!ed) {
            h += '</' + tp + '>';
        }
        return h;
    };


    /**
     * 初始化选择列表
     * dom结构 <ul class="ks-list"><li value="选项1-值" text="选项名称(可选)">选项1</li></ul>
     * 必须通过KSUI('xx')选择器调用
     * @param callFun 回调函数 参数1=当前值 参数2=当前文字 参数3=当前值数据 参数4=当前item对象 参数5=当前event
     */
    $.plugin.listSelect = function (callFun) {
        var $this = this;
        var isMultiple = $.isset($this.attr('multiple'));

        $this.find('ks-list-item').click(function (e) {
            if ($this.disabled()) {
                return;
            }
            var T = $(this);
            //如果当前已选择或禁用状态则不做任何响应
            if (T.hasClass('ks-select-optgroup-title') || (!isMultiple && T.selected()) || T.disabled()) {
                return false;
            }

            //多选下拉菜单
            if (isMultiple) {
                if (T.selected()) {
                    T.selected(false);
                } else {
                    T.selected(true);
                }
            } else {
                T.selected(true).siblings().selected(false);
            }
            var txtM = {};
            $this.find('ks-list-item[selected]').each(function (_, l) {
                l = $(l);
                txtM[l.attr('value')] = T.attr('_text') || T.attr('text') || T.text();
            });
            //值回调
            $.isFunction(callFun) && callFun(T.attr('value'), (T.attr('_text') || T.attr('text') || T.text()), txtM, T, e);
            return false;
        });
        return this;
    };


    /**
     * 将select元素 或者 selectJSON 转为渲染后的html
     * @param element  select元素 或者 selectJSON
     * @param multiple 是否多选
     * @returns {[H|*|jQuery|HTMLElement, *, string]}
     */
    $.selectToHtml = function (element, multiple) {
        var data, defvalue, select, Nums = 0;
        //如果传入的是json数据
        if ($.isObjectPlain(element)) {
            data = element;
            defvalue = element.value;
            multiple = $.isset(multiple) ? multiple : element.multiple;
        } else if ($.isArray(element)) {
            data = element;
        } else {
            select = $(element);
            multiple = select.prop('multiple');
            defvalue = select.val();
            data = option2json(select);
        }

        function _isSelected(v) {
            return (($.isArray(defvalue) && $.inArray(v, defvalue)) || ($.isObjectPlain(defvalue) && $.isset(defvalue[v])) || v === defvalue);
        }

        //将select元素转为JSON数据
        function option2json(o) {
            var n = 0, dt = [];
            o.children().each(function (i, t) {
                t = $(t);
                var attr = t.attr();
                var v = {
                    value : attr.value || '',
                    title : attr.title || '',
                    text : t.text() || '',
                    showtitle : attr.showtitle || '',
                    selected : _isSelected(attr.value) ? true : '',
                    disabled : t.disabled() || '',
                    icon : attr.icon || '',
                    style : attr.style || '',
                    n : Nums
                };

                if (t[0].tagName == 'OPTGROUP') {
                    v.text = attr.label || '';
                    v.option = option2json(t);
                } else {
                    Nums++;
                }
                dt[n] = v;
                n++;
            });
            return dt;
        }

        //将JSON数据转换为HTML菜单列表
        function options(dt) {
            var h = '';
            $.loop(dt, function (value, key) {
                if (value.option) {
                    h += '<ks-list-item class="ks-select-optgroup-title"><strong>' + (value.text) + '</strong><ks-list class="ks-list-select" ' + (multiple ? ' multiple="multiple"' : '') + '>' + options(value.option) + '</ks-list></ks-list-item>';
                } else {
                    if (!$.isObject(value) && !$.isArray(value)) {
                        value = {value : key, text : value, selected : _isSelected(key)}
                    }
                    h += $.tag('ks-list-item', {
                        selected : value.selected ? 'selected' : '',
                        disabled : value.disabled,
                        icon : value.icon,
                        style : value.style,
                        title : value.title,
                        value : value.value,
                        n : value.n,
                        _text : value.showtitle || value.text
                    }, value.text);
                }
            });
            return h;
        }

        return [select, multiple, '<ks-list class="ks-list-select" ' + (multiple ? ' multiple="multiple"' : '') + '>' + options(data) + '</ks-list>'];
    };


//将JSON数据转换为HTML菜单列表
    function select_json_html(dt, defvalue, multiple) {
        var h = '';
        var dtArr = $.isArray(dt);
        $.loop(dt.option, function (value, key) {
            if (value.option) {
                h += '<ks-list-item class="ks-select-optgroup-title"><strong>' + (value.label) + '</strong>' + select_json_html(value, defvalue, multiple) + '</ks-list-item>';
            } else {
                //不是对象 则认为值是字符串
                if (!$.isObject(value)) {
                    value = {value : dtArr ? value : key, label : value}
                }
                if (defvalue && $.inArray(value.value, defvalue)) {
                    value.selected = true;
                }
                if (!value.selected) {
                    value.selected = null;
                }
                var txt = $.isset(value.label) ? value.label : value.content;
                delete value.content;
                h += $.tag('ks-list-item', value, txt);
            }
        });
        return '<ks-list class="ks-list-select" ' + (multiple ? ' multiple="multiple"' : '') + '>' + h + '</ks-list>';
    };

    function select_html_json(select, defValue, Nums) {
        Nums = Nums || 0;
        select = $(select);

        defValue = Nums === 0 ? select.val() : defValue;
        var json = select.attr() || {};
        select.children().map(function (el) {
            var v;
            if (el.tagName == 'OPTGROUP') {
                v = select_html_json(el, defValue, Nums);
            } else {
                v = $(el).attr() || {};
                v.n = Nums;
                v.selected = el.selected;
                v.content = el.text;
                Nums++;
            }
            json.option = json.option || [];
            json.option.push(v);
        });
        return json;
    };

    /**
     * select下拉菜单模拟
     * 触发函数
     * @param {selector} btn 触发元素dom
     * @param {json/array} data：
     ------------ JSON格式 -------------
     {
	value : '默认值', // ['默认值1','默认值2']
	multiple : 1, //是否多选
	option : [ //列表数据
	  {
		  value   :   值 必须
		  label   :   选项名称 可选
		  selected:   是否选中 可选
		  disabled:   是否禁用 可选
		  icon    :   图标名称 可选
		  style   :   样式 可选
		  option    : { //子级(如果需要) 类似select的optgroup标签
			  值同上
		  }
	  },
	  第二组,
	  第三组,
	  ...
	]
}
     ------------ Array格式 -------------
     ['名称1','名称2']

     ------------ JSON简要格式 -------------
     {key:value, key2:value2, ...}

     * @param {func} callFun 每项点击后的回调函数 1=值 2=text 3=多选值列表
     * @param {boolean} multiple 是否多选(data=select时根据元素属性自动判断)
     * @param {json} layerOption layer配置参数
     */
    $.plugin.showSelect = function (data, callFun, multiple, layerOption) {
        var btn = $(this[0]), isBtnInput = this[0].tagName === 'INPUT';
        //触发按钮被禁用时不响应
        if (btn.disabled()) {
            return;
        }

        var layerID = btn.data('layer-id');

        function _close() {
            layerID && $.layerHide(layerID);
            btn.removeData('layer-id').active(false);
        }

        //如果选择窗口存在 则关闭
        if (layerID) {
            _close();
            return;
        }
        multiple = data.multiple;

        if (isBtnInput && !data.option) {
            data = {
                value : [btn.val()],
                option : data
            };
            //简要格式支持
        } else if (!data.option) {
            data = {option : data};
        }
        data.value = data.value && !$.isArray(data.value) ? [data.value] : data.value;
        layerOption = layerOption || {};
        layerOption = $.arrayMerge({
            title : data.label ? (data.title || data.label) : false, //弹窗标题
            pos : $.isMobile ? '8' : btn,
            cover : $.isMobile ? 2 : 0,
            content : select_json_html(data, data.value, data.multiple),
            closeBtn : 0,
            bodyOver : false, //body不需要裁切
            init : function (layer) {
                if (!layer.layerID) {
                    return;
                }
                layerID = layer.layerID;
                btn.data('layer-id', layerID).active(true);
                var d = layer.find('.ks-layer-content');
                //自动定位到已选择区域
                if (d.find('ks-list-item[selected]').length) {
                    d.scrollTop(d.find('ks-list-item[selected]').eq(0).offset().top - d.offset().top - d.find('ks-list-item').eq(0).height());
                }
                //选项点击事件
                $(d.find('.ks-list-select')).listSelect(function (val, txt, valdt, T, e) {
                    e.stopPropagation();//阻止冒泡
                    //多选下拉菜单
                    if (multiple) {
                        txt = '';
                        d.find('ks-list-item[selected]').each(function (i, l) {
                            txt += '<span>' + l.innerHTML + '</span>';
                        });
                        txt = txt ? txt : '请选择';
                    }
                    //选择后回调函数
                    callFun && callFun.call(T, val, txt, valdt, T, e);
                    //触发按钮输出text
                    isBtnInput && btn.val(txt);
                    //单选框选择后关闭pop层
                    if (!multiple) {
                        _close();
                    }
                });
            },
            show : function (layer) {
                if(!$.isMobile){
                    //监听点击事件 自动关闭
                    $(document).on('click.KSAUI-select', function (e) {
                        if (!$.inArray(e.target, [btn[0], layer[0]])) {
                            $(document).off('click.KSAUI-select');
                            _close();
                        }
                    });
                }
            },
            hide : _close
        }, layerOption, {class : 'ks-layer-select'});

        return $.layer(layerOption);
    };

    /**
     * 弹出一个日期输入框
     * @param {type} input 触发表单
     * @param {type} format 日期格式 必须为：YmdHis 区分大小写随意组合顺序
     */
    $.showDate = function (input, format) {
        var $this = this;
        var defYmd = '2020-01-01';
        input = $(input);


        if (input.data('layer-id')) {
            $.layerHide(input.data('layer-id'));
            return;
        }
        format = format ? format : (input.attr('format') || 'Y-m-d H:i');
        //class名称
        var cl = {
            a : 'ks-calendar',
            b : 'ks-calendar-t',
            c : 'ks-calendar-ul',
            d : 'ks-calendar-b',
            e : 'ks-calendar-time',
        };
        //格式判断
        var isy = format.indexOf('Y') != -1, //是否需要年月日
            ismd = format.indexOf('m') != -1 && format.indexOf('d') != -1,
            isymd = isy && ismd,
            isHi = format.indexOf('H') != -1 && format.indexOf('i') != -1,
            isHis = isHi && format.indexOf('s') != -1;

        function monthHtml(str) {
            str = str && !ismd ? defYmd + ' ' + str : str;
            var dt = $this.times(str);
            if (!dt.Y || !dt.m) {
                return;
            }
            //上个月
            var Html = '',
                ly = dt.Y, //今年值
                lm = parseInt(dt.m) - 1; //上月值
            if (lm < 1) {
                lm = 12;
                ly--;
            }

            var lastDay = $this.days(ly, lm),
                week = $this.week(ly, lm, lastDay);

            //天数排列
            Html += '<em>一</em><em>二</em><em>三</em><em>四</em><em>五</em><em>六</em><em>日</em>';
            //上月处理
            var u = 0;
            for (var i = (lastDay - week + 1); i <= lastDay; i++) {
                Html += '<i class="_" data-value="' + ly + '-' + lm + '-' + i + '">' + i + '</i>';
                u++;
            }
            //当月天数
            for (var i = 1; i <= $this.days(dt.Y, dt.m); i++) {
                Html += '<i class="' + (i == dt.d ? ' a' : '') + '" data-value="' + dt.Y + '-' + dt.m + '-' + i + '">' + i + '</i>';
                u++;
            }
            //下月天数补偿 让日历始终显示6周 42天
            u = (42 - u);
            if (u > 0) {
                var ny = dt.Y, nm = dt.m;
                nm++;
                if (nm > 12) {
                    nm = 1;
                    ny++;
                }
                for (i = 1; i <= u; i++) {
                    Html += '<i class="_" data-value="' + ny + '-' + nm + '-' + i + '">' + i + '</i>';
                }
            }
            dt.html = Html;
            return dt;

        }

        var str = input.val();
        var dt = monthHtml(str);
        var TimeHtml = '';
        if (isHi) {
            TimeHtml = '<div class="' + cl.d + ' ks-clear">';
            TimeHtml += '<div class="' + cl.e + '">';
            TimeHtml += '<div><input type="ks-number" value="' + dt.H + '" min="0" max="23"></div>';
            TimeHtml += '<div>:</div>';
            TimeHtml += '<div><input type="ks-number" value="' + dt.i + '" min="0" max="59"></div>';
            if (isHis) {
                TimeHtml += '<div>:</div>';
                TimeHtml += '<div><input type="ks-number" value="' + dt.s + '" min="0" max="59"></div>';
            }

            TimeHtml += '</div>';
                TimeHtml += '<ks-btn color="primary">确认</ks-btn>';
            TimeHtml += '</div>';
        }

        var H = '<div class="' + cl.a + '" data-y="' + dt.Y + '" data-m="' + dt.m + '" data-d="' + dt.d + '">';
        if (isymd) {
            H += '<div class="' + cl.b + '"><i icon="arrow-left-s-fill"></i><i icon="arrow-left-s"></i><em>' + dt.Y + '年</em><em>' + dt.m + '月</em><i icon="arrow-right-s"></i><i icon="arrow-right-s-fill"></i></div><div class="' + cl.c + '">' + dt.html + '</div>';
        }
        H += TimeHtml;
        H += '</div>';

        $.layer({
            cover : !!$.isMobile,
            pos : $.isMobile ? 8 : input,
            width : $.isMobile ? '100%' : null,
            content : H,
            closeBtn : 0,
            bodyOver : false,
            show : function (layer) {
                //将dom pop对象转为子级日历
                var dom = layer.find('.' + cl.a);
                //阻止冒泡
                layer.click(function (e) {
                    e.stopPropagation();
                    return false;
                });
                if($.isMobile){
                    layer.find('.ks-layer-content').css('padding','0');
                    layer.find('.ks-calendar').css('width','100%');
                }

                //获取当前日历生成的时间并写入到触发对象中
                function sput() {
                    var v = defYmd;
                    if (format.indexOf('m') != -1) {
                        v = dom.find('.' + cl.c + ' i.a').data('value');
                    }
                    if (isHi) {
                        var b = dom.find('.' + cl.e + ' input');
                        if (b.length) {
                            v += ' ' + b.eq(0).val() + ':' + b.eq(1).val();
                            if (isHis) {
                                v += ':' + b.eq(2).val();
                            }
                        }
                    }
                    var h = $this.times(v);
                    v = format.replace('Y', h.Y).replace('m', h.m).replace('d', h.d).replace('H', h.H).replace('i', h.i).replace('s', h.s);
                    input.val(v);
                    return v;
                }

                //日 点击事件
                function ulevent() {
                    dom.find('.' + cl.c + ' i').click(function () {
                        $(this).addClass('a').siblings().removeClass('a');//当前高亮
                        !isHi && sput();//写值
                        //如果没有时分秒操作栏 则直接关闭当前窗口
                        if (!dom.find('.' + cl.d).length) {
                            $.layerHide(layer.layerID);
                        }
                        return false;
                    });
                }

                ulevent();
                //标题栏年月按钮事件
                dom.find('.' + cl.b + ' i').click(function () {
                    var N = $(this).index();
                    var y = parseInt(dom.data('y')), m = parseInt(dom.data('m')), d = parseInt(dom.data('d'));
                    //切换上一年
                    if (N == 0) {
                        y--;
                        //切换下一年
                    } else if (N == 5) {
                        y++;
                        //切换上月
                    } else if (N == 1) {
                        m--;
                        if (m < 1) {
                            m = 12;
                            y--;
                        }
                    } else if (N == 4) {//切换下月
                        m++;
                        if (m > 12) {
                            m = 1;
                            y++;
                        }
                    }
                    dom.data({y : y, m : m});
                    var em = $(this).siblings('em');
                    em.eq(0).text(y + '年');
                    em.eq(1).text(m + '月');
                    dom.find('.' + cl.c).html(monthHtml(y + '-' + m + '-' + d).html);
                    ulevent();
                    return false;
                });
                //确认按钮
                dom.find('ks-btn').click(function () {
                    sput();//写值
                    $.layerHide(layer.layerID);
                    return false;
                });

                layer.hover(function () {
                    input.attr('ks-date-show', 1);
                }, function () {
                    input.removeAttr('ks-date-show');
                });
                input.blur(function () {
                    !$(this).attr('ks-date-show') && $.layerHide(layer.layerID);
                });

                //监听点击事件 自动关闭
                $(document).on('click.KSAUI-showdate', function (e) {
                    if (!$.inArray(e.target, [input[0], layer[0]])) {
                        $(document).off('click.KSAUI-showdate');
                        $.layerHide(layer.layerID);

                    }
                });
            },
            close : function () {
                input.removeData('layer-id');

            }
        });
    };
    /**
     * 弹出菜单
     * @param {document} obj 触发元素
     * @param {html/document} content 菜单内容
     * @param {string} title 菜单名称
     */


    /**
     * 绑定下拉菜单
     * @param action 触发动作名称 hover/click/...
     * @param options 下拉菜单内容 html/json
     [
     {
			label : '设置',
			url : '', //链接
			icon : '', //icon
			style : '',//style
			event : '', //被点击触发的事件
		},
     ...
     ]
     */
    $.plugin.showMenu = function (action, options) {
        var btns = this;

        function _funShow() {
            if (btns.active()) {
                return;
            }
            btns.active(true);
            $.layer({
                pos : btns,
                cover : 0,
                content : content,
                closeBtn : 0,
                bodyOver : false, //body不需要裁切
                init : function (layer) {
                    layer.addClass('ks-layer-showmenu');
                    //监听点击事件 自动关闭
                    if (action === 'hover') {
                        var layerCloseEvn;
                        btns.push(layer).hover(function () {
                            layerCloseEvn && window.clearTimeout(layerCloseEvn);
                        }, function () {
                            layerCloseEvn = window.setTimeout(function () {
                                $.layerHide(layer.layerID);
                            }, 100);
                        });
                    }
                },
                show : function (layer) {
                    if (action !== 'hover') {
                        //监听点击事件 自动关闭
                        $(document).on('click.KSAUI-dropdown', function (e) {
                            if (e.target !== layer[0]) {
                                $.layerHide(layer.layerID);
                                $(document).off('click.KSAUI-dropdown');
                            }
                        });
                    }
                },
                close : function () {
                    btns.active(false);
                }
            });
        }

        var isHtml = $.isString(options);
        var content = '';
        if (isHtml) {
            content = options;
        } else {
            content = '';
            $.loop(options, function (val, key) {
                if ($.isString(val)) {
                    content += val;
                } else {
                    content += $.tag(val.url ? 'a' : 'p', {
                        style : val.style,
                        href : val.url,
                        icon : val.icon,
                        'dropdown-event-key' : key
                    }, val.label);
                }
            });
            content = $(content);
            content.filter('[dropdown-event-key]').map(function (ele) {
                ele = $(ele);
                var key = ele.attr('dropdown-event-key');
                var op = options[key];
                if (op) {
                    op.event && ele.click(op.event);
                }
            });
        }

        this.on(action === 'hover' ? 'mouseenter' : action, _funShow);
    };

    /**
     * 地区选择组件
     * @author cr180<cr180@cr180.com>
     * @summary 函数中所有地区level值 0=1省份 1=市区 2=区县 3=城镇
     * @param {string} tit 标题
     * @param {JSON} defDt 默认选中了的地区数据 - 格式如下：
     *      {
     *          level层级id :{id:地区ID, name:地区名称, upid:上级ID, level:地区层级},
     *          ...
     *      }
     *
     * @param {func} callFun 回调函数 - 每次选择都会回调
     *      {
     *          current:{}, //参考defDt格式
     *          data:{ //所有已选择地区数组对象，每个对象参数参考defDt
     *              0 : {参考defDt},
     *              1 : {...},
     *              ...
     *          }
     *      }
     * @param {int} maxLevel 最大层级 - 参考level解释
     * @param {url} apiUrl API接口地址 - 默认common/area，每组地区数据返回格式参考defDt介绍
     */
    $.plugin.area = function (tit, defDt, callFun, maxLevel, apiUrl) {
        var btn = $(this[0]);
        var layerID = 0;
        if (btn.data('layer-id')) {
            layerID = btn.data('layer-id');
            _close();
            return;
        }

        tit = tit ? tit : '设置地区信息';
        var _APIurl = apiUrl ? apiUrl : 'common/area';
        maxLevel = maxLevel >= 0 && maxLevel < 4 ? maxLevel : 4;
        var Ts = ['选择省份/地区', '选择城市', '选择区/县', '选择城镇', '选择街道'];
        var Fk = ['province', 'city', 'area', 'town'];
        var level = 0;

        var Dom;

        function _close(layerID) {
            $.layerHide(layerID);
            btn.removeData('layer-id').active(false);
        }

        //获取当前已选择地区数据并组合为JSON 回调给callFun
        function __callDt(currID, end) {
            var dt = {current : {}, data : {}, isEnd : end ? 1 : 0};
            Dom.find('.ks-area-layer-btn p').each(function (i, ele) {
                ele = $(ele);
                var f = ele.attr('field');
                if (ele.attr('val')) {
                    var v = {id : ele.attr('val'), name : ele.text(), level : i, field : f};
                    if (currID && currID == ele.attr('val')) {
                        dt.current = v;
                    }
                    dt.data[f] = v;
                }
            });
            $.isFunction(callFun) && callFun(dt);
        }


        //从API获取数据
        function g(upID, currID) {
            upID = upID ? upID : '';
            $.API(_APIurl, {id : upID, level : level}, function (data) {
                var H = '';
                $.loop(data, function (val) {
                    H += $.tag('ks-list-item', {
                        upid : upID,
                        val : val.id,
                        selected : (currID && currID == val.id ? 'selected' : null)
                    }, val.name);
                });
                //如果没有地区数据 则直接关闭
                if (!H) {
                    $.layerHide(layerID);
                    btn.removeData('layer-id').active(false);
                } else {
                    H = '<ks-list class="ks-list-select">' + H + '</ks-list>';
                    Dom.find('.ks-area-layer-c').html(H);
                    //计算地区列表区域的高度 以适应滚动窗口
                    (function () {
                        var h = Dom.height(true);
                        var o = Dom.find('.ks-area-layer-c');
                        o.height(h - Dom.find('.ks-area-layer-btn').height(true));

                        var p = o.find('ks-list-item[selected]');
                        if (p.length) {
                            o.scrollTop(p.index() * p.height(true));
                        } else {
                            o.scrollTop(0);
                        }
                    })();
                    //列表选项 点击事件
                    Dom.find('.ks-list-select').listSelect(function (val, txt, valdata, t, e) {
                        var id = t.attr('val');
                        t.selected(true).siblings().removeAttr('selected');
                        var bt = Dom.find('.ks-area-layer-btn').find('p').eq(level);
                        bt.text(txt).attr({upid : t.attr('upid'), 'val' : id, 'field' : Fk[level]}).show();
                        bt.next().attr('upid', id).html('<span class="ks-text-gray">' + Ts[level + 1] + '</span>').show();

                        //选择达到最后一级 关闭窗口
                        if (level == maxLevel - 1) {
                            $.layerHide(layerID);
                            btn.removeData('layer-id').active(true);
                            __callDt(id, 1);
                        } else if (level < maxLevel) {
                            g(id);
                            level++;
                            __callDt(id);
                        }
                    });
                }
            });
        }

        //底层弹出菜单
        $.layer({
            pos : $.isMobile ? 8 : btn,
            cover : $.isMobile ? 2 : 0,
            width : $.isMobile ? '100%' : '',
            height : $.isMobile ? '75%' : '',
            class : 'ks-area-layer',
            content : '<div class="ks-area-layer-btn"><p><span class="ks-text-gray">' + Ts[0] + '</span></p><p></p><p></p><p></p></div><div class="ks-area-layer-c">请稍后...</div>',
            closeBtn : false,
            bodyOver : false,
            init : function (layer, id) {
                Dom = layer;
                layerID = id;
                btn.data('layer-id', id).active(true);

                //阻止冒泡
                layer.click(function () {
                    return false;
                });

                //默认数据处理
                if (defDt) {
                    var p = layer.find('.ks-area-layer-btn p');
                    var defEnd = {};
                    var upid = 0;
                    $.loop(defDt, function (val, k) {
                        upid = k > 0 ? defDt[(k - 1)].id : 0;
                        p.eq(val.level).text(val.name).attr({
                            'upid' : upid,
                            'val' : val.id,
                            'field' : val.field
                        }).show();
                        if (level < val.level) {
                            level = val.level;
                            defEnd = val;
                        }
                    });
                    g(upid, defEnd.id);
                } else {
                    g();
                }

                //已选择地区增加点击事件 点击后选择下级地区
                layer.find('.ks-area-layer-btn p').click(function () {
                    var t = $(this);
                    level = t.index();
                    t.nextAll().text('').removeClass('a').attr('upid', '').attr('val', '').hide();
                    g(t.attr('upid'), t.attr('val'));
                    __callDt(t.attr('val'));
                });
            },
            show : function (layer) {
                //监听点击事件 自动关闭
                $(document).on('click.KSAUI-area', function (e) {
                    if (!$.inArray(e.target, [btn[0], layer[0], layer.next('[data-layer-key="' + layer.layerID + '"]')[0]])) {
                        $(document).off('click.KSAUI-area');
                        $.layerHide(layer.layerID);
                        btn.removeData('layer-id').active(false);
                    }
                });
            }
        });
    };

//title提示文字处理
    $.showTip = function (obj, txt, click) {
        obj = $(obj);
        txt = txt ? txt : (obj.attr('title') || '');
        if (!txt) {
            return;
        }
        $.ZINDEX++;
        $('body').append('<div class="ks-ftip" style="z-index:' + this.ZINDEX + '">' + txt + '<span class="ks-ftip-x"></span></div>');
        var tip = $('.ks-ftip');
        tip.show();
        var ht = tip.height(true) + tip.find('.ks-ftip-x').height(true) / 2;
        tip.css({left : (obj.offset().left - 10), top : (obj.offset().top - ht)});
        var s;
        obj.hover(function () {
            s && clearTimeout(s);
        }, function () {
            s = setTimeout(function () {
                tip.remove();
            }, 10);
        });
        tip.hover(function () {
            s && clearTimeout(s);
        }, function () {
            s = setTimeout(function () {
                tip.remove();
            }, 10);
        });
    };
    /**
     * 幻灯轮播
     * @param options
     * @returns {$.plugin}
     */
    $.plugin.slide = function (options) {
        options = {
            auto : $.isset(options.auto) ? $.floatval(options.auto === '' ? 5 : options.auto) : 5,
            card : $.isset(options.card),
            control : $.isset(options.control),
            status : $.isset(options.status),
        };
        options.auto = options.auto ? ($.floatval(options.auto) * 1000) : 0;
        this.map(function (ele) {
            if (ele._KSAUI_slideRender) {
                return;
            }
            ele._KSAUI_slideRender = true;
            _Run(ele);

        });

        function _Run(ele) {
            ele = $(ele);
            ele.children('.ks-slide-c').height(ele.height(true));
            var E = {
                id : $.objectID(ele[0]),
                width : ele.width(true),
                height : ele.height(true),
                item : ele.find('.ks-slide-item'),
                itemWidth : 0,
                widthScale : 1,
                num : 0,
                playIndex : 0, //当前播放索引值
                init : function () {
                    var ths = this;

                    ths.num = this.item.length - 1;
                    ths.itemWidth = ths.item.eq(0).width(true);
                    ths.widthScale = ths.itemWidth / ths.width;


                    var newDom = $('<div class="ks-slide-c"></div>');
                    newDom.html(this.item);
                    ele.html(newDom);

                    //组件
                    var h = '';
                    //左右切换按钮 带属性：data-slide-btn
                    if (options.control) {
                        h += '<div class="ks-slide-control-prev" icon="arrow-left-s"></div><div class="ks-slide-control-next" icon="arrow-right-s"></div>';
                    }
                    //状态栏 带属性：data-slide-status
                    if (options.status) {
                        h += '<div class="ks-slide-status">';
                        $.loop(ths.num + 1, function () {
                            h += '<span></span>';
                        });
                        h += '</div>';
                    }
                    //进度条 带属性：data-slide-progress
                    if (options.progress) {
                        h += '<div class="ks-slide-progress"><span ' + (options.progress != 1 ? ' class="ks-bg-' + options.progress.trim() + '"' : '') + '></span></div>';
                    }
                    if (h) {
                        ele.append(h);
                    }
                    if (options.control) {
                        ele.find('.ks-slide-control-prev').click(function () {
                            E.play('prev');
                        });
                        ele.find('.ks-slide-control-next').click(function () {
                            E.play('next');
                        });
                    }
                    if (options.status) {
                        ele.find('.ks-slide-status span').click(function () {
                            var v = $(this).index();
                            if (v == ths.playIndex) {
                                return;
                            }
                            var tp = 'next';
                            //第一切换最后
                            if (v === ths.num && ths.playIndex === 0) {
                                tp = 'prev';
                                //最后切换第一
                            } else if (v === 0 && ths.playIndex === ths.num) {
                                tp = 'next';
                            } else if (v < ths.playIndex) {
                                tp = 'prev';
                            }
                            ths.play(tp, v);
                            $(this).addClass('a').siblings().removeClass('a');
                        });
                    }


                    ths.playIndex = ths.num;
                    ths.play('next', 0);

                    //触摸事件
                    var moveXs = {};
                    var slideC = ele.children('.ks-slide-c');
                    ele.touch(function () {

                    }, function (evn, touch) {
                        if (touch.action === 'left' || touch.action === 'right') {
                            slideC.children('._up').each(function (i, e) {
                                e = $(e);
                                var mx = parseInt(e.attr('css-mx')) + touch.moveX;

                                e.css({
                                    transform : 'translateX(' + mx + 'px) scale(' + e.attr('css-scale') + ')',
                                    transition : 'none'
                                })
                            });
                        }
                    }, function (evn, touch) {
                        //横向移动距离超过10%才触发
                        if (touch.action == 'left') {
                            E.play('next');
                        } else if (touch.action == 'right') {
                            E.play('prev');
                        } else {
                            slideC.children('._up').each(function (i, e) {
                                e = $(e);
                                e.css({
                                    transform : 'translateX(' + e.attr('css-mx') + 'px) scale(' + e.attr('css-scale') + ')',
                                    transition : ''
                                })
                            });
                        }
                    });
                },
                move : function (i, n) {
                    var mX = (this.itemWidth * n);
                    var scale = 1;
                    this.item.eq(i).css('transition', '').css('transform', 'translateX(' + mX + 'px) scale(' + scale + ')').attr({
                        'css-mx' : mX,
                        'css-scale' : scale
                    });
                },
                play : function (tp, index) {
                    var ths = this;
                    if ($.isset(index)) {
                        index = parseInt(index);
                    } else {
                        index = ths.playIndex;
                        if (tp == 'prev') {
                            index--;
                        } else if (tp == 'next') {
                            index++;
                        }
                    }

                    index = index < 0 ? ths.num : (index > ths.num ? 0 : index);
                    ele.attr({'playerindex' : index, 'playeraction' : tp});
                    var indexL = index - 1, indexR = index + 1;
                    indexL = indexL < 0 ? ths.num : (indexL > ths.num ? 0 : indexL);
                    indexR = indexR < 0 ? ths.num : (indexR > ths.num ? 0 : indexR);

                    //当前动作组
                    var acgroup = [index, tp == 'next' ? indexL : indexR];
                    ths.item.removeClass('a _hide _on _up');

                    ths.item.eq(acgroup).removeClass('_hide')
                        .addClass('_moveon').removeClass('_moveon', 600)
                        .each(function (_, e) {
                            var i = $(e).index();
                            var mvn = i == index ? 0 : (i == indexL ? -1 : (i == indexR ? 1 : i));
                            ths.move(i, mvn);
                        });

                    ths.item.eq([indexL, index, indexR]).addClass('_up');
                    ths.item.eq(index).addClass('_on');

                    //隐藏的动作组
                    ths.item.each(function (i, e) {
                        if ($.inArray(i, acgroup)) {
                            return;
                        }
                        $(e).addClass('_hide').removeClass('_hide', 200);
                        var mvn = tp == 'next' ? 1 : -1;
                        ths.move(i, mvn);
                    });

                    ths.playIndex = index;
                    if (options.auto) {
                        $.setTimeout('ksauiSlide' + ths.id, function () {
                            ths.play(tp);
                        }, options.auto);
                    }
                    options.status && ele.find('.ks-slide-status span').removeClass('a').eq(index).addClass('a');
                }
            };

            E.init();


        }

        return this;
    };


    /**
     * 创建内置组件 - form表单
     * @param {JSON} option 配置参数参考：
     {
			action : '', //form action （可选）
			field : [
				//一组一个表单
				{
					name:'sex', //字段名
					type:'select', //展现类型select/radio/checkbox/switch/text/date
					label:'性别', //表单标题名称
					value:'2', //表单值
					option:{ //多个选项列表 键名=值 键值=名称
						'0' : '不填写',
						'male' : '男',
						'female' : '女'
					}
				},
				...
				...
			]
		}
     * @returns {html}
     */
    $.createForm = function (option) {
        var H = $.tag('form', {action:option.action, class:option.class}, '', true);
        H += '<ks-form>';
        $.loop(option.field, function (value, key) {
            if (value && $.isObject(value)) {
                value.value = value.value ? value.value : '';
                value.name = value.name ? value.name : key;
                value.placeholder = value.placeholder ? value.placeholder : '请输入...';
                value.style = value.style ? ' style="' + value.style + '"' : '';
                if (value.type === 'hidden') {
                    H += $.tag('input', {type : 'hidden', name : value.name, value : value.value}, '', true);
                } else {
                    H += $.tag('ks-form-item', {label : value.label, required : value.required}, '', true);
                    if (value.after || value.before) {
                        H += '<ks-input-group>';
                        H += value.before ? value.before : '';
                    }
                    //数字 普通输入框 密码框
                    if ($.inArray(value.type, ['number', 'text', 'password', 'tel'])) {
                        value.type = !value.unit ? 'ks-'+value.type : value.type;
                        delete value.label;
                        if(value.unit){
                            H += '<ks-input-group>';
                        }
                        H += $.tag('input', value, '', 1);
                        if(value.unit){
                            H += '<i>'+value.unit+'</i>';
                            H += '</ks-input-group>';
                        }
                        //多行输入框
                    } else if ($.inArray(value.type, ['textarea'])) {
                        value.type = 'ks-'+value.type;
                        var v = value.value;
                        delete value.value;
                        H += $.tag('textarea', value, v);
                        //开关
                    } else if (value.type == 'switch') {
                        value.value = value.value ? value.value : '';
                        H += $.tag('input', {
                            type : 'ks-switch',
                            name : value.name,
                            value : value.value,
                            text : (value.text ? value.text : '是'),
                            style : value.style,
                            checked : (value.value == 1 ? ' checked' : null)
                        }, '', 1);
                        //单选框
                    } else if (value.type == 'radio') {
                        $.loop(value.option, function (v, k) {
                            H += $.tag('input', {
                                type : 'ks-radio',
                                name : value.name,
                                value : k,
                                text : v,
                                checked : (value.value == k ? ' checked' : null),
                                style : value.style
                            }, '', 1);
                        });
                        //多选框
                    } else if (value.type == 'checkbox') { //checkbox 字段名会自动追加[]
                        (function () {
                            function check_x(checklist) {
                                var ch = '';
                                $.loop(checklist, function (v, k) {
                                    if ($.isObject(v)) {
                                        ch += '<div class="ks-mb2"><p class="ks-fw3 ks-mb1">' + k + '</p>';
                                        ch += '<p>';
                                        ch += check_x(v);
                                        ch += '</p></div>';
                                    } else {
                                        ch += ' ' + $.tag('input', {
                                            type : 'ks-checkbox',
                                            name : value.name + '[]',
                                            value : k,
                                            text : v,
                                            checked : (value.value == k || $.inArray(k, value.value) ? ' checked' : null),
                                            style : value.style
                                        }, '', 1);
                                    }
                                });
                                return ch;
                            }

                            H += check_x(value.option);
                        })();

                        //下拉选择
                    } else if (value.type == 'select') {

                        var opth = '';
                        $.loop(value.option, function (v, k) {
                            if($.isObject(v)){
                                k = v.id;
                                v = v.value;
                            }
                            opth += $.tag('option', {value:k}, v);
                        });
                        value.type = 'ks-'+value.type;
                        delete value.option;
                        H += $.tag('select', value, opth);

                    //日期
                    } else if (value.type == 'date') {
                        H += $.tag('input', {
                            type : 'ks-date',
                            name : value.name,
                            value : value.value,
                            title : value.title,
                            placeholder : value.placeholder,
                            style : value.style,
                            'ks-render' : ''
                        }, '', 1);
                        //地区选择
                    } else if (value.type == 'area') {
                        H += $.tag('ks-area', {
                            'province' : value.value.province,
                            'city' : value.value.city,
                            'area' : value.value.area,
                            'town' : value.value.town,
                            'maxlevel' : value.value.maxlevel ? maxlevel : 4
                        }, '请选择');
                        if ($.isset(value.value.address)) {
                            H += '<input type="text" name="address"  value="' + value.value.address + '" placeholder="请输入街道地址" class="ks-input ks-mt1">';
                        }
                    }else if($.inArray(value.type, ['pic','pics','file','files'])){
                        value.type = 'ks-'+value.type;
                        H += $.tag('input', value, '', 1);
                        //HTML
                    } else {
                        H += value.value;
                    }
                    if (value.after || value.before) {
                        H += value.after ? value.after : '';
                        H += '</ks-input-group>';
                    }
                    H += '</ks-form-item>';
                }
            } else if (value && $.isString(value)) {
                H += '<ks-form-title>' + value + '</ks-form-title>';
            }
        });
        H += '</ks-form></form>';
        return H;
    };

    $.imgZoom = function(file, maxWidth, maxHeight, callFun){
        file = file.files[0];
        var reader = new FileReader();
        reader.readAsDataURL(file);
        var img = new Image();
        reader.onload = function(e) {
            img.src = e.target.result
        }
        img.onload = function(e){
            var canvas = document.createElement('canvas');
            var context = canvas.getContext('2d');
            var originWidth = this.width,
                originHeight = this.height,
                width = originWidth,
                height = originHeight;
            if (originWidth > maxWidth || originHeight > maxHeight) {
                if (originWidth / originHeight > 1) {
                    // 宽图片
                    width = maxWidth;
                    height = Math.round(maxWidth * (originHeight / originWidth));
                } else {
                    // 高图片
                    height = maxHeight;
                    width = Math.round(maxHeight * (originWidth / originHeight));
                }
            }
            canvas.width = width;
            canvas.height = height;
            context.clearRect(0, 0, width, height);
            // 图片绘制
            context.drawImage(img, 0, 0, width, height);
            canvas.toBlob(function(blob) {
                blob = new File([blob], file.name, file);
                callFun && callFun(blob);
            }, file.type, 1);
        }

    };

    function ks_input_group(ele){
        ele = $(ele);
        var attr = ele.attr();
        var dom = $(ele).wrap($.tag('ks-input-group',{class:attr.class, id:attr.id}));
        if(attr.icon){
            ele.before('<i>'+attr.icon+'</i>');
        }
        if(attr.label){
            ele.before('<i>'+attr.label+'</i>');
        }
        if(attr.unit){
            ele.after('<i>'+attr.unit+'</i>');
        }
        ele.attr({class:'', id:'', icon:''});
        return dom;
    }

    (function () {

        //自动渲染DOM
        $.render({
            'input[type="ks-radio"]' : function (ele) {
                var t = $(ele), at = t.attr();
                var txt = at.text ? '<em>' + at.text + '</em>' : '';
                t.attr('type', 'radio');
                t.wrap($.tag('label',{type : 'radio', class : 'ks-radio', 'icon': at.icon, 'style':at.style, color:at.color}));
                t.after('<i>' + txt + '</i>');
                t.change(function () {
                    $(this).trigger('KSADOMchange', ['attr.checked', this.checked]);
                });
            },
            'input[type="ks-checkbox"]' : function (ele) {
                var t = $(ele), at = t.attr();
                var txt = at.text ? '<em>' + at.text + '</em>' : '';
                t.attr('type', 'checkbox');
                t.wrap($.tag('label',{type : 'checkbox', class : 'ks-checkbox', 'icon': at.icon, 'style':at.style, color:at.color}));
                t.after('<i>' + txt + '</i>');
                //最大选择数量支持
                var area = t.parent().parent();
                if (area.length && area.attr('max')) {
                    var max = parseInt(area.attr('max')) || 0;
                    //最大选择数量限制
                    if (max > 0) {
                        t.change(function () {
                            //域下相同类型的元素
                            var uN = 'input[type="checkbox"][name="' + t.attr('name') + '"]';
                            if (area.find(uN + ':checked').length == max && t.checked()) {
                                area.find(uN + ':not(:checked)').disabled(true);
                            } else {
                                area.find(uN + ':not(:checked)').disabled(false);
                            }
                        });
                    }
                }
                t.change(function () {
                    $(this).trigger('KSADOMchange', ['attr.checked', this.checked]);
                });
            },
            'input[type="ks-checkbox-all"]' : function (ele) {
                var t = $(ele), at = t.attr();
                var txt = at.text ? '<em>' + at.text + '</em>' : '';
                t.attr({'type' : 'checkbox', 'ischeckall' : 1});
                t.wrap($.tag('label',{type : 'checkbox', class : 'ks-checkbox', 'icon': at.icon, 'style':at.style, color:at.color}));
                t.after('<i>' + txt + '</i>');


                var name = t.attr('name');
                //如果没有name则不处理
                if (!name) {
                    return this;
                }

                var selector = $(t.attr('selector') || t.parent()[0].form || t.parent().parent());
                var tParent = t.parent();
                var inputs = 'input[type="checkbox"][name="' + name + '"]:not([ischeckall])';
                var indeterName = 'ks-checkbox-indeter';
                //全选事件绑定
                t.change(function () {
                    //域下相同类型的元素
                    if (this.checked) {
                        //数据列表 全选框处理 格式所有全选name必须相同 全选框必须有class <input type="checkbox" name="checkall" class="ks-check-all">
                        name && selector.find(inputs).checked(true);
                    } else {
                        //数据列表 全选框处理 格式所有全选name必须相同 全选框必须有class <input type="checkbox" name="checkall" class="ks-check-all">
                        name && selector.find(inputs).checked(false);
                    }
                    tParent.removeClass(indeterName);
                });
                selector.on('change', inputs, function () {
                    var st = false;
                    var selectedNum = selector.find(inputs + ':checked').length;
                    if (selectedNum >= selector.find(inputs).length) {
                        st = true;
                        tParent.removeClass(indeterName);
                    } else if (selectedNum > 0) {
                        st = false;
                        tParent.addClass(indeterName);
                    } else if (!selectedNum) {
                        st = false;
                        tParent.removeClass(indeterName);
                    }
                    t.checked(st);
                })
            },
            'input[type="ks-switch"]' : function (ele) {
                var t = $(ele), at = t.attr();
                var val = t.checked() ? 1 : 0,
                    txt = at.text || '',
                    name = at.name ? ' name="' + at.name + '"' : '';

                if (txt) {
                    txt = txt.split('|');
                    txt = $.isset(txt[1]) ? '<em>' + txt[1] + '</em><em>' + txt[0] + '</em>' : '<em>' + txt[0] + '</em>';
                }
                t.attr('type', 'checkbox').removeAttr('name');

                t.wrap($.tag('label',{type : 'switch', class : 'ks-switch', 'icon': at.icon, 'style':at.style, color:at.color}));

                t.after('<i>' + txt + '</i><input type="hidden" ' + name + ' value="' + val + '">');

                //事件绑定
                t.change(function () {
                    var cked = this.checked;
                    $(this).trigger('KSADOMchange', ['attr.checked', cked]).nextAll('input[type=hidden]').val(cked ? 1 : 0)
                });
            },
            'input[type="ks-number"]' : function (ele) {
                ele = $(ele);
                var at = ele.attr();
                ele.attr('type', 'number').addClass('ks-input');
                ele.wrap($.tag('label',{type : 'number', class : 'ks-input ks-input-arrow', 'icon': at.icon, 'style':at.style}));

                ele.after('<span data-digit="down" icon="subtract"></span><span data-digit="up" icon="add"></span>');

                var attrs = ele.attr();
                !ele.val().length && !attrs.placeholder && ele.val(attrs.min || 0);
                var ef = ele.parent();
                !ef.hasClass('ks-input-arrow') && ef.addClass('ks-input-arrow');
                var min = $.floatval(attrs.min) || 0, //input最小值
                    max = $.floatval(attrs.max) || 0, //input最大值
                    step = $.floatval(attrs.step) || 0, //input步进值
                    n = step && step.toString().indexOf('.') != -1 ? step.toString().split('.')[1].length : 0; //step有多少小数位 踏马的js精度
                //计算 并写input  x[0=+ 1=-]
                function r(x) {
                    var v =  ele.val();
                    var isZ = v.length >1 && v.substr(0,1) === '0';
                    v = $.floatval(v) || 0;
                    if (x == 'up') {
                        if (step) {
                            v = v + step;
                        } else {
                            v++;
                        }
                    } else {
                        if (step) {
                            v = v - step;
                        } else {
                            v--;
                        }
                    }
                    v = n > 0 ? v.toFixed(n) : v; //去踏马的精度问题 再骂一次加深印象
                    v = v < min ? min : v; //最小值限制
                    v = max && v > max ? max : v; //最大值限制
                    v = v <=9 && isZ ? '0'+v : v;
                    ele.val(v);
                }

                var S, S1;
                //鼠标按下处理
                var evn = $.isMobile ? 'touchstart touchend' : 'mousedown mouseup';
                ef.find('*[data-digit]').on(evn, function (e) {

                    var i = $(this).data('digit'); //取i标签当前索引
                    if ($.inArray(e.type, ['mousedown', 'touchstart'])) {
                        r(i); //按下 计算一次
                        //x时间内未松开鼠标 则一直计算
                        S = setTimeout(function () {
                            S1 = setInterval(function () {
                                r(i);
                            }, 60);
                        }, 250);

                        //鼠标松开后释放自动计算事件
                    } else {
                        ele.change();
                        clearInterval(S1);
                        clearTimeout(S);
                    }
                });
            },
            'select.ks-select, select[type="ks-select"]' : function (ele) {
                var t = $(ele), at = t.attr();
                if (t[0].tagName != 'SELECT') {
                    return;
                }
                t.removeClass('ks-select');
                //如果控件为展开类型 元素存在open属性
                if ($.isset(at.open)) {
                    var json = select_html_json(t[0]);
                    var ele = $('<div class="ks-select-list">' + select_json_html(json, json.value, json.multiple) + '</div>');
                    ele.children().listSelect(function (value) {
                        $(t).val(Object.keys(arguments[2])).trigger('change');
                    });
                    t.after(ele).hide();
                    ele.prepend(t);
                    t.next().disabled(t.disabled());
                    //绑定一个内部事件 让select表单值改变后通知父级
                    t.DOMchange('val', function () {
                        var val = $(this).val();
                        ele.find('ks-list-item').selected(false);
                        val = !$.isArray(val) ? [val] : val;
                        $.loop(val, function (v) {
                            ele.find('ks-list-item[value="' + v + '"]').selected(true);
                        });
                    });

                    t.DOMchange('attr.disabled', function () {
                        var ts = $(this);
                        ts.next().disabled(ts.disabled());
                    });

                } else {
                    //获取select已选中文本
                    function _selectText() {
                        var text = '';
                        t.find('option:selected').each(function (_, e) {
                            text += '<span>' + e.text + '</span>';
                        });
                        return text ? text : (t.attr('deftext') || '请选择');
                    }


                    t.attr('type value', '');
                    t.wrap($.tag('div',{class:'ks-select'}));
                    t.after('<span class="ks-select-title">' + _selectText() + '</span>');
                    t.next().click(function () {
                        if (t.disabled()) {
                            return;
                        }

                        var optionJson = select_html_json(t[0]);
                        $(this).showSelect(optionJson, function (val, txt, valdt) {
                            t.val(Object.keys(valdt));
                            t.next('.ks-select-title').html(_selectText());
                            t.trigger('change'); //手动触发change事件
                        });
                    });
                    //绑定一个内部事件 让select表单值改变后通知父级
                    t.DOMchange('val', function () {
                        t.parent().children('.ks-select-title').html(_selectText());
                    });
                }
                //如果在标签属性data-value给定选中值 则处理到内部
                $.isset(at.value) && t.val($.explode(' ', at.value, ''));
            },
            'input[type="ks-date"]' : function (ele) {
                var t = $(ele), at = t.attr();
                t.attr('type', 'text');
                t.wrap($.tag('span',{type : 'date', class : 'ks-input', 'icon': at.icon, 'style':at.style}));
                if (!at.icon && !at.iconleft && !at.iconright) {
                    at.iconright = 'calendar';
                }
                (at.icon || at.iconleft) && t.before('<left icon="' + (at.icon || at.iconleft) + '"></left>');
                at.iconright && t.before('<right icon="' + at.iconright + '"></right>');
                $.isMobile && t.after('<i class="ks-input-cover"></i>');
                //增加事件
                t.parent().click(function () {
                    $.showDate(t);
                });
            },
            'input[type="ks-text"], input[type="ks-tel"]' : function (ele) {
                var t = $(ele), at = t.attr();
                t.attr('type', at.type.substr(3));
                if(at.label){
                    ks_input_group(t);
                }else{
                    t.wrap($.tag('label',{type : 'text', class : 'ks-input', 'icon': at.icon, 'style':at.style}));
                }


                (at.icon || at.iconleft) && t.before('<left icon="' + (at.icon || at.iconleft) + '"></left>');
                at.iconright && t.before('<right icon="' + at.iconright + '"></right>');
                if($.isset(at.clear)) {
                    var clearbtn = $('<right class="ks-input-clear" icon="close-circle-fill" style="z-index:99"></right>');
                    t.before(clearbtn);
                    clearbtn.click(function () {
                        t.val('').focus();
                        clearbtn.active(false);
                    });
                    t.keyup(function () {
                        if (t.val().length > 0) {
                            clearbtn.active(true);
                        } else {
                            clearbtn.active(false);
                        }
                    });
                    t.parent().hover(function () {
                        $(this).find('input[type=text]').val().length > 0 && clearbtn.active(true);
                    }, function () {
                        window.setTimeout(function () {
                            clearbtn.active(false);
                        }, 10)
                    });
                }
            },
            'input[type="ks-password"]' : function (ele) {
                var t = $(ele), at = t.attr();
                t.attr('type', 'password');
                t.wrap($.tag('span',{type : 'password', class : 'ks-input ks-password', 'style':at.style})).removeAttr('icon');

                (at.icon || at.iconleft) && t.before('<left icon="' + (at.icon || at.iconleft) + '"></left>');
                at.iconright && t.before('<right icon="' + at.iconright + '"></right>');
                if (t.active()) {
                    t.before('<right icon="eye-off" active></right>');
                    t.prevAll('right[active]').click(function () {
                        var ths = $(this);
                        var input = ths.nextAll('input');
                        if (input.attr('type') == 'text') {
                            input.attr('type', 'password');
                            ths.addClass('ri-eye-off').removeClass('ri-eye-fill');
                        } else {
                            input.attr('type', 'text');
                            ths.addClass('ri-eye-fill').removeClass('ri-eye-off');
                        }
                    });
                }
            },
            'textarea[type="ks-textarea"]' : function (ele) {
                var t = $(ele), at = t.attr();
                t.removeAttr('type');
                t.wrap($.tag('ks-textarea', {class:'ks-textarea'}));
                var maxlength = parseInt(t.attr('maxlength'));
                if (maxlength) {
                    t.after('<div class="ks-textarea-maxtit"> <span>' + t.val().length + '</span>/' + maxlength + '</div>');
                    t.keyup(function () {
                        var n = t.val().length;
                        if (n > maxlength) {
                            t.val(t.val().substr(0, maxlength));
                        }
                        t.next('.ks-textarea-maxtit').children('span').text(t.val().length);
                    });
                }
                //高度自适应
                if($.isset(at.auto)){
                    t.height(t[0].scrollHeight);
                    t.input(function(){
                        t.height(0);
                        t.height(t[0].scrollHeight);
                    });
                }
            },
            'input[type="ks-area"]' : function (t) {

                var Fd = ['province', 'city', 'area', 'town'];
                t = $(t);
                t.attr({
                    'type' : 'hidden',
                    'name' : ''
                }).wrap('<ks-area ' + (t.disabled() ? 'disabled' : '') + '></ks-area>');

                var attrs = t.attr();
                var maxlevel = 0;
                var h = '';
                var name = attrs.name;

                $.loop(Fd, function (val, k) {
                    var v = attrs[val];
                    var tname = name ? name + '[' + val + ']' : val;
                    if (v) {
                        v = v.split(':');
                        h += '<span level="' + k + '">' +
                             '<input type="hidden" name="' + tname + '[id]" value="' + v[0] + '">' +
                             '<input type="hidden" name="' + tname + '[name]" value="' + v[1] + '">' +
                             v[1] +
                             '</span>';
                    }
                    if ($.isset(v)) {
                        maxlevel++;
                    }
                });
                t.after(h);
                t.parent().click(function () {
                    var obj = $(this);
                    var input = obj.children('input[type="hidden"]');
                    var attrs = input.attr();
                    //禁用后不做任何操作
                    if (attrs.disabled || obj.disabled()) {
                        return;
                    }
                    var defDt = {};

                    $.loop(Fd, function (val, k) {
                        var v = attrs[val];
                        if (v) {
                            v = v.split(':');
                            defDt[k] = {id : v[0], name : v[1], level : k, field : val};
                        }
                    });
                    obj.area(attrs.title, defDt, function (dt) {
                        if (!dt.isEnd) {
                            return;
                        }
                        obj.removeAttr('province city area town');

                        var valueAttr = {};
                        $.loop(dt.data, function (val) {
                            var tname = name ? name + '[' + val.field + ']' : val.field;
                            valueAttr[val.field] = val.id + ':' + val.name;
                            obj.children('span[level="' + val.level + '"]').html(val.name + '<input type="hidden" name="' + tname + '[id]" value="' + val.id + '"><input type="hidden" name="' + tname + '[name]" value="' + val.name + '">');
                        });
                        input.attr(valueAttr);
                    }, maxlevel, attrs.api);
                });

                //监听属性禁用变化事件
                t.DOMchange('attr.disabled', function () {
                    t.parent().disabled($(this).disabled());
                });

            },
            'input[type="ks-pic"]' : function(t){
                var t = $(t), attrs = t.attr();
                t.attr({type:'file', 'name':'',  accept:'image/*', value:''});
                //多图片上传模式 name最后存在[]
                var isMultiple = /^.+\[\]$/g.test(attrs.name);
                t.wrap('<ks-pic></ks-pic>').wrap('<label icon="add"></label>');
                if(attrs.value){
                    try {
                        //多图模式
                        if(isMultiple){
                            //解析value值 必须传入(必须单引号) {'id'123, src:'图片地址'}
                            attrs.value = JSON.parse(attrs.value.replace(/'/g,'"'));
                            $.loop(attrs.value, function(val){
                                if(val.id){
                                    t.parent().parent().before('<ks-pic><ks-pic-thumb>'+
                                             '<img src="'+val.src+'">'+
                                             '<span icon="delete-bin-2-fill"></span>'+
                                             '<input type="hidden" name="'+attrs.name+'" value="'+val.id+'">'+
                                             '</ks-pic-thumb></ks-pic>');
                                }
                            });
                        //单图模式
                        }else{
                            t.parent().before('<ks-pic-thumb><img src="'+attrs.value+'"></ks-pic-thumb>');
                        }
                    }catch (e) {
                    }

                }

                function _inset(picList){
                    var h = '';
                    if(isMultiple){
                        $.loop(picList,function(value){
                            h += '<ks-pic><ks-pic-thumb>'+
                                 '<img src="'+value.src+'">'+
                                 '<input type="hidden" name="'+attrs.name+'" value="tmp:'+value.aid+'">'+
                                 '<span icon="delete-bin-2-fill" delapi="'+attrs.api+'Del?aid='+value.aid+'"></span>'+
                                 '</ks-pic-thumb></ks-pic>';
                        });
                        t.parent().parent().before(h);
                    }else{
                        $.loop(picList,function(value){
                            h += '<ks-pic-thumb>'+
                                 '<img src="'+value.src+'">'+
                                 '<input type="hidden" name="'+attrs.name+'" value="'+value.aid+'">'+
                                 '</ks-pic-thumb>';
                        });
                        var label = t.parent();
                        label.prev().remove();
                        label.before(h);
                    }
                    t.val('');
                }

                t.change(function(){
                    if(!attrs.api){
                        $.toast('组件缺少api属性');
                        return false;
                    }
                    //如果存在缩放属性时 则缩放后再上传
                    if(attrs.zoomhidth || attrs.zoomheight || attrs.zoom){
                        $.imgZoom(this, (attrs.zoomwidth || 1920), (attrs.zoomweight || 1080), function(blob){
                            $.upload('upload', blob, attrs.api, function(dt){
                                _inset(dt.List);
                            });
                        });
                    }else{
                        $.upload('upload', t[0], attrs.api, function(dt){
                            _inset(dt.List);
                        });
                    }
                });
            },
            'input[type="ks-file"]' : function(t){
                var t = $(t), attrs = t.attr();
                t.attr('type', 'file').css('display','none');
                t.wrap('<ks-btn upload></ks-btn>').wrap('<label icon="upload-cloud-fill" style="display:block"></label>');
            },
            'input[type="ks-files"]' : function(t){
                var t = $(t), attrs = t.attr();
                var fname = attrs.name;
                fname = fname ? fname+'[]' : '';
                t.attr('type', 'file').css('display','none').attr('name', fname+'[]');
                t.wrap('<ks-btn upload></ks-btn>').wrap('<label icon="upload-cloud-fill" style="display:block"></label>');
            }
        });
        //上传文件删除按钮绑定事件
        $(document).on('click', 'ks-pic-thumb > span[icon*=delete]', function(){
            var ths = $(this), delApi = ths.attr('delapi');
            $.Dialog('confirm','操作提示','确认要删除该文件吗？',function(){
                if(delApi){
                    $.API(delApi, '', function(res){
                        res.success && ths.parent().parent().remove();
                    });
                }else{
                    ths.parent().parent().remove();
                }
            })
        });

        //星星评分显示
        $.render('ks-star', function(ele){
            var ele = $(ele), attr = ele.attr(), value = parseInt(attr.value || 0);
            var h = '';
            $.loop(parseInt(attr.max || 5), function(i){
                h += '<i icon="star-fill" '+(value == i ? 'active' : '')+'></i>';
            });
            ele.html(h);

        }, 'attr.value');

        //轮播图
        $.render('.ks-slide', function (ele) {
            ele = $(ele);
            var sdt = ele.attr();
            ele.slide({
                auto : sdt.auto,
                card : sdt.card,
                control : sdt.control,
                status : sdt.status,
            });
        });

        //table渲染
        $.render('table.ks-table', function (ele) {
            ele = $(ele);
            var tr = ele.find('tbody > tr');

            var trFirst = tr.eq(0);
            if (trFirst.children('td:first-child').find('.ks-checkbox').length) {
                tr.children('td:first-child').find('input[type=checkbox]').DOMchange('attr.checked', function () {
                    var t = $(this);
                    var f = t.parents('tr');

                    if (t.checked()) {
                        f.addClass('ks-table-tr-checked');
                    } else {
                        f.removeClass('ks-table-tr-checked');
                    }
                })
            }
        });

        //表格固定头部
        $.render('table.ks-table[fixed-height]', function (ele) {
            ele = $(ele);
            var fixedHeight = parseInt(ele.attr('fixed-height')) || 0;
            if (!fixedHeight) {
                return;
            }
            ele.attr('fixed-height', '');
            var thead = ele.children('thead');
            var allWidth = ele.width(true); //总宽度值
            var dom = $('<div class="ks-table-fixed-header"><div class="ks-table-header"></div><div class="ks-table-body" style="overflow-y: scroll; max-height:' + fixedHeight + 'px"></div></div>');

            var rowCols = ele.children().eq(0).children().children();
            var rowColsNum = rowCols.length - 1;

            var colgroup = '<colgroup>';
            rowCols.each(function (index, el) {
                if (index === rowColsNum) {
                    return;
                }
                var w = $(el).width(true) / allWidth * 100;
                colgroup += '<col style="width:' + w + '%; min-width: ' + w + '%">';
            });
            colgroup += '</colgroup>';
            ele.after(dom);
            dom.find('.ks-table-header').html('<table class="ks-table">' + colgroup + '</table>').find('table').append(thead);
            dom.find('.ks-table-body').append(ele[0]).find('table').prepend(colgroup);

            var scrollWidth = dom.find('.ks-table-body').width(true) - dom.find('.ks-table-body > table').width(true); //滚动条宽度
            var scrollTd = document.createElement('td');
            scrollTd.style.width = scrollWidth + 'px';
            scrollTd.className = 'ks-td-scroll';
            dom.find('.ks-table-header > table > thead > tr').append(scrollTd);
        });

        //自定义组件 表单结构
        $.render('ks-form', function (dom) {
            dom = $(dom);
            var domInline = $.isset(dom.attr('inline')),
                labelWidth = dom.attr('label-width');
            dom.find('ks-form-item').map(function (ele) {
                if (ele._ksa_render_ks_form_item) {
                    return;
                }
                ele._ksa_render_ks_form_item = 1;
                ele = $(ele);
                var attrs = ele.attr();
                !domInline && ele.addClass('ks-clear');
                ele.wrapInner('<ks-form-content></ks-form-content>');
                attrs.label && ele.prepend('<ks-form-label ' + ($.isset(attrs.required) ? 'required' : '') + '>' + attrs.label + '</ks-form-label>');
                attrs.extra && ele.append('<ks-form-extra>' + attrs.extra + '</ks-form-extra>');
                ele.attr({label : '', extra : '', required : ''});

                if (labelWidth) {
                    labelWidth = $.isNumber(labelWidth) ? labelWidth + 'px' : labelWidth;
                    ele.find('ks-form-label').width(labelWidth);
                    ele.find('ks-form-content , ks-form-extra').width('calc(100% - ' + labelWidth + ')');
                }
            });
        });

        //自定义组件 提交按钮
        $.render('ks-btn[submit]', function (dom) {
            dom = $(dom);
            var submits = dom.attr('submit');
            var form = submits ? $(submits) : dom.parents('form');
            if (form.length) {
                dom.click(function () {
                    !dom.disabled() && form.submit();
                });
            }
        });

        //自定义组件 重置按钮
        $.render('ks-btn[reset]', function (dom) {
            dom = $(dom);
            var resets = dom.attr('reset');
            dom.attr('reset', '');
            var form = resets ? $(resets) : dom.parents('form');
            if (!form.length) {
                form = dom.parents('ks-form');
            }
            if (form.length) {
                dom.click(function () {
                    form.find('input:not([type="hidden"]), select, textarea').val('');
                });
            }
        });

        //自定义组件 折叠面板
        $.render('ks-collapse', function (ele) {
            $(ele).children().map(function (el) {
                el = $(el);
                var attr = el.attr();
                el.wrapInner('<ks-collapse-block></ks-collapse-block>').wrapInner('<ks-collapse-content></ks-collapse-content>');
                el.prepend('<ks-collapse-title>' + (attr.label || '') + '</ks-collapse-title>')

                var Pt = el.parent(), isAccordion = $.isset(Pt.attr('accordion'));
                var content = el.children('ks-collapse-content');
                //如果默认打开，必须赋予实际高度值以完成css3动画
                if (el.active()) {
                    content.height(content.children('ks-collapse-block').height(true, true));
                }
                el.children('ks-collapse-title').click(function () {
                    var maxH = content.children('ks-collapse-block').height(true, true);
                    if (el.active()) {
                        content.height(0);
                        el.active(false);
                    } else {
                        content.height(maxH);
                        el.active(true);
                        var acList = isAccordion ? el.siblings() : !!0;//手风琴面板同辈
                        if (acList) {
                            acList.active(false);
                            acList.children('ks-collapse-content').height(0);
                        }
                    }
                });
            });
        });

        //自定义组件 价格标签
        $.render('ks-price', function (ele) {
            var ele = $(ele);
            function _inup(v){

                var txtele = ele.contents();
                var txt = v ? v : txtele.eq(0).text().trim();
                txtele.map(function(){
                    this.textContent = '';
                });
                txtele.nextAll('', 1).remove();
                txt = txt.replace(/([^0-9]+)/gi, '<unit>$1</unit>');
                txt = txt.replace(/(\.[0-9]+)/g, '<small>$1</small>');

                if ($.isset(ele.attr('split'))) {
                    txt = txt.replace(/([0-9]+)\.?/, function (v) {
                        v = v.replace(/([0-9])([0-9]{3})$/g, '$1,$2');
                        return '<strong>' + v + '</strong>';
                    });
                }
                ele.append(txt);
            }
            _inup();
            ele.DOMchange('html', function(str){
                _inup(str);
            });
        }, 'html');

        //自定义组件 卡片盒子
        $.render('ks-card', function (ele, isMonitor) {
            ele = $(ele);
            var attrs = ele.attr();
            var title = ele.children('ks-card-title');
            var content = ele.children('ks-card-content');
            //如果没有定义content则包裹
            if (!content.length) {
                ele.wrapInner('<ks-card-content></ks-card-content>');
                title.length && ele.prepend(title);
            }

            //title存在 则附加title
            if (title.length) {
                //二次监听渲染时处理
                if (isMonitor) {
                    if (attrs.label) {
                        title.html(attrs.label);
                    } else {
                        title.remove();
                    }
                }
            } else if (attrs.label) {
                ele.prepend($.tag('ks-card-title', {icon : attrs.icon}, attrs.label));
            }
            ele[0].removeAttribute('icon');
            ele[0].removeAttribute('label');
        }, 'attr.label attr.icon');

        //自定义组件 警示框渲染
        $.render('ks-alert', function (ele) {
            var ele = $(ele), attrs = ele.attr(), isClose = $.isset(attrs.close);
            var prehtml = '';
            if (attrs.title) {
                prehtml += '<ks-alert-title>' + attrs.title + '</ks-alert-title>';
            }
            if (isClose) {
                prehtml += '<ks-alert-close icon="close"></ks-alert-close>';
            }
            ele.prepend(prehtml);
            ele.attr('title', '');
            if (isClose) {
                ele.children('ks-alert-close').click(function () {
                    ele.css('opacity', '0');
                    window.setTimeout(function () {
                        ele.remove();
                    }, 300);
                });
            }
        });

        //自定义组件 头像组件
        $.render('ks-avatar', function (ele) {
            ele = $(ele);
            var attr = ele.attr();
            var code = '', label = attr.label && !attr.src ? attr.label : null;
            if (label) {
                code = label;
            } else if (attr.src) {
                code = ('<img src="' + attr.src + '">');
            } else {
                code = '<i icon="user"></i>';
            }
            ele.html(code);
        }, 'attr.label attr.src');

        //自定义组件 分页器渲染
        $.render('ks-page', function (ele) {
            function _pgTo(val, isInit) {
                if (ele.disabled() || val == ele[0].value) {
                    return;
                }
                if (val === 'prev') {
                    val = ele[0].value - 1;
                    val = val < 1 ? 1 : val;
                } else if (val === 'next') {
                    val = ele[0].value + 1;
                    val = val > total ? total : val;
                }
                val = parseInt(val);

                ele.children('ks-page-prev').disabled(val === 1);
                ele.children('ks-page-first').disabled(val < pageNum / 2);

                ele.children('ks-page-next').disabled(val === total);
                ele.children('ks-page-last').disabled(val > total - pageNum / 2);

                ele.attr('current', val);
                ele[0].value = val;
                var startPg = val - ((pageNum - 1) / 2);
                var endPg = total - pageNum + 1;
                startPg = startPg > endPg ? endPg : startPg;
                startPg = startPg < 1 ? 1 : startPg;
                ele.children('a').map(function (a) {
                    $(a).attr('value', startPg).text(startPg);
                    startPg++;
                });
                ele.children('a[value="' + val + '"]').active(true).siblings('a').active(false);
                ele.find('.ks-input-group > input').val(val);
                !isInit && ele.trigger('change');
            }

            ele = $(ele);
            var total = parseInt(ele.attr('total') || 0);
            if (!total) {
                return;
            }
            var current = parseInt(ele.attr('current') || 1);
            var pageNum = parseInt(ele.attr('numbers') || 5); //最多显示多少个页码

            var href = ele.attr('href');
            var pgcode = '';
            (function () {
                var start = Math.ceil(current - ((pageNum - 1) / 2));
                start = start < 1 ? 1 : start;

                var mx = Math.min(total + 1, start + pageNum);
                if (mx <= 2) {
                    return;
                }

                for (var i = start; i < mx; i++) {
                    pgcode += $.tag('a', {
                        active : current === i ? true : null,
                        value : i,
                        href : href ? href.replace('{{page}}', val) : null
                    }, i);
                }
            })();
            if (!pgcode) {
                return;
            }
            var H = '<ks-page-first icon="arrow-left" value="1"></ks-page-first><ks-page-prev icon="arrow-left-s" value="prev"></ks-page-prev>';
            H += pgcode;
            H += '<ks-page-next icon="arrow-right-s" value="next"></ks-page-next><ks-page-last icon="arrow-right" value="' + total + '"></ks-page-last>';
            if ($.isset(ele.attr('quick'))) {
                H += '<ks-input-group><i>转</i><input type="text" value="' + current + '"><i>页</i></ks-input-group>';
            }

            ele.html(H);
            _pgTo(current, true);
            ele.children('*:not(ks-input-group)').click(function () {
                var el = $(this);
                if (el.disabled()) {
                    return;
                }
                _pgTo(el.attr('value'));
            });
            ele.find('ks-input-group > input').keyup(function (e) {
                if (e.keyCode === 13) {
                    _pgTo(this.value);
                }
            }).focus(function () {
                $(this).select();
            });
        }, 'attr.total attr.quick attr.numbers');

        //自定义组件 H5主框架
        $.render('ks', function (ele) {
            ele = $(ele);
            if (ele.children('ks-side').length) {
                ele.css('flex-direction', 'row');
            }

            var navbar = ele.children('ks-navbar');

            if (navbar.length) {
                ele.attr('navbar', true);

                var navbarItem = navbar.children('ks-navbar-item');
                var contents = ele.children('ks-content').children('ks-navbar-content');

                //显示底部导航对应的内容区
                function _navbarContentShow(el, key) {
                    contents.filter('[key="' + key + '"]').show().siblings().hide();
                }

                navbarItem.each(function (i, el) {
                    el = $(el);
                    var skey = el.attr('key');
                    if (el.active()) {
                        _navbarContentShow(el, skey);
                    }
                    el.click(function () {
                        $(this).active(true);
                    }).DOMchange('attr.active', function () {
                        var el = $(this);
                        if (el.active()) {
                            //去掉同辈活动状态
                            el.siblings().active(false);
                            //更新content
                            _navbarContentShow(el, skey);
                        }
                    });
                });
            }
        });

        $(document).on('click', 'ks-navbar-item[href]', function(){
            var href = $(this).attr('href');
            if(href){
                window.location.href = href;
            }
        });

        //自定义组件 栅格
        $.render('ks-row', function (ele) {
            ele = $(ele);
            if (ele.children('ks-col').length) {
                ele.attr('flex', true);
            }
        });

        //自定义组件 tab
        $.render('ks-tab', function (ele) {
            ele = $(ele);

            function _titleStatus(N) {
                N = N >= 0 ? N : 0;
                var el = title_item.eq(N);
                var left = (el[0].offsetLeft + el.width(true) / 2);
                titleStatus.css('left', left < 30 ? 30 : left);
                title_item.eq(N).active(true).siblings().active(false);
            }

            var isTouch = $.isset(ele.attr('touch'));
            var title = ele.children('ks-tab-title');
            var title_item = title.children('ks-tab-title-item'); //子级标题
            var contentBox = ele.children('ks-tab-content'); //主内容框
            var content_item = ele.find('ks-tab-item');
            var itemLength = content_item.length;

            var code_title_status = '<ks-tab-title-status></ks-tab-title-status>';
            //如果标题栏不存在 则新建
            if(!title.length){
                title = $('<ks-tab-title></ks-tab-title>');
                content_item.each(function (i, el) {
                    el = $(el);
                    title.append($.tag('ks-tab-title-item', {active : el.active()}, (el.attr('label') || i) ));
                });
                ele.prepend(title);
                title_item = title.children('ks-tab-title-item');
            }
            title.append(code_title_status);
            var titleStatus = title.children('ks-tab-title-status');
            //如果主内容框不存在 则创建
            if(!contentBox.length){
                content_item.wrapAll('<ks-tab-content></ks-tab-content>');
                contentBox = ele.children('ks-tab-content');
            }


            var currIndex = title_item.filter('[active]').index() || 0,
                moveX = 0,
                eleWidth = ele.width(true),
                touchMaxWidth = itemLength * eleWidth;


            contentBox.addClass('ks-clear');


            function  _play(N) {
                N = parseInt(N || 0);
                moveX = (0 - eleWidth * N);
                isTouch ? contentBox.removeClass('ks-no-transition').css({transform : 'translateX(' + moveX + 'px)'}) : content_item.eq(N).show().active(true).siblings().hide().active(false);
            }


            title_item.click(function () {
                if(!$(this).active()) {
                    _titleStatus($(this).index());
                }
            }).DOMchange('attr.active', function () {
                var ths = $(this);
                if(ths.active()){
                    var i = ths.index();
                    _play(i);
                    //ths.trigger('click'); //触发标题当前项click事件 暂时注释 会与tpl @事件冲突造成2次触发2021年1月23日 03:15:16
                }
            });

            if (isTouch) {
                contentBox.wrap('<ks-tab-touch-content></ks-tab-touch-content>')
                contentBox.width(touchMaxWidth);
                content_item.width(eleWidth);

                ele.children('ks-tab-touch-content').touch(function () {

                }, function (evn, touch) {
                    if (touch.action === 'left' || touch.action === 'right') {
                        var mx = (moveX + touch.moveX);
                        var max = 0 - (touchMaxWidth - eleWidth);
                        mx = mx > 0 ? 0 : (mx < max ?  max : mx);
                        contentBox.addClass('ks-no-transition').css({transform : 'translateX(' + mx + 'px)'})
                    }
                }, function (evn, touch) {
                    //横向移动距离超过10%才触发 x
                    if (currIndex < itemLength - 1 && touch.action == 'left') {
                        currIndex++;
                        //_play(currIndex);
                        title_item.eq(currIndex).trigger('click'); //触发标题当前项click事件
                    } else if (currIndex > 0 && touch.action == 'right') {
                        currIndex--;
                        //_play(currIndex);
                        title_item.eq(currIndex).trigger('click'); //触发标题当前项click事件
                    } else {
                        contentBox.removeClass('ks-no-transition').css({transform : 'translateX(' + moveX + 'px)'})
                    }
                }, 'X');
            }
            _play(currIndex);
            _titleStatus(currIndex);
        });


        //自定义组件 tag标签关闭
        $.render('ks-tag[close], ks-tag[edit]', function (ele) {
            ele = $(ele);
            var attr = ele.attr();
            ele.wrapInner('<span></span>');
            if (attr.edit) {
                var input = $('<input type="hidden" value="' + ele.text() + '">');
                input.blur(function () {
                    var val = input.val();
                    input.attr('type', 'hidden');
                    input.prev().css('opacity', '').text(val);
                    $.callStrEvent.call(ele[0], attr.edit, val);
                });
                ele.append(input);
                ele.click(function () {
                    input.prev().css('opacity', '0');
                    input.attr('type', 'text').focus().select();
                });
            }

            if ($.isset(attr.close)) {
                var btn = $('<i icon="close"></i>');
                btn.click(function (evn) {
                    var x;
                    attr.close && (x = $.callStrEvent.call(ele[0], attr.close, evn));
                    x !== false && ele.remove();
                    return false;//阻止冒泡
                });
                ele.append(btn);
            }
        });

        //title必须在最后渲染
        $.render('[title]', function (ele) {//title提示文字处理
            ele = $(ele);
            var tit = ele.attr('title');
            if (tit) {
                ele.hover(function () {
                    $.showTip(ele);
                    ele.attr('title', '');
                }, function () {
                    ele.attr('title', tit);
                });
            }
        });
        //图标转换
        $.render('[icon]', function (ele) {
            var icon = ele.attributes.icon.value;
            if (icon) {
                ele.className += ' ri-' + icon;
            }
        });
    })();

    //开始渲染流程
    _KSArenderStart();
})(KSA);