/**
 * KSAUI 前端UI组件库 V1.0
 *
 * 目前版本还处于开发中，请勿保存并用于生产环境！
 *
 * ---------------------------------------
 * 待正式发布版本后，源代码将会公开开源
 *
 * Author : ksaos.com && cr180.com(Mr Wu -  ChenJun)
 * Update : 2020年7月29日
 */

$.plugin.ZINDEX = 999;
$.plugin.WINID = 1; //弹窗层初始ID
$.plugin.W = 0; //当前窗口宽度
$.plugin.H = 0; //当前窗口高度
$.plugin.mouseX = 0;
$.plugin.mouseY = 0;
$.plugin.device = 'PC'; //设备类型 PC MOBILE
$.plugin.deviceView = 0; //横屏竖屏 0=横屏 1=竖屏


(function(){
	$.W = window.innerWidth;
	$.H = window.innerHeight;

	var agent = navigator.userAgent.toLowerCase();
	//判断是否移动端
	if (/android|ipad|iphone|applewebkit|windows phone|windows ce|windows mobile/.test(agent) && ('ontouchstart' in document.documentElement)) {
		$.device = 'MOBILE';
	}
	if($.device =='PC'){
		//监听鼠标坐标
		$(document).on('mousemove',function(e){
			$.mouseX = e.x || e.layerX || 0;
			$.mouseY = e.y || e.layerY || 0;
		});
	}
	$(document).ready(function(){
		$.render();
		//DOM变化监听
		window.setTimeout(function(){
			document.addEventListener('DOMNodeInserted',function(){
				$.render();
			});
		},60);
	});
})();

/**
 * 移动端 不转页后退事件监听
 * @param {string} id 标识
 * @param {document} showID 需要关闭的dom(jquery) 不传入表示取消id监听
 * 后退检测到需要关闭的dom时会直接remove
 */
$.plugin.BackEvent = function(id, showID){
	var $this = this;
	$this.BackEventData = $this.BackEventData ? $this.BackEventData : {};
	$this.BackEventData.doms = $this.BackEventData.doms ? $this.BackEventData.doms : {};
	var Url = window.location.href;
	var idMrk = '#'+id;
	if(showID){
		if(Url.indexOf(idMrk) == -1) {
			//history.pushState('', '', Url+idMrk);
			location.hash += idMrk;
		}
		$this.BackEventData.doms[id] = showID;
	}else{
		if(Url.indexOf(idMrk) != -1) {
			var newevn = {};
			$.loop($this.BackEventData.doms,function(v, k){
				if(k != id){
					newevn[k] = v;
				}
			});
			$this.BackEventData.doms = newevn;
			window.history.go(-1);
		}
		return;
	}

	if(!$this.BackEventData.init){
		$this.BackEventData.init = 1;
		$(window).on('popstate',function(){
			var u = window.location.href.indexOf('#');
			u = u == -1 ? '' : window.location.href.substr(u);
			var urlexps = {};
			$.loop($.explode('#', u),function(value){
				if(value){
					urlexps[value] = value;
				}
			});
			var newevn = {};
			$.loop($this.BackEventData.doms,function(v, k){
				if(!urlexps[k]){
					$this.layerHide($(v).attr('key'));
				}else{
					newevn[k] = v;
				}
			});
			$this.BackEventData.doms = newevn;
		});
	}
}

/**
 * 监听窗口变化并在窗口变化后回调
 * @param {func} Fun 回调函数 参数1=宽度 参数2=高度
 * @param {number} ime 是否立即执行一次 1=立刻执行 2=dom完毕执行 3=1、2同时
 */
$.plugin.resize = function(Fun, ime){
	var $this = this;
	if(ime ==1 || ime ==3){
		Fun(window.innerWidth, window.innerHeight);
	}else if(ime ==2 || ime ==3){
		$(document).ready(function(){
			Fun(window.innerWidth, window.innerHeight);
		})
	}
	//监听窗口变化
	$(window).resize(function(){
		Fun && typeof(Fun) =='function' && Fun(window.innerWidth, window.innerHeight);
		$this.deviceView = typeof(window.orientation) && $.inArray(window.orientation, [0,-90]) ? 0 : 1;
	});
}

/**
 * 本地缓存操作
 写：Val= string || JSON
 删：Val=''
 读：Val=false
 * @constructor
 * @param {String} Key 键名
 * @param {String} Val 缓存内容（可以是一个JSON对象）
 */
$.plugin.Cache = function(Key,Val){
	if (typeof(Storage) !== "undefined") {

		if(typeof(Val) ==='string' && !Val){//删除
			localStorage.removeItem(Key);
			localStorage.removeItem(Key+'_jsjson');
			return true;
		}else if(typeof(Val) !=='undefined'){//添加
			if(typeof(Val) === 'object'){
				Val = JSON.stringify(Val);
				localStorage.setItem(Key+'_jsjson', 1);
			}
			localStorage.setItem(Key, Val);
			return this.Cache(Key);
		}else{//获取
			Val = localStorage.getItem(Key);
			if(localStorage.getItem(Key+'_jsjson') =='1'){
				Val = JSON.parse(Val);
			}
			return Val;
		}
	} else {
		return false;
	}
}
/**
 * 定位浮动层 限制在当前窗口内自适应围绕
 * @param centerObj 相对DOM对象
 * @param fellows 浮动层DOM对象
 * @constructor
 */
$.plugin.Position = function(centerObj,fellows){
	centerObj = $(centerObj);
	fellows = $(fellows);
	var offset = {left:centerObj.offset().left, top:(centerObj.offset().top+centerObj.height(true))};
	if(offset.left > this.W - fellows.width(true)){
		offset.left = offset.left - fellows.width(true) - centerObj.height(true);
	}
	if(offset.top > this.H - fellows.height(true)){
		offset.top = offset.top - fellows.height(true)- centerObj.height(true);
	}
	fellows.css(offset);
}

/**
 * 关闭当前iframe所在的父级layer
 */
$.plugin.layerHideF = function(){
	if(! typeof(window.parent)){
		return;
	}
	var id = $('body').attr('parentlayerid');
	if(id){
		window.parent.KSAUI.layerHide(id);
	}
}

/**
 * 删除弹出层
 * @param {number} Id 弹出层ID
 */
$.plugin.layerHide = function(Id, Fun){
	var $this = this;
	var o;
	if(!Id){
		Id = $this.layerID;
	}
	o = $('#ks-layer-'+Id);
	var option = $.layerOption[Id] ? $.layerOption[Id] : {};
	if(Id){
		var pos = o.attr('pos');
		o.addClass('_ksaui_layer_close_');
		var h = o.find('.ks-layer-content').height(true);
		var css = {transition:'all 0.2s',opacity:0};
		if($.inArray(pos,[1,2,3,5])){
			css.margin = (0-h/3)+'px 0 0 0';
		}else if(pos == 4){
			css.margin = '0 0 0 '+(0-h)+'px';
		}else if(pos == 6){
			css.margin = '0 0 0 '+h+'px';
		}else if($.inArray(pos,[7,8,9])){
			css.margin = '0 0 '+(0-h)+'px';
		}else if(pos =='00'){
			css.margin = '0 0 0 100%';
		}
		if(pos == 5){
			css.transform = 'scale(0)';
		}
		o.css(css);
		var nextEle = o.next('[data-layer-key="'+Id+'"]');
		nextEle.length && nextEle.css({transition:'all 0.2s',opacity:0});
		setTimeout(function(){
			if(option.close && typeof(option.close) == 'function'){
				option.close();
			}
			option.backEvent && $this.BackEvent('KsaLayer'+Id);
			Fun && typeof(Fun) =='function' && Fun(Id);
			if(option.cache){
				nextEle.length && nextEle.hide();
				o.hide();
			}else{
				nextEle.length && nextEle.remove();
				o.remove();
				$.layerOption[Id] = null;
			}
		},90);
	}

}

/**
 * 创建一个弹窗（所有弹出层 底层驱动）
 * @param {JSON/html/document} option 窗口HTML内容 或 JSON配置参数 或 jquery元素对象
 * @param {number} pos 窗口定位 （可选，可在参数1通过json配置）
 * 						00 : 从右到左滑出一个全屏（移动端适用 cover参数固定为0）
 * 					自动定位传值： jQ选择器 (根据元素坐标相对定位 适合各种下拉菜单、提示框)
 * 					指定定位传值：
 * 							1 2 3
 * 							4 5 6
 * 							7 8 9
 * @param {number} cover 是否遮罩层 0=否 1=是 2=是（带点击关闭窗口事件） 3=是（带双击关闭窗口事件）
 * @param {func} showFun 弹窗显示后回调（可选，可在参数1通过json配置）
 * @param {func} closeFun 弹窗关闭后回调（可选，可在参数1通过json配置）
 * @param {func} btnFun 底部按钮点击回调（可选，可在参数1通过json配置）
 * @param {func} initFun 初始化后回调函数（可选，可在参数1通过json配置）
 * @returns {k.fn.init}
 */

$.plugin.layer = function(option, pos, cover, showFun, closeFun, btnFun, initFun){
	var $this = this;
	$.layerOption = $.layerOption ? $.layerOption : {};

	if(typeof(option) =='string' || (option instanceof $ && option[0].innerHTML)){
		option = {content : option};
	}

	option = $.arrayMerge({
		el : $.layerEL || '', //弹窗位置被限制在哪个元素中
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
		cover : 0, //是否遮罩层 0=否 1=是 2=是（带点击关闭窗口事件） 3=是（带双击关闭窗口事件） 坐标={top:0,right:0,bottom:0,left:0,event:click|dblclick}
		outTime : 0,//自动关闭时间 秒
		init : initFun, //初始化回调（还未添加到body中） 参数[layerDom]
		show : showFun, //弹出后回调 参数[layerDom]
		close : closeFun, //关闭后回调 无参数
		closeBtn : 1, //是否需要右上角关闭按钮 1=是 0=否
		backEvent : null, //是否需要监听后退事件 1=是 0=否
		cache : null, //是否缓存 传入唯一缓存键名
		maxHeight : 0, //内容区最大高度
		height : null, //内容区固定高度
	},option);


	//手机端默认监听后退事件
	if(option.backEvent === null && $.device =='MOBILE'){
		option.backEvent = 1;
	}
	//全屏强制去掉遮罩层
	if(option.pos =='00'){
		option.cover = 0;
	}
	//遮罩层配置处理
	if(option.cover){
		option.cover = $.arrayMerge({
			top:0, right:0, bottom:0, left:0, event : $.device == 'MOBILE' ? 'touchend' : (option.cover == 3 ? 'dblclick' : option.cover == 2 ? 'click' : '')
		}, $.isObject(option.cover) ? option.cover : {});
	}

	var tmpOption = option;//声明一个临时配置变量用于全局缓存
	option.type = option.type ? option.class+' '+option.class+'_'+option.type : '';
	option.cache = option.cache ? option.cache : null;
	if(option.iframe){
		option.class += ' ks-layer-iframe';
		option.content = '<iframe src="'+option.iframe+'" width="100%" height="100%"></iframe>';
	}

	var elSize = {W:$.W, H:$.H, L:0, T:0};
	//如果指定了layer覆盖的对象范围 则处理
	if(option.el){
		option.el = $(option.el);
		elSize = {W:option.el.width(), H:option.el.height(), L:option.el.offset().left, T:option.el.offset().top};
		elSize.W = elSize.W > $.W ? $.W : elSize.W;
		elSize.H = elSize.H > $.H ? $.H : elSize.H;
	}
	function __run() {

		//层级序号自增
		$.ZINDEX++;
		var D, H, Id, cacheID;
		//添加缓存键名
		if (option.cache) {
			$.loop($.layerOption, function(val, k){
				if(val.cache ==  option.cache){
					cacheID = '#ks-layer-'+k;
				}
			});
		}
		if (cacheID) {
			D = $(cacheID);
			Id = D.attr('key');
		} else {
			var pos = typeof(option.pos) =='object' ? 0 : option.pos;
			Id = $.ZINDEX + 1;
			$.layerOption[Id] = tmpOption; //配置缓存到全局
			H = '<div class="ks-layer ' + option.class + ' ' + option.type + ' _pos_' + pos + ' _ks-layer_start_" pos="' + pos + '" id="ks-layer-' + Id + '" style="z-index: ' + Id + '" key="' + Id + '">';

			//关闭按钮
			if (option.closeBtn) {
				H += '<span class="ks-layer-close" icon="close"></span>';
			}
			//标题栏
			if (option.title) {
				H += '<div class="ks-layer-title">' + option.title + '</div>';
			}
			H += '<div class="ks-layer-content"></div>';
			//按钮处理
			if (option.btn) {
				var s = '';
				if(option.btn) {
					if($.isString(option.btn)){
						s += '<button type="button" class="ks-btn" size="small" data-btn-index="0">'+option.btn+'</button>';
					}else{
						$.loop(option.btn, function (val, k) {
							val = val.split(':');
							var attr = $.isset(val[1]) ? ' color="' + val[1] + '"' : '';
							s += '<button type="button" class="ks-btn" size="small" class="_' + k + '" data-btn-index="' + k + '" ' + attr + '>' + val[0] + '</button>';
						});
					}

				}
				H += s ? '<div class="ks-layer-bottom">' + s + '</div>' : '';
			}
			H += '</div>';
			D = $(H);

		}
		D.show();

		//添加layerID
		D.layerID = Id;
		if (!cacheID) {
			//添加content
			D.find('.ks-layer-content').html(option.content);

			//关闭事件 右上角按钮
			D.find('.ks-layer-close').click(function () {
				clearTimeout(AutoEvn);
				D.close();
			});

			//底部按钮处理
			if (option.btn) {
				D.find('.ks-layer-bottom .ks-btn').click(function () {
					var t = $(this);
					if (!t.attr('disabled') && (!option.btnFun || (typeof (option.btnFun) == 'function' && option.btnFun(t.data('btn-index'), t, D) !== false))) {
						clearTimeout(AutoEvn);
						D.close();

					}
				});
			}

			$('body').append(D);


			//遮罩层点击关闭事件
			if(option.cover) {
				var cover = $('<div class="ks-layer-cover" data-layer-key="' + Id + '" style="z-index: ' + (Id - 1) + '"></div>');
				cover.css({left:option.cover.left, top:option.cover.top, right:option.cover.right, bottom:option.cover.bottom});
				//触发事件
				if (option.cover.event) {
					cover.on(option.cover.event, function () {
						var t = $(this);
						if (!t.attr('disabled')) {
							t.attr('disabled', 1);
							clearTimeout(AutoEvn);
							D.close();
						}
					});
				}
				D.after(cover);
			}

			//iframe body加当前ID
			if (option.iframe) {
				D.iframe = null;
				D.find('iframe')[0].onload = function () {
					D.iframe = $(this.contentWindow.document.body);
					D.iframe.attr('parentlayerid', Id);
				};
			}
		}
		//内容区最大高度处理
		var cententMaxH = $.H;
		if (D.find('.ks-layer-title').length) {
			cententMaxH -= D.find('.ks-layer-title').height(true, true);
		}
		if (D.find('.ks-layer-bottom').length) {
			cententMaxH -= D.find('.ks-layer-bottom').height(true, true);
		}
		if (option.height) {
			var oph = option.height;
			//百分比值支持
			if ($.isString(oph) && oph.indexOf('%')) {
				oph = cententMaxH * parseFloat(oph) / 100;
			}
			D.find('.ks-layer-content').css('height', oph);
		}
		if (option.maxHeight) {
			var opmh = option.maxHeight;
			//百分比值支持
			if ($.isString(opmh) && opmh.indexOf('%')) {
				opmh = cententMaxH * parseFloat(opmh) / 100;
			}
			D.find('.ks-layer-content').css('max-height', opmh);
		}
		if (option.width) {
			var opw = option.width;
			//百分比值支持
			if ($.isString(opw) && opw.indexOf('%')) {
				opw = parseFloat(opw);
				opw = elSize.W * opw / 100;
			}
			D.css('width', opw);
		}

		//CSS定位动画
		var css = {margin: '100px 0 0 0', left: 0, top: 0};

		function P() {

			var pos = option.pos;
			var w = D.width(true), h = D.height(true);
			if ($.inArray(pos, ['00',1, 2, 3, 4, 5, 6, 7, 8, 9])) {
				if ($.inArray(pos, [1, 2, 3, 5, 8])) {
					css.margin = (0 - h / 3) + 'px 0 0 0';
				} else if (pos == 4) {
					css.margin = '0 0 0 ' + (0 - h) + 'px';
				} else if (pos == 6) {
					css.margin = '0 0 0 ' + h + 'px';
				}
				//X轴居中
				if ($.inArray(pos, [2, 5, 8])) {
					css.left = (elSize.W - w) / 2;
					if (pos == 5) {
						css.transform = 'scale(0)';
					}
				}
				//X轴居右
				if ($.inArray(pos, [3, 6, 9])) {
					css.left = elSize.W - w;
				}
				//Y轴居中
				if ($.inArray(pos, [4, 5, 6])) {
					css.top = (elSize.H - h) / 2;
				}
				//Y轴底部
				if ($.inArray(pos, [7, 8, 9])) {
					if (pos == 8) {
						css.top = 'initial';
						css.bottom = '0';
						css.margin = '0 0 ' + (0 - h) + 'px 0';
					} else {
						css.top = elSize.H - h;
						css.margin = h + 'px 0 0';
					}
				}

				if (pos == '00') {
					css.top = '0';
					css.bottom = '0';
					css.margin = '0 0 0 100%';
				}
				//坐标加上祖先容器偏移值（如果有）
				css.left += elSize.L;
				css.top += elSize.T;
				//如果定位不是既定位置 则认为是一个选择器 自适应定位
			} else {
				var to = $(pos);
				var toh = to.height(true);
				css.left = to.offset().left;
				css.top = to.offset().top + toh;
				if (elSize.W > 0 && css.left > elSize.W - D.width(true)) {
					css.left = css.left - D.width(true) + to.width(true);
				}

				//如果弹出层Y坐标与自身高度超出可视区 则定位到基点上方
				var sh = $(document).scrollTop();//卷去高度
				if (elSize.H >0 && elSize.H - (css.top - sh) < D.height(true)) {
					css.margin = '-100px 0 0';
					css.top = css.top - D.height(true) - toh;
				}
			}
			D.css(css);
		}

		P();

		setTimeout(function () {
			D.addClass('_ksaui_layer_open_').css({
				margin: 0,
				opacity: 1,
				transition: 'all 0.2s',
				transform: 'scale(1)'
			});
			D.next('[data-layer-key="' + Id + '"]').show().css({opacity: 1});

			//后退事件监听
			option.backEvent && D.BackEvent('KsaLayer'+Id, '#ks-layer-'+Id);
			//初始化回调
			!cacheID && typeof (option.init) == 'function' && option.init(D, Id);
			//show回调函数
			typeof (option.show) == 'function' && option.show(D, Id);

		}, 100);

		var AutoEvn;
		//N秒自动关闭
		if (option.outTime > 0) {
			AutoEvn = setTimeout(function () {
				D.close();
			}, option.outTime * 1000 + 50);
		}

		//按ESC键处理
		$(document).off('keydown.ks-layer').on('keydown.ks-layer', function (e) {
			if (e.keyCode == 27) {
				//关闭浮动窗口
				var o;
				o = $('.ks-layer').last();
				if (o.length) {
					$this.layerHide(o.attr('key'));
				}
			}
		});
		return D;
	}
	var R = __run();
	if(option.ajaxUrl){
		$this.AJR(option.ajaxUrl,option.ajaxPost,function(d){
			R.Q.children('.ks-layer-content').html(d);
		});
	}
	return R;
}

/**
 * 对话框操作 (基于layer层)
 * 参数介绍：
 * 普通		参数：	1=标题 2=内容 3=自动关闭时间 4=按钮文字 5=按钮回调函数 6=关闭回调函数
 * 成功|失败	参数：	1=success|error 2=内容 3=关闭回调函数 4=按钮文字
 * 确认框 	参数：	1=confirm 2=标题 3=内容 4=确认回调函数 5=按钮文字
 * 表单框 	参数：	1=form 2=标题 3=数据 4=确认回调函数 5=按钮文字
 */
$.plugin.Dialog = function(type){
	var $this = this;
	var p = arguments;
	var op = {class : 'ks-Dialog'};
	switch (true) {
		//成功|失败 参数：2=内容 3=关闭回调函数 4=按钮文字
		case $.inArray(type,['success','error']):
			op.content = p[1];
			op.close = p[2];
			op.btn = p[3];
			op.class += '_'+type;
			op.closeBtn = 0;
			op.outTime = 3;
			op.cover = 2;
			op.backEvent = false;
			break;

		//确认 参数： 2=标题 3=内容 4=确认回调函数 5=按钮文字
		case type =='confirm':
			var btn = p[4], callFun = p[3];
			btn = btn && $.isString(btn) ? {'confirm':btn} : (btn || {'cancel':'取消','confirm':'确认'});
			op.title = p[1];
			op.content = p[2];
			op.close = null;
			op.btn = btn;
			op.outTime = 0;
			op.cover = 1;
			op.btnFun = function(a, b, c, d ){
				if(a =='confirm' && typeof(callFun) =='function'){
					return callFun(b, c, d);
				}
			};
			op.class += '_'+type;
			op.closeBtn = 0;
			break;
		/*表单弹窗 第三个参数：
            [
                {name:'字段名', type:'展现类型select/radio/checkbox/switch/text', text:'表单标题名称', value:'默认值', option:[多个选项列表键名=值 键值=名称]},
                ...
            ]
        */
		case type =='form':
			var H = $this.newForm(p[2]);

			var callFun = p[3];
			op.title = p[1];
			op.content = H;
			op.close = null;
			op.btn = {'cancel':'取消', 'confirm':(p[4] ? p[4] :'确认')};
			op.outTime = 0;
			op.cover = 1;
			op.btnFun = function(a, b, c, d ){
				if(a =='confirm' && typeof(callFun) =='function'){
					return callFun(b, c, d);
				}
			};
			op.class += '_'+type;
			op.closeBtn = 1;

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
	return this.layer(op);
}

/**
 * mini提示框
 * @param {html} msg 提示内容
 * @param {success/error/null} tps 状态 success=成功 error=错误
 * @param {func} callFun 窗口关闭后回调函数
 * @param {number} outTime 关闭时间(秒) 0=一直显示
 * @returns {k.fn.init}
 */
$.plugin.toast = function(msg, tps, callFun, outTime){
	var cover = 0;
	outTime = typeof(outTime) =='undefined' ? 2 : outTime;
	if(msg =='loading'){
		msg = '数据加载中';
		callFun = tps;
		tps = 'loading';
		cover = 3;
	}
	if(tps){
		msg = '<div icon="'+tps+'">'+msg+'</div>';
	}
	return this.layer({
		content : msg,
		class : 'ks-Dialog_toast',
		type : tps,
		cover : cover,
		close : callFun,
		outTime : outTime,
		backEvent : false
	});
}

/**
 * 创建一个新的全屏页面
 * @param option 参数同layer
 */
$.plugin.openWindow = function(option){
	var h = '<div class="ks-hdbar">';
	if(option.backBtn === null || option.backBtn !== false){
		h += '<span icon="back" onclick="window.history.go(-1);"></span>';
	}
	h += '<div class="ks-hdbar-title">'+option.title+'</div>';
	h += '</div>';

	return this.layer($.arrayMerge(option, {
		title : h,
		content : '<div class="layer-loading"><i icon="loading"></i>加载中</div>',
		width : '100%',
		height : '100%',
		maxHeight : false,
		pos : '00',
		class : 'openWindow'
	}));
}

/**
 * 关闭函数 所有KSAUI事件综合处理
 * @param closeFun
 */
$.plugin.close = function(closeFun){
	var q = this.Q;
	this.layerID && this.layerHide('', closeFun);
}

/**
 * 将各种日期/时间戳转换为对象
 * @param str 带格式的日期/时间戳
 * @param F 需要输出的格式(存在则输出日期，否则输出对象) Y-m-d H:i:s || Y年m月d日 H:i:s等
 * @returns {object} {Y: number, m: number, d: number, H: number, i: number, s: number}
 */
$.plugin.times = function(str,F){
	if($.isNumber(str) && $.inArray($.strlen(str),[10,13])){
		if(str.length == 10){
			str = str * 1000;
		}
		str = parseInt(str);
	}
	if(typeof(str) =='string'){
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
		'str' : ''
	};
	obj.str = obj.Y+'-'+obj.m+'-'+obj.d+' '+obj.H+':'+obj.i+':'+obj.s;
	$.loop(obj, function(val, k){
		obj[k] = val < 10 ? '0'+val : val;
		F && (F = F.replace(k, val));
	});
	return F ? F : obj;
}

//指定月份多少天
$.plugin.days = function(y, m){
	return new Date(y, m, 0).getDate();
}

//指定日期星期几
$.plugin.week = function(y,m,d){
	var w = new Date(y+'-'+m+'-'+d).getDay();
	return w == 0 ? 7 : w; //周日序号为7
}

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
$.plugin.AJR = function(url, postdata, fun, errfun, datatype,isBflow){
	var $this = this;
	datatype = datatype ? datatype : 'json';
	url += (url.indexOf('?') == -1 ? '?' : '&') +'ajax=1';
	var option = {
		type : postdata ? 'POST' : 'GET',
		url : url,
		dataType : datatype,
		data : postdata,
		success : function(s) {
			if(s && typeof(s) =='object'){
				//成功回调函数 只在API返回result字段时回调
				if($.isset(s.result)){
					typeof(fun) =='function' && fun(s.result, s);
				}else{
					console.log('%cKSAUI-AJAX-ERROR API异常返回！URL：'+url+"\n",'background:#f00; color:#fff', s);//debug
					typeof(errfun) ==='function' && errfun(s);
				}

				if($.isset(s.msg) && s.msg){
					if(s.success){
						$this.toast(s.msg , 'success', function(){
							if(s.success && s.locationUrl){
								window.location.href = s.locationUrl;
							}
						});
					}else{
						$this.toast(s.msg, 'error');
					}
				}

			}else{
				$this.toast('error', 'ajax远端系统错误');
			}
		},
		error : function(s) {
			console.log('%cKSAUI-AJAX-ERROR (Code:'+s.status+')','background:#f00; color:#fff', 'URL:'+url);//debug
			$this.toast('ajax远端系统错误', 'error');
			if(typeof(errfun) ==='function'){
				errfun(s);
			}
		}
	};
	if(isBflow){
		option.processData = false;
		option.contentType = false;
	}
	$.ajax(option);
	return false;
}

/**
 * AJAX url 并弹出一个远端内容框
 * @param {type} tit
 * @param {type} url
 * @returns {undefined}
 */
$.plugin.ajaxWin = function(tit, url){
	var $this = this;
	return $this.AJR(url,'', function(data){
		$this.layer({
			title : tit,
			content : data,
			cover : 1
		});
	});
}

/**
 * 表单AJAX提交
 * @param {type} obj 表单对象
 * @param {type} callFun 回调函数
 * @returns {Boolean}
 */
$.plugin.AJRS = function(obj,callFun){
	var $this = this;
	obj = $(obj);
	var btn = obj.find('button[type=submit]');
	var btnTxt = btn.html();
	btn.addClass('btn-load').attr('disabled',true).text(btnTxt);
	var formData = new FormData();
	obj.find('input, textarea, select').each(function(i,ele){
		var o = $(ele);
		var name = o.attr('name');
		var val = o.val();
		if(name){
			if(o.attr('type') =='file'){
				formData.append(name, ele.files.length ? ele.files[0] : '');
			}else if($.inArray(o.attr('type'),['radio','checkbox'])){
				if(o.attr('checked')){
					formData.append(name, val);
				}
			}else{
				if($.isArray(val)){
					$.loop(val,function(v){
						formData.append(name, v);
					})
				}else{
					formData.append(name, val);
				}
			}
		}
	});

	if(obj.attr('id')){
		formData.append('FORMID', obj.attr('id'));
	}
	var url = obj.attr('action');
	url += url.indexOf('?') !== -1 ? '&' : '?';
	url += 'formsubmit=true';
	$this.AJR(url, formData, function(dt){
		if(typeof callFun == 'function'){
			callFun(dt);
		}
		btn.removeClass('btn-load').attr('disabled',false).html(btnTxt);
	},function(){
		btn.removeClass('btn-load').attr('disabled',false).html(btnTxt);
	},'json',1);

	//30秒后解除提交按钮限制
	setTimeout(function(){
		btn.removeClass('btn-load').attr('disabled',false).html(btnTxt);
	},30*1000);
	return false;
}

/**
 * 快速上传函数
 * @param {string} name 传递给后端的表单名称
 * @param {document} files inputDOM 或 input.files对象
 * @param {url} url 上传地址
 * @param {func} callFun 上传后回调函数
 */
$.plugin.upload = function(name, files, url, callFun){
	name = name ? name : 'upload';
	var O = $(files);
	if(typeof(O) =='object' && O.length && O[0] && O[0].tagName =='INPUT'){
		files = files.files;
	}
	if(files.length>1 && name.indexOf('[]') == -1){
		name += '[]';
	}
	var formData = new FormData();
	this.loop(files, function(k, val){
		if(val.size && val.type){
			formData.append(name, val);
		}
	});
	this.AJR(url,formData, function(data){
		callFun(data);
	}, null, 'json', 1);
}

/**
 * html标签生成
 * 属性值不存在则不输出对应属性
 * @param {string} tp 标签名称 div/span/input
 * @param {json} dt 属性数据 {class:'test',type:'text'}
 * @param {html} txt 附加在标签中或者后面的html
 * @param {string} ed 是否不需要结尾 input等传入1
 * @returns {string} 返回一个标签html源码
 */
$.plugin.tag = function(tp, dt, txt, ed){
	var h = '<'+tp;
	$.loop(dt,function(v, k) {
		h += k && v != null && v != 'undefined' ? (' '+k+'="'+v+'"') : '';
	});
	h +=  '>'+(txt ? txt : '');
	if(!ed){
		h += '</'+tp+'>';
	}
	return h;
}

/**
 * input[type=number] 绑定快捷加减事件
 * @param {func} callFun 变化后的回调函数 参数1=当前值 参数2=当前动作(up=加 down=减)
 */
$.plugin.inputNumber = function(callFun){
	var $this = this;
	var attrs = $this.attr();
	!$this.val().length && !attrs.placeholder && $this.val(attrs.min || 0);
	var ef = $this.parent();
	!ef.hasClass('ks-input-arrow') && ef.addClass('ks-input-arrow');
	var min = parseFloat(attrs.min) || 0, //input最小值
		max = parseFloat(attrs.max) || 0, //input最大值
		step = parseFloat(attrs.step) || 0, //input步进值
		n = step && step.toString().indexOf('.') != -1 ? step.toString().split('.')[1].length : 0; //step有多少小数位 踏马的js精度
	//计算 并写input  x[0=+ 1=-]
	function r(x){
		var v = parseFloat($this.val()) || 0;
		if(x == 'up'){
			if(step){
				v = v+step;
			}else{
				v ++;
			}
		}else{
			if(step){
				v = v-step;
			}else{
				v --;
			}
		}
		v = n >0 ? v.toFixed(n) : v; //去踏马的精度问题 再骂一次加深印象
		v = v < min ? min : v; //最小值限制
		v = max && v > max ? max : v; //最大值限制
		$this.val(v);
	}

	//检查input标签是否存在回调函数属性 callfun="xxx"
	if(!callFun) {
		var cfun = attrs.callfun;
		if (cfun) {
			callFun = string2Function(cfun);
		}
	}

	var S,S1;
	//鼠标按下处理
	var evn = $.device == 'MOBILE' ? 'touchstart touchend' : 'mousedown mouseup';
	ef.find('*[data-digit]').on(evn,function(e){

		var i = $(this).data('digit'); //取i标签当前索引
		if($.inArray(e.type,['mousedown','touchstart'])){
			r(i); //按下 计算一次
			//x时间内未松开鼠标 则一直计算
			S = setTimeout(function(){
				S1 = setInterval(function(){
					r(i);
				},60);
			},250);

			//鼠标松开后释放自动计算事件
		}else{
			$this.change();
			clearInterval(S1);
			clearTimeout(S);
			typeof(callFun) =='function' && callFun($this.val(), i);
		}
	});
}

/**
 * 手风琴
 * @param isAc 是否自动关闭相邻列表 默认是
 */
$.plugin.accordion = function(isAc){
	isAc = $.isset(isAc) ? isAc : 1;
	this.find('dl').each(function(){
		var dl = $(this), dt = dl.children('dt'), dd = dl.children('dd');
		var dtH = dt.height(true);
		var ohd = dtH + dl.find('dd').height(true);
		var ddH = dl.find('dd').height(true);
		dd.attr('originalHeight',ddH);
		if(!$.isset(dl.attr('open'))){
			dd.height(0);
		}else{
			dd.height(ddH);
		}

		dt.click(function(e) {
			if($.isset(dl.attr('open'))){
				dl.attr('open','');
				dd.height(0);
			}else{
				dl.attr('open','open');
				dd.height(ddH);

				if(isAc){
					var siblingsDl = dl.siblings('dl');
					siblingsDl.removeAttr('open');
					siblingsDl.children('dd').height(0);
				}
			}
		});
	});
}

/**
 * 初始化选择列表
 * dom结构 <ul class="ks-list"><li value="选项1-值" text="选项名称(可选)">选项1</li></ul>
 * 必须通过KSUI('xx')选择器调用
 * @param callFun 回调函数 参数1=当前值 参数2=当前文字 参数3=当前值数据 参数4=当前item对象 参数5=当前event
 */
$.plugin.listSelect = function(callFun){
	var $this = this;
	var m = $.isset($this.attr('multiple'));
	$this.find('li:not(._tit)').click(function(e) {

		var T = $(this);
		//如果当前已选择或禁用状态则不做任何响应
		if (T.hasClass('_tit') || (!m && $.isset(T.attr('selected'))) || $.isset(T.attr('disabled'))) {
			return false;
		}
		//多选下拉菜单
		if(m){
			if(T.attr('selected')){
				T.attr('selected', false);
			}else{
				T.attr('selected',true);
			}
		}else{
			T.attr('selected',true).siblings().removeAttr('selected');
		}
		var txtM = {};
		$this.find('li[selected]').each(function (i,l) {
			l = $(l);
			txtM[l.attr('value')] = T.attr('_text') || T.attr('text') || T.text();
		});
		//值回调
		$.isFunction(callFun) && callFun(T.attr('value'), T.attr('_text') || T.attr('text') || T.text(), txtM, T, e);
		return false;
	});
	return this;
}

/**
 * 渲染TAB选项卡
 * @param callFun 需要回调的函数 参数1=当前tab顺序值
 * @returns {K}
 */
$.plugin.tab = function(callFun){
	var $this = this;

	$this.find('.ks-tab-title li').click(function(){
		var o = $(this);
		var index = o.index();
		$this.find('.ks-tab-item').hide().eq(index).show();
		o.addClass('a').siblings().removeClass('a');
		$.isFunction(callFun) && callFun(index);
	});
	var showK = $this.find('.ks-tab-title li.a').index();
	showK = showK == -1 ? 0 : showK;
	$this.find('.ks-tab-title li').eq(showK).addClass('a');
	$this.find('.ks-tab-item').hide().eq(showK).show();
	return this;
}

/**
 * select下拉菜单模拟
 * 触发函数
 * @param {selector} btn 触发元素dom
 * @param {json} data select表单对象或者JSON数据，JSON格式：
 {
	title : '下拉菜单标题',
	value : '默认值', // ['默认值1','默认值2']
	multiple : 1, //是否多选
	data : [ //列表数据
	  {
		  value   :   值 必须
		  title   :   标签title 可选
		  text    :   显示标题 必须
		  showtitle : 选中后按钮上显示的文字
		  selected:   是否选中 可选
		  disabled:   是否禁用 可选
		  icon    :   图标名称 可选
		  style   :   样式 可选
		  data    : { //子级(如果需要) 类似select的optgroup标签
			  值同上
		  }
	  },
	  第二组,
	  第三组,
	  ...
	]
}
 * @param {func} callFun 每项点击后的回调函数 1=值 2=text 3=多选值列表
 * @param {boolean} multiple 是否多选(data=select时根据元素属性自动判断)
 * @param {json} layerOption layer配置参数
 */
$.plugin.showSelect = function(data, callFun, multiple, layerOption){
	var $this = this;
	var btn = $(this[0]);
	//触发按钮被禁用时不响应
	if(btn.attr('disabled') || btn.hasClass('_disabled')){
		return;
	}
	//如果选择窗口存在 则关闭
	if(btn.data('layer-id')){
		$this.layerHide(btn.data('layer-id'));
		btn.removeData('layer-id').removeClass('a');
		return;
	}
	var select, Nums =0, defvalue = btn.data('value');
	//如果不是数组、普通JSON参数（则认为是选择器、jq对象、dom对象）
	if(data && !$.isObjectPlain(data) && !$.isArray(data)){
		select = $(data);
		defvalue = select.data('value') || select.val();
		data = option2json(data);
		multiple = select.attr('multiple');
	}
	//将select元素转为JSON数据
	function option2json(o){
		var n = 0, dt = [];
		$(o).children().each(function(i,t){
			t = $(t);
			var v = {
				value : t.attr('value') || '',
				title : t.attr('title') || null,
				text : t.text() || '',
				showtitle : t.attr('showtitle') || null,
				selected : t.attr('selected') || null,
				disabled : t.attr('disabled') || null,
				icon : t.attr('icon') || null,
				style : t.attr('style') || null,
				n : Nums
			};
			if(t[0].tagName =='OPTGROUP'){
				v.text = t.attr('label') || null;
				v.data = option2json(t);
			}else{
				Nums ++;
			}
			dt[n] = v;
			n ++;
		});
		return dt;
	}
	//将JSON数据转换为HTML菜单列表
	function options(dt){
		var h = '';
		$.loop(dt,function(value, key){
			if(value.data){
				h += '<li class="_tit"><strong>'+(value.text)+'</strong><ul class="ks-list ks-list-select" '+(multiple ? ' multiple="multiple"' :'')+'>'+options(value.data)+'</ul></li>';
			}else{
				if(!$.isObject(value) && !$.isArray(value)){
					value = {value:key, text:value, selected: (($.isArray(defvalue) && $.inArray(key, defvalue)) || ($.isObjectPlain(defvalue) && $.isset(defvalue[key])) || key === value)}
				}
				h += $this.tag('li', {selected:value.selected ? 'selected' : null ,disabled:value.disabled, icon:value.icon, style:value.style, title:value.title, value:value.value, n:value.n, _text:value.showtitle || value.text}, value.text);
			}
		});
		return h;
	}
	layerOption = layerOption || {};
	layerOption = $.arrayMerge({
		pos : btn,
		cover : 0,
		content : '<ul class="ks-list ks-list-select" '+(multiple ? ' multiple="multiple"' :'')+'>'+options(data)+'</ul>',
		closeBtn : 0,
		init : function(layer){
			if(!layer.layerID){
				return;
			}
			btn.data('layer-id',layer.layerID).addClass('a');
			var d = layer.find('.ks-layer-content');
			//自动定位到已选择区域
			if(d.find('li[selected]').length){
				d.scrollTop(d.find('li[selected]').eq(0).offset().top - d.offset().top - d.find('li').eq(0).height());
			}
			//选项点击事件
			$(d.find('.ks-list-select')).listSelect(function(val, txt, valdt, T, e){
				e.stopPropagation();//阻止冒泡

				//多选下拉菜单
				if(multiple){
					select && select.find('option').eq(T.attr('n')).attr('selected', T.attr('selected') ? true : false);
					txt = '';
					d.find('li[selected]').each(function (i,l) {
						l = $(l);
						txt += '<span>'+l.attr('_text')+'</span>';
					});
					txt = txt ? txt : '请选择';
				}else{
					select && select.val(val).trigger('change');
				}
				//选择后回调函数
				if(typeof(callFun) =='function'){
					var calltxt = callFun(val, txt, valdt);
					txt = calltxt === false ?  false : txt;
				}
				//触发按钮输出text
				if(txt){
					//KSA渲染的btn写值
					if(btn.find('.ks-select-tit').length){
						btn.find('.ks-select-tit').html(txt);
						//btn对象是input
					}else if($.inArray(btn[0].tagName, ['INPUT','TEXTAREA'])){
						btn.val(txt);
						//btn对象是其他标签
					}else{
						btn.html(txt);
					}
				}
				btn.attr('val',val).data('value',valdt);
				//单选框选择后关闭pop层
				if(!multiple){
					layer.close();
				}
			});

			//监听点击事件 自动关闭
			$(document).on('click.KSAUI-select', function(e){
				if(!$.inArray(e.target,[btn[0], layer[0]])){
					layer.close();
				}
			});
		},
		close : function(){
			btn.removeData('layer-id').removeClass('a');
			$(document).off('click.KSAUI-select');
		}
	}, layerOption, {class:'ks-layer-select'});


	return $this.layer(layerOption);
}

/**
 * 弹出一个日期输入框
 * @param {type} input 触发表单
 * @param {type} format 日期格式 必须为：YmdHis 区分大小写随意组合顺序
 */
$.plugin.showDate = function(input, format){
	var $this = this;
	var defYmd = '2020-01-01';
	input = $(input);


	if(input.data('layer-id')){
		$this.layerHide(input.data('layer-id'));
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

	function monthHtml(str){
		str = str && !ismd ? defYmd+' '+str : str;
		var dt = $this.times(str);
		if(!dt.Y || !dt.m){
			return;
		}
		//上个月
		var Html = '',
			ly = dt.Y, //今年值
			lm = parseInt(dt.m) -1; //上月值
		if(lm <1){
			lm = 12;
			ly --;
		}

		var lastDay = $this.days(ly, lm),
			week = $this.week(ly, lm, lastDay);

		//天数排列
		Html += '<em>一</em><em>二</em><em>三</em><em>四</em><em>五</em><em>六</em><em>日</em>';
		//上月处理
		var u = 0;
		for(var i=(lastDay-week+1); i<=lastDay; i++){
			Html += '<i class="_" data-value="'+ly+'-'+lm+'-'+i+'">'+i+'</i>';
			u ++;
		}
		//当月天数
		for(var i=1; i<=$this.days(dt.Y,dt.m); i++){
			Html += '<i class="'+(i == dt.d ? ' a' : '')+'" data-value="'+dt.Y+'-'+dt.m+'-'+i+'">'+i+'</i>';
			u ++;
		}
		//下月天数补偿 让日历始终显示6周 42天
		u = (42-u);
		if(u >0){
			var ny = dt.Y, nm = dt.m;
			nm ++;
			if(nm >12){
				nm = 1;ny ++;
			}
			for(i=1; i<=u; i++){
				Html += '<i class="_" data-value="'+ny+'-'+nm+'-'+i+'">'+i+'</i>';
			}
		}
		dt.html = Html;
		return dt;

	}

	var str = input.val();
	var dt = monthHtml(str);
	var TimeHtml = '';
	if(isHi){
		TimeHtml = '<div class="' + cl.d + ' ks-clear">';
		TimeHtml +='<div class="'+cl.e+'">';
		TimeHtml +='<div><i data-digit="up" icon="caret-up"></i><input type="number" value="'+dt.H+'" min="1" max="23" norender><i data-digit="down" icon="caret-down"></i></div>';
		TimeHtml +='<div>:</div>';
		TimeHtml +='<div><i data-digit="up" icon="caret-up"></i><input type="number" value="'+dt.i+'" min="1" max="59" norender><i data-digit="down" icon="caret-down"></i></div>';
		if(isHis){
			TimeHtml +='<div>:</div>';
			TimeHtml +='<div><i data-digit="up" icon="caret-up"></i><input type="number" value="'+dt.s+'" min="1" max="59" norender><i data-digit="down" icon="caret-down"></i></div>';
		}

		TimeHtml += '</div>';
		if(isymd) {//只有存在年月日时才出现确认按钮
			TimeHtml += '<button type="button" size="2" color="red">确认</button>';
		}
		TimeHtml += '</div>';
	}

	var H = '<div class="'+cl.a+'" data-y="'+dt.Y+'" data-m="'+dt.m+'" data-d="'+dt.d+'">';
	if(isymd) {
		H += '<div class="' + cl.b + '"><i icon="first_page"></i><i icon="arrow_left"></i><em>' + dt.Y + '年</em><em>' + dt.m + '月</em><i icon="arrow_right"></i><i icon="last_page"></i></div><div class="' + cl.c + '">' + dt.html + '</div>';
	}
	H += TimeHtml;
	H +='</div>';

	$this.layer({
		cover : 0,
		pos : input,
		content: H,
		closeBtn : 0,
		show : function(layer){
			//将dom pop对象转为子级日历
			var dom = layer.find('.'+cl.a);
			//阻止冒泡
			layer.click(function(e){e.stopPropagation();return false;});

			//获取当前日历生成的时间并写入到触发对象中
			function sput(){
				var v = defYmd;
				if(format.indexOf('m') != -1) {
					v = dom.find('.' + cl.c + ' i.a').data('value');
				}
				if(isHi) {
					var b = dom.find('.' + cl.e + ' input');
					if (b.length) {
						v += ' ' + b.eq(0).val() + ':' + b.eq(1).val();
						if (isHis) {
							v += ':' + b.eq(2).val();
						}
					}
				}
				var h = $this.times(v);
				v = format.replace('Y',h.Y).replace('m',h.m).replace('d',h.d).replace('H',h.H).replace('i',h.i).replace('s',h.s);
				input.val(v);
				return v;
			}

			//日 点击事件
			function ulevent(){
				dom.find('.'+cl.c+' i').click(function(){
					$(this).addClass('a').siblings().removeClass('a');//当前高亮
					sput();//写值
					//如果没有时分秒操作栏 则直接关闭当前窗口
					if(!dom.find('.'+cl.d).length){
						layer.close();
					}
					return false;
				});
			}
			ulevent();
			//标题栏年月按钮事件
			dom.find('.'+cl.b+' i').click(function(){
				var N = $(this).index();
				var y = parseInt(dom.data('y')), m = parseInt(dom.data('m')), d = parseInt(dom.data('d'));
				//切换上一年
				if(N == 0){ y --;
					//切换下一年
				}else if(N == 5){ y ++;
					//切换上月
				}else if(N == 1){
					m --;
					if(m <1){ m = 12; y --; }
				}else if(N == 4){//切换下月
					m ++;
					if(m > 12){ m = 1; y ++; }
				}
				dom.data({y:y,m:m});
				var em = $(this).siblings('em');
				em.eq(0).text(y+'年');
				em.eq(1).text(m+'月');
				dom.find('.'+cl.c).html(monthHtml(y+'-'+m+'-'+d).html);
				ulevent();
				sput();//写值
				return false;
			});
			//时分秒增加步进值事件
			dom.find('.'+cl.e+' input').each(function(i,t){
				$(t).inputNumber(sput);
			});
			//确认按钮
			dom.find('button').click(function(){
				sput();//写值
				layer.close();
				return false;
			});

			layer.hover(function(){
				input.attr('ks-date-show',1);
			},function(){
				input.removeAttr('ks-date-show');
			});
			input.blur(function(){
				!$(this).attr('ks-date-show') && layer.close();
			});
			//监听点击事件 自动关闭
			$(document).on('click.KSAUI-showdate', function(e){
				if(!$.inArray(e.target,[input[0], layer[0]])){
					layer.close();
				}
			});
		},
		close : function(){
			input.removeData('layer-id');
			$(document).off('click.KSAUI-showdate');
		}
	});
}

/**
 * 弹出菜单
 * @param {document} obj 触发元素
 * @param {html/document} content 菜单内容
 * @param {string} title 菜单名称
 */
$.plugin.showMenu = function(obj, content, title){
	var $this = this;
	var Evn = event || window.event;
	var EvnType = Evn.type;
	obj = $(obj);
	if(obj.hasClass('a') && obj.data('layerID')){
		if($.inArray(EvnType,['click'])){
			$this.layerHide(obj.data('layerID'));
		}
		return;
	}
	return this.layer({
		pos : obj,
		cover : 0,
		title : title,
		content : content,
		closeBtn : 0,
		BackEvent: 0,
		show : function(dom, layer){
			obj.addClass('a').data('layerID',layer.layerID);
			//如果是鼠标经过触发的事件 则绑定鼠标离开事件的处理
			if($.inArray(EvnType, ['mouseover','mouseenter'])){
				var s, a = function(){
					s && clearTimeout(s);
				},b=function(){
					s = setTimeout(function(){
						layer.close();
					},200);
				};
				obj.hover(a,b);
				dom.hover(a,b);
				//如果是点击触发事件 则绑定点击其他地方时关闭layer
			}else if($.inArray(EvnType,['click'])){
				dom.click(function(){
					return false;
				});
				//监听点击事件 自动关闭
				$(document).on('click.KSAUI-showMenu'+layer.layerID, function(e){
					if(!$.inArray(e.target,[obj[0], dom[0]])){
						layer.close();
					}
				});
			}
		},
		close : function() {
			$(document).off('click.KSAUI-showMenu'+obj.data('layerID'));
			obj.removeClass('a').removeData('layerID');
		}
	});
}

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
$.plugin.area = function(btn, tit, defDt, callFun, maxLevel, apiUrl){
	var $this = this;
	btn = $(btn);
	if(btn.data('layer-id')){
		$this.layerHide(btn.data('layer-id'));
		btn.removeData('layer-id');
		return;
	}
	tit = tit ? tit : '设置地区信息';
	var _APIurl = apiUrl ? apiUrl : 'common/area';
	maxLevel = maxLevel >=0 && maxLevel < 4 ? maxLevel : 4;
	var Ts = ['选择省份/地区','选择城市','选择区/县','选择城镇','选择街道'];
	var Fk = ['province', 'city', 'area', 'town'];
	var level = 0;
	var layerID = 0;
	var Dom;

	//获取当前已选择地区数据并组合为JSON 回调给callFun
	function __callDt(currID, end){
		var dt = {current:{},data:{}, isEnd:end ?1 : 0};
		Dom.find('.ks-area-layer-btn p').each(function(i, ele){
			ele = $(ele);
			var f = ele.attr('field');
			if(ele.attr('val')) {
				let v = {id: ele.attr('val'), name: ele.text(), level:i, field:f};
				if(currID && currID == ele.attr('val')){
					dt.current = v;
				}
				dt.data[f] = v;
			}
		});
		$.isFunction(callFun) && callFun(dt);
	}



	//从API获取数据
	function g(upID, currID){
		upID = upID ? upID : '';
		$this.AJR(_APIurl,{id:upID, level:level},function(data){
			var H = '';
			$.loop(data,function (val) {
				H += $this.tag('li',{
					upid : upID,
					val : val.id,
					selected : (currID && currID == val.id ? 'selected' : null)
				}, val.name);
			});
			//如果没有地区数据 则直接关闭
			if(!H){
				$this.layerHide(layerID);
				btn.removeData('layer-id');
			}else {
				H = '<ul class="ks-list ks-list-select">'+H+'</ul>';
				Dom.find('.ks-area-layer-c').html(H);
				//计算地区列表区域的高度 以适应滚动窗口
				(function(){
					var h = Dom.height();
					var o = Dom.find('.ks-area-layer-c');
					o.height(h-Dom.find('.ks-area-layer-btn').height(true));

					var p = o.find('li[selected]');
					if(p.length){
						o.scrollTop(p.index() * p.height(true));
					}else{
						o.scrollTop(0);
					}
				})();
				//列表选项 点击事件
				Dom.find('.ks-list-select').listSelect(function (val, txt, valdata, t, e) {
					var id = t.attr('val');
					t.attr('selected',true).siblings().removeAttr('selected');
					var bt = Dom.find('.ks-area-layer-btn').find('p').eq(level);
					bt.text(txt).attr({upid:t.attr('upid'),'val':id, 'field':Fk[level]}).show();
					bt.next().attr('upid',id).html('<span class="ks-text-gray">'+Ts[level+1]+'</span>').show();

					//选择达到最后一级 关闭窗口
					if (level == maxLevel-1) {
						$this.layerHide(layerID);
						btn.removeData('layer-id');
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
	$this.layer({
		pos : $this.device =='MOBILE' ? 8 : btn,
		cover : $this.device =='MOBILE' ? 2 : 0,
		width : $this.device =='MOBILE' ? '100%' : '',
		height : $this.device =='MOBILE' ? '75%' : '',
		class : 'ks-area-layer',
		content : '<div class="ks-area-layer-btn"><p><span class="ks-text-gray">'+Ts[0]+'</span></p><p></p><p></p><p></p></div><div class="ks-area-layer-c">请稍后...</div>',
		closeBtn : false,
		init : function(layer, id){
			layerID = id;
			btn.data('layer-id',id);

			//阻止冒泡
			layer.click(function(){return false;});

			//默认数据处理
			if(defDt){
				var p = layer.find('.ks-area-layer-btn p');
				var defEnd = {};
				var upid = 0;
				$.loop(defDt, function(val, k){
					upid = k >0 ? defDt[(k-1)].id : 0;
					p.eq(val.level).text(val.name).attr({'upid': upid, 'val':val.id, 'field':val.field}).show();
					if(level < val.level){
						level = val.level;
						defEnd = val;
					}
				});
				g(upid, defEnd.id);
			}else{
				g();
			}

			//已选择地区增加点击事件 点击后选择下级地区
			layer.find('.ks-area-layer-btn p').click(function(){
				let t = $(this);
				level = t.index();
				t.nextAll().text('').removeClass('a').attr('upid','').attr('val','').hide();
				g(t.attr('upid'), t.attr('val'));
				__callDt(t.attr('val'));
			});

			//监听点击事件 自动关闭
			$(document).on('click.KSAUI-area', function(e){
				if(!$.inArray(e.target,[btn[0], layer[0], layer.Q.next('[data-layer-key="'+layer.layerID+'"]')[0]])){
					layer.close();
					btn.removeData('layer-id');
				}
			});
		}
	});

}

//title提示文字处理
$.plugin.showTip = function(obj, txt, click){
	obj = $(obj);
	txt = txt ? txt : (obj.attr('title') || '');
	if(!txt){
		return;
	}
	$.ZINDEX ++;
	$('body').append('<div class="ks-ftip" style="z-index:'+this.ZINDEX+'">'+txt+'<span class="ks-ftip-x"></span></div>');
	var tip = $('.ks-ftip');
	tip.show();
	var ht = tip.height(true) + tip.find('.ks-ftip-x').height(true) /2;
	tip.css({left:(obj.offset().left-10), top:(obj.offset().top-ht)});
	var s;
	obj.hover(function(){
		s && clearTimeout(s);
	},function(){
		s = setTimeout(function(){
			tip.remove();
		},10);
	});
	tip.hover(function(){
		s && clearTimeout(s);
	},function(){
		s = setTimeout(function(){
			tip.remove();
		},10);
	});
}


/**
 * 全选事件触发
 * @param t
 */
$.plugin.checkAll = function(selector){
	var t = this;

	var name = t.attr('name');
	//如果没有name则不处理
	if(!name){
		return this;
	}

	selector = $(selector || t.parent()[0].form || t.parent().parent());
	t.removeAttr('name');
	//全选事件绑定
	t.change(function () {
		//域下相同类型的元素
		var inputs = 'input[type="checkbox"][name="' + name + '"]';
		if (t.attr('checked')) {
			//数据列表 全选框处理 格式所有全选name必须相同 全选框必须有class <input type="checkbox" name="checkall" class="ks-check-all">
			name && selector.find(inputs).attr('checked', true);
		} else {
			//数据列表 全选框处理 格式所有全选name必须相同 全选框必须有class <input type="checkbox" name="checkall" class="ks-check-all">
			name && selector.find(inputs).attr('checked', false);
		}
	});
	return this;
}

$.plugin.render = function(){
	var $this = this;

	function moveLabelAttr(tagname, input, appendClass){
		input = $(input);
		input.removeClass(appendClass);
		var attr = 'style title color';
		var dt = {};
		$.loop(attr.split(' '), function(val, key){
			dt[val] = input.attr(val);
		});
		dt.class = (dt.class ? dt.class : '') +' '+appendClass;
		input.removeAttr(attr);
		return $this.tag(tagname, dt);
	}
	var R = {
		'ks-radio' : function(t, at){
			var txt = at.text ? '<em>'+at.text+'</em>' : '';
			t.attr('type','radio').wrap(moveLabelAttr('label', t, 'ks-radio'));
			t.after('<i>'+txt+'</i>');
		},
		'ks-checkbox' : function(t, at){
			var txt = at.text ? '<em>'+at.text+'</em>' : '';
			t.attr('type','checkbox').wrap(moveLabelAttr('label', t, 'ks-checkbox'));
			t.after('<i>'+txt+'</i>');

			//最大选择数量支持
			var area = t.parent().parent();
			if(area.length && area[0].tagName =='CHECKGROUP' && area.attr('max')){
				var max = parseInt(area.attr('max')) || 0;
				t.change(function () {
					//域下相同类型的元素
					var uN = 'input[type="checkbox"][name="' + t.attr('name') + '"]';

					//最大选择数量限制
					if(max >0){
						if(area.find(uN+':checked').length == max && t.attr('checked')){
							area.find(uN+':not(:checked)').attr('disabled', true);
						}else{
							area.find(uN+':not(:checked)').attr('disabled', false);
						}
					}
				});
			}
		},
		'ks-checkbox-all' : function(t, at){
			var f = R['ks-checkbox'];
			f(t, at);
			t.checkAll(t.attr('selector'));
		},
		'ks-switch' : function(t, at){
			var val = $.isset(at.checked) ? 1 : 0,
				txt = at.text || '',
				name = at.name ? ' name="'+at.name+'"' : '';

			if(txt){
				txt = txt.split('|');
				txt = $.isset(txt[1]) ? '<em>'+txt[0]+'</em><em>'+txt[1]+'</em>' : '<em>'+txt[0]+'</em>';
			}
			t.attr('type','checkbox').removeAttr('name');

			t.wrap(moveLabelAttr('label', t, 'ks-switch'));
			t.after('<i>'+txt+'</i><input type="hidden" '+name+' value="'+val+'">');

			//事件绑定
			t.change(function () {
				t.nextAll('input[type=hidden]').val(t.attr('checked') ? 1 : 0);
			});

		},
		'ks-number' : function(t, at){

			t.attr('type','number').addClass('ks-input');
			t.wrap(moveLabelAttr('label', t, 'ks-input ks-input-arrow'));

			t.after('<span data-digit="down" icon="sub"></span><span data-digit="up" icon="add"></span>');
			t.inputNumber();
		},
		'ks-select' : function(t, at){
			if(t[0].tagName != 'SELECT'){
				return;
			}
			//如果在标签属性data-value给定选中值 则处理到内部
			t.data('value') && t.val(t.data('value'));
			t.removeAttr('type');
			var opt = t.find('option:selected'),
				tit = (at.text || '请选择');
			if (opt.length) {
				if ($.isset(at.multiple)) {
					tit = opt.text();
				} else {
					tit = opt.attr('text') || opt.text();
				}
			}
			t.wrap(moveLabelAttr('div', t, 'ks-select'));
			t.after('<span class="ks-select-tit" icon="caret-down">' + tit + '</span>');

			t.parent().click(function(){
				$(this).showSelect(t);
			});
		},
		'ks-date' : function(t, at){
			t.attr('type', 'text');
			t.wrap(moveLabelAttr('label', t, 'ks-input'));
			if(!at.icon && !at.iconleft && !at.iconright){
				at.iconright = 'date';
			}
			(at.icon || at.iconleft) && t.before('<left icon="'+(at.icon || at.iconleft)+'"></left>');
			at.iconright && t.before('<right icon="'+at.iconright+'"></right>');

			//增加事件
			t.focus(function () {
				$this.showDate(t);
			});
		},
		'ks-text' : function(t, at){
			t.attr('type', 'text');
			t.wrap(moveLabelAttr('label', t, 'ks-input')).removeAttr('icon');
			(at.icon || at.iconleft) && t.before('<left icon="'+(at.icon || at.iconleft)+'"></left>');
			at.iconright && t.before('<right icon="'+at.iconright+'"></right>');
			if($.isset(at.clear)){
				var clearbtn = $('<right class="ks-input-clear" icon="clear" style="z-index:99"></right>');
				t.before(clearbtn);
				clearbtn.click(function(){
					t.val('').focus();
					clearbtn.removeClass('a');
				});
				t.keyup(function(){
					if(t.val().length >0){
						clearbtn.addClass('a');
					}else{
						clearbtn.removeClass('a');
					}
				});
			}
		},
		'ks-password' : function(t, at){
			t.attr('type', 'password');
			t.wrap(moveLabelAttr('span', t, 'ks-input ks-password')).removeAttr('icon');
			(at.icon || at.iconleft) && t.before('<left icon="'+(at.icon || at.iconleft)+'"></left>');
			at.iconright && t.before('<right icon="'+at.iconright+'"></right>');

			if($.isset(at.active)){
				t.before('<right icon="ishide" _active="1"></right>');
				t.prevAll('right[_active]').click(function(){
					var ths = $(this);
					var input = ths.nextAll('input');
					if(input.attr('type') =='text'){
						input.attr('type','password');
						ths.attr('icon','ishide');
					}else{
						input.attr('type','text');
						ths.attr('icon','isshow');
					}
				});
			}
		},
		'ks-textarea' : function(t, at){
			t.removeAttr('type');
			t.wrap(moveLabelAttr('div', t, 'ks-textarea'));
			var maxlength = parseInt(t.attr('maxlength'));
			if(maxlength){
				t.after('<div class="ks-textarea-maxtit">字数限制 <span>'+t.val().length+'</span>/'+maxlength+'</div>');
				t.keyup(function(){
					var n = t.val().length;
					if(n > maxlength){
						t.val(t.val().substr(0,maxlength));
					}
					t.next('.ks-textarea-maxtit').children('span').text(t.val().length);
				});
			}
		}
	};
	$.loop(R, function(func, k){
		$('[type="'+k+'"]').each(function(inx, ele){
			//防止重复渲染
			if(ele._KSA_RENDER){
				return;
			}
			ele = $(ele);
			func(ele, ele.attr()||{});
			ele[0]._KSA_RENDER = 1;
		});
	});

	$('.ks-tab:not([_ksauirender_])').each(function(_, e){
		$(e).attr('_ksauirender_',1).tab();
	});

	$('.ks-slide:not([_ksauirender_])').each(function(_, ele){
		ele = $(ele);
		var sdt = ele.data();
		ele.attr('_ksauirender_',1).slide({
			auto : sdt.auto,
			card : sdt.card,
			control : sdt.control,
			status : sdt.status,
		});
	});

	//title提示文字处理
	$('*[title]:not([_ksauirender_title_])').each(function(_, ele){
		ele = $(ele);
		ele.attr('_ksauirender_title_',1);
		var tit = ele.attr('title');
		if(tit) {
			ele.hover(function(){
				$.showTip(ele);
				ele.attr('title','');
			},function(){
				ele.attr('title',tit);
			});
		}
	});
	return this;
}

/**
 * 幻灯轮播
 * @param options
 * @returns {$.plugin}
 */
$.plugin.slide = function(options){
	options = {
		auto : $.isset(options.auto) ? parseFloat(options.auto) : 5,
		card : $.isset(options.card) ? parseInt(options.card) : false,
		control : $.isset(options.control) ? parseInt(options.control) : true,
		status : $.isset(options.status) ? parseInt(options.status) : true,
	};

	options.auto = options.auto ? (parseFloat(options.auto) * 1000) : 0;

	this.map(function(ele){
		if(ele._KSAUI_slideRender){
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
			init : function(){
				var ths = this;

				ths.num = this.item.length -1;
				ths.itemWidth = ths.item.eq(0).width(true);
				ths.widthScale = ths.itemWidth / ths.width;


				var newDom = $('<div class="ks-slide-c"></div>');
				newDom.html(this.item);
				ele.html(newDom);

				//组件
				var h = '';
				//左右切换按钮 带属性：data-slide-btn
				if(options.control) {
					h += '<div class="ks-slide-control-prev" icon="arrow_left"></div><div class="ks-slide-control-next" icon="arrow_right"></div>';
				}
				//状态栏 带属性：data-slide-status
				if(options.status){
					h += '<div class="ks-slide-status">';
					$.loop(ths.num, function(i, v){
						h +='<span>'+(options.status == 2 ? (v) : '')+'</span>';
					});
					h +='</div>';
				}
				//进度条 带属性：data-slide-progress
				if(options.progress) {
					h += '<div class="ks-slide-progress"><span '+(options.progress != 1 ? ' class="ks-bg-'+options.progress.trim()+'"' : '')+'></span></div>';
				}
				if(h){
					ele.append(h);
				}
				if(options.control) {
					ele.find('.ks-slide-control-prev').click(function(){
						E.play('prev');
					});
					ele.find('.ks-slide-control-next').click(function(){
						E.play('next');
					});
				}
				if(options.status){
					ele.find('.ks-slide-status span').click(function(){
						var v = $(this).index();
						if(v == ths.playIndex){
							return ;
						}
						var tp = 'next';
						//第一切换最后
						if(v === ths.num && ths.playIndex === 0){
							tp = 'prev';
							//最后切换第一
						}else if(v === 0 && ths.playIndex === ths.num){
							tp = 'next';
						}else if(v < ths.playIndex){
							tp = 'prev';
						}
						ths.play(tp, v);
						$(this).addClass('a').siblings().removeClass('a');
					});
				}


				ths.playIndex = ths.num;
				ths.play('next',0);
			},
			move : function(i, n, isCard){
				var mX = (this.itemWidth * n);
				var scale = 1;
				if(isCard){
					var leftP = (1-this.widthScale) /2 * this.width;
					if(n ==0){
						mX = leftP;
						scale = 1;
					}else{
						mX = ((this.itemWidth * n * 0.8) + leftP);
						scale = .8;
					}
				}
				this.item.eq(i).css('transform', 'translateX(' + mX + 'px) scale('+scale+')');
			},
			play : function(tp, index){
				var ths = this;
				if($.isset(index)){
					index = parseInt(index);
				}else{
					index = ths.playIndex;
					if(tp == 'prev'){
						index --;
					}else if(tp == 'next'){
						index ++;
					}
				}

				index = index <0 ? ths.num : (index > ths.num ? 0 : index);
				ele.attr({'playerindex':index, 'playeraction':tp});
				var indexL = index -1, indexR = index +1;
				indexL = indexL <0 ? ths.num : (indexL > ths.num ? 0 : indexL);
				indexR = indexR <0 ? ths.num : (indexR > ths.num ? 0 : indexR);

				//当前动作组
				var acgroup = [index,tp == 'next' ? indexL : indexR];
				ths.item.removeClass('a _hide _on _up');

				ths.item.eq(acgroup).removeClass('_hide')
					.addClass('_moveon').removeClass('_moveon',600)
					.each(function(_, e){
						var i = $(e).index();
						var mvn = i == index ? 0 : (i == indexL ? -1 : (i == indexR ? 1 : i));
						ths.move(i, mvn, !!options.card);
					});

				ths.item.eq([indexL, index, indexR]).addClass('_up');
				ths.item.eq(index).addClass('_on');

				//隐藏的动作组
				ths.item.each(function(i, e){
					if($.inArray(i, acgroup)){
						return;
					}
					$(e).addClass('_hide').removeClass('_hide',200);
					var mvn = tp =='next' ? 1 : -1;
					ths.move(i, mvn, !!options.card);
				});

				ths.playIndex = index;
				if(options.auto){
					$.setTimeout('ksauiSlide'+ths.id, function(){
						ths.play(tp);
					}, options.auto);
				}
				options.status && ele.find('.ks-slide-status span').removeClass('a').eq(index).addClass('a');
			}
		};

		E.init();


	}

	return this;
}


/**
 * form表单生成
 * @param {JSON} data 配置参数参考：
 * [
 * 		//一组一个表单
 * 		{
 * 			name:'sex', //字段名
 * 			type:'select', //展现类型select/radio/checkbox/switch/text/date
 * 			text:'性别', //表单标题名称
 * 			value:'2',
 * 			option:{ //多个选项列表 键名=值 键值=名称
 * 		    	'0' : '不填写',
 * 		    	'male' : '男',
 * 		    	'female' : '女'
 * 			}
 * 		},
 * 		...
 * 		...
 * ]
 * @returns {html}
 */
$.plugin.newForm = function(data){
	var $this = this;
	var H = '';
	H += '<form><div class="ks-form">';
	$.loop(data, function(value, key){
		if(value && $.isObject(value)) {
			value.value = value.value ? value.value : '';
			value.name = value.name ? value.name : key;
			value.placeholder = value.placeholder ? value.placeholder : '请输入...';
			value.style = value.style ? ' style="' + value.style + '"' : '';
			if (value.type == 'hidden') {
				H += '<input type="hidden" name="' + value.name + '" value="' + value.value + '">';
			}else{
				H += '<div class="ks-row">';
				if($.isset(value.label)){
					H += $this.tag(value.col ? 'span' : 'div', {
						class : 'ks-label',
						'data-required' : value.required ? true : null,
					}, value.label);
				}
				H += '<div class="ks-col">';
				if (value.after || value.before) {
					H += '<div class="ks-input">';
					H += value.before ? value.before : '';
				}
				//数字 普通输入框 密码框
				if ($.inArray(value.type, ['number', 'text', 'password'])) {
					H += $this.tag('input', {
						type: 'ks-' + value.type,
						name: value.name,
						value: value.value,
						placeholder: value.placeholder,
						style: value.style,
						class: 'ks-input'
					}, '', 1);
					//多行输入框
				} else if ($.inArray(value.type, ['textarea'])) {
					H += $this.tag('textarea', {
						name: value.name,
						placeholder: value.placeholder,
						style: value.style,
						class: 'ks-input'
					}, value.value);
					//开关
				} else if (value.type == 'switch') {
					value.value = value.value ? value.value : '';
					H += $this.tag('input', {
						type: 'ks-switch',
						name: value.name,
						value: value.value,
						text: (value.text ? value.text : '是'),
						style: value.style,
						checked: (value.value == 1 ? ' checked' : null)
					}, '', 1);
					//单选框
				} else if (value.type == 'radio') {
					$.loop(value.option, function (v,k) {
						H += $this.tag('input', {
							type: 'ks-radio',
							name: value.name,
							value: k,
							text: v,
							checked: (value.value == k ? ' checked' : null),
							style: value.style
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
									ch += ' ' + $this.tag('input', {
										type: 'ks-checkbox',
										name: value.name + '[]',
										value: k,
										text: v,
										checked: (value.value == k || $.inArray(k, value.value) ? ' checked' : null),
										style: value.style
									}, '', 1);
								}
							});
							return ch;
						}

						H += check_x(value.option);
					})();

					//下拉选择
				} else if (value.type == 'select') {
					H += '<select name="' + value.name + '" class="ks-select" ' + value.style + '>';
					$.loop(value.option, function (v, k) {
						H += '<option value="' + k + '" ' + (value.value == k ? ' selected' : '') + '>' + v + '</option>';
					});
					H += '</select>';
					//日期
				} else if (value.type == 'date') {
					H += $this.tag('input', {
						type: value.type,
						name: value.name,
						value: value.value,
						title: value.title,
						placeholder: value.placeholder,
						style: value.style,
						'ks-render': ''
					}, '', 1);
				} else if (value.type == 'area') {
					H += $this.tag('p', {
						'class': 'ks-area',
						'data-province': value.value.province,
						'data-city': value.value.city,
						'data-area': value.value.area,
						'data-town': value.value.town,
						'maxlevel' : value.value.maxlevel ? maxlevel : 4
					}, '请选择');
					if ($.isset(value.value.address)) {
						H += '<input type="text" name="address"  value="' + value.value.address + '" placeholder="请输入街道地址" class="ks-input ks-mt1">';
					}
					//HTML
				} else {
					H += '<div class="ks-form-text">' + value.value + '</div>';
				}
				if (value.after || value.before) {
					H += value.after ? value.after : '';
					H += '</div>';
				}
				H += '</div></div>';
			}
		}else if(value && $.isString(value)){
			H += '<div class="ks-form-title">'+value+'</div>';
		}
	});
	H += '</div></form>';
	return H;
}