/**
 * KSA前端底层驱动 V1.0
 *
 * 目前版本还处于开发中，请勿保存并用于生产环境！
 *
 * ---------------------------------------
 * 待正式发布版本后，源代码将会公开开源
 *
 * Author : ksaos.com && cr180.com(Mr Wu -  ChenJun)
 * Update : 2020年7月29日
 */
function debug(data){
	console.log.apply(this, arguments);//debug
}

var consoleGroupN = {};
function debugTime(key){
	consoleGroupN[key] = consoleGroupN[key] >=0 ? consoleGroupN[key] +1 : 0;
	key = key+'-'+consoleGroupN[key];
	console.time(key);
	return function(){
		console.timeEnd(key);
	};
}

(function(document, undefined, K) {
	"use strict";
	//on绑定事件时的索引
	var bindEventData = {};

	/**
	 * 给事件对象统一加上阻止冒泡事件
	 * @param events
	 * @returns {*}
	 */
	function eventAddstopPropagation(events){
		if(events) {
			events.stop = function(){
				this.stopPropagation();
				this.preventDefault();
			}
		}
		return events;
	}

	//浏览器不会单独解析table某个标签，它们必须有规则的在一起
	//所以需要针对table做单独的处理
	var wrapMap = {
		thead: [ 1, "<table>", "</table>" ],
		col: [ 2, "<table><colgroup>", "</colgroup></table>" ],
		tr: [ 2, "<table><tbody>", "</tbody></table>" ],
		td: [ 3, "<table><tbody><tr>", "</tr></tbody></table>" ],
		_default: [ 0, "", "" ]
	};
	wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
	wrapMap.th = wrapMap.td;
	var rtagName = ( /<([a-z][^\/\0>\x20\t\r\n\f]*)/i );


	/**
	 * 字符串转虚拟dom
	 * @param code
	 * @returns {ActiveX.IXMLDOMNodeList | NodeListOf<ChildNode>}
	 */
	function createDom(code, isEle){
		var fragment = document.createDocumentFragment();
		var tag = ( rtagName.exec( code ) || [ "", "" ] )[ 1 ].toLowerCase();
		var wrap = wrapMap[ tag ] || wrapMap._default;
		//创建虚拟dom并写入字符串
		//var dom = document.createRange().createContextualFragment(code);
		var dom = fragment.appendChild( document.createElement( "div" ) );
		dom.innerHTML = wrap[1]+code+wrap[2];
		var j = wrap[0];
		while ( j-- ) {
			dom = dom.lastChild;
		}
		//script的处理
		var globalScriptEvent = {}, //等待上一次script标签完成加载后需要执行的code
			scriptLoadCallback = {}, //存在src属性的script标签 队列，load成功后自动删除
			scriptSrcLast, scriptSrcLastID; //上一次存在src属性的script标签标记
		$(dom).find('script').map(function(ele){
			var script = document.createElement('script');
			$.loop($.attrs(ele), function(v, k){
				script[k] = v;
			});
			var scriptID = $.objectID(script);
			if (ele.src) {
				scriptLoadCallback[scriptID] = ele;
				script.onload = function () {
					delete scriptLoadCallback[scriptID];
					//如果队列为空
					if ($.isEmpty(scriptLoadCallback)) {
						$.loop(globalScriptEvent[scriptID], function (elArr) {
							elArr[0].text = elArr[1];
						});
					}
				};
				scriptSrcLast = script;
				scriptSrcLastID = scriptID;
			}
			if(scriptSrcLastID) {
				if (ele.text) {
					globalScriptEvent[scriptSrcLastID] = globalScriptEvent[scriptSrcLastID] ? globalScriptEvent[scriptSrcLastID] : [];
					globalScriptEvent[scriptSrcLastID].push([script, ele.text]);
				}
			}else{
				script.text = ele.text;
			}
			$(ele).after(script).remove();
		});



		var eles = [];
		$.loop(dom.childNodes, function (e) {
			if(!isEle || (e.nodeType !== 3 && e.nodeType !== 8)){
				eles.push(e);
			}
		});
		return eles;
	}


	/**
	 * 创建临时dom并回调
	 * @param {html|Node} code html或节点
	 * @param {function} callback 回调函数
	 * @param {boolean} reOrder 是否倒序回调
	 * @returns {tempDom}
	 */
	function tempDom(code, callback, reOrder){
		var dom;
		var isFunc = $.isFunction(code);
		if(code instanceof $){
			dom = code;
		}else if($.isDomAll(code)) {
			dom = code instanceof  NodeList ? code : [code];
		}else if($.isArray(code)){
			dom = code;
			//创建一个虚拟dom
		}else if($.isString(code)){
			dom = createDom(code);
		}
		//将传入的html或dom对象添加到虚拟dom中
		var length = this.length;
		$.loop(this, function (ele, index) {
			var isClone = index !== length-1;
			if(isFunc){
				dom = code.call(ele, index, ele.innerHTML);
				if($.isString(dom)){
					dom = createDom(dom);
					isClone = 0;
				}
				if(dom instanceof $){
					dom = [dom[0]];
					isClone = 0;
				}else if(dom instanceof HTMLElement || dom instanceof Node){
					isClone = 0;
				}
				dom = $.toArray(dom);
			}
			var n = !reOrder ? dom.length : 0;
			var i = reOrder ? dom.length -1 : 0;
			while (reOrder ? i >=0 : i < n){
				var eles = dom[i];
				eles = !isClone ? eles : $(eles).clone(true, true)[0];
				callback.call(ele, ele, eles);
				reOrder ? i -- : i++;
			}
		});
		return this;
	}

	/**
	 * 检查指定元素是否被选择器选择
	 * @param ele 需要检查的元素
	 * @param selector 选择器
	 * @returns {boolean|number|*}
	 */
	function isSelectDom(ele, selector) {
		if (!selector || !ele || ele.nodeType !== 1){
			return false
		}
		var matchesSelector = ele.matches || ele.matchesSelector || ele.webkitMatchesSelector || ele.mozMatchesSelector || ele.msMatchesSelector || ele.oMatchesSelector;
		try {
			return matchesSelector.call(ele, selectorStr(selector));
		}catch (e) {
			console.error(new Error('选择器语法可能有错误：'+selector));
		}
	}

	/**
	 * 递归遍历DOM节点
	 * @param element 需遍历的dom
	 * @param key 需遍历的节点
	 * @param selector 选择器
	 * @returns {[]}
	 */
	function dir(element, key, selector) {
		var rdom = [];
		$.loop(element,function(el){
			while ((el = el[key])) {
				if(!selector || isSelectDom(el, selector)){
					rdom.push(el);
				}
			}
		});
		return rdom;
	}

	function selectorStr(selector){
		if(selector){
			selector = selector.replace(/(\:selected)/g, ':checked');//option需要使用checked选中
		}
		return selector;
	}

	function $(selector){
		var dt = new K_S_A(selector);
		dt.__proto__ = K;
		return dt;
	}

	function K_S_A(selector){
		if(selector) {
			if (selector instanceof $) {
				return selector;
			} else if ($.isWindow(selector) || $.isDomAll(selector)) {
				selector = [selector];

			}else if($.isString(selector) && (selector = selector.trim()) && selector.indexOf('<') ==0 && selector.lastIndexOf('>') == selector.length-1 && selector.length >=3){
				selector = createDom(selector, true);

			}else if($.isString(selector)) {
				selector = selector.replace(/(\:selected)/g, ':checked');//option需要使用checked选中
				selector = [].slice.call(document.querySelectorAll(selectorStr(selector)));
			}else if($.isFunction(selector)){
				$.ready(selector);
				return;
			}
			var length = selector.length;
			var obj = {};
			$.loop(selector, function(ele, key){
				obj[key] = ele;
			});
			selector = obj;
			selector.length = length;
		}else{
			selector = {length:0};
		}

		if(selector.length) {
			$.arrayMerge(this, selector);
			this.length = selector.length;
		}
		return this;
	}

	K_S_A.prototype =  $.prototype = K = {};

	/**
	 * 文档加载完成后执行代码
	 * 与jQuery用法相同
	 * @param callback
	 * @returns {*}
	 */
	var DocumentReadyFunction = [];
	K.ready = function(callback) {
		this.map(function(ele){
			//如果是document与window的事件 则送到队列中 防止多次触发
			if(ele === document || ele === window){
				DocumentReadyFunction.push(function(){
					callback.call(ele)
				});
			}else{
				ele.addEventListener('DOMContentLoaded', function(){
					callback.call(ele);
				}, false);
			}
		});
		return this;
	}


	/**
	 * 监听dom变化（仅在KSA语法中有效）
	 */
	K.DOMchange = function(action, Callback){
		this.map(function(ele){
			var isBindEvent = ele.KSADOMchangeEvent ? true : false;
			if(!ele.KSADOMchangeEvent){
				ele.KSADOMchangeEvent = {};
			}
			$.loop($.explode(' ', action, ''), function(ac){
				ac = ac.toLowerCase();
				if(!ele.KSADOMchangeEvent[ac]){
					ele.KSADOMchangeEvent[ac] = [];
				}
				ele.KSADOMchangeEvent[ac].push(Callback);
			});
			//如果已经绑定过事件，则不再绑定
			if(isBindEvent){
				return;
			}
			$(ele).on('KSADOMchange', function(e){
				var ths = this, Arg = e.KSAcallbackArgs;
				Arg[0] = Arg[0].toLowerCase();
				//Arg参数 1=动作 2=新值 3=旧值
				if(!this.KSADOMchangeEvent || !this.KSADOMchangeEvent[Arg[0]]){
					return;
				}
				$.loop(this.KSADOMchangeEvent[Arg[0]], function(fun){
					fun.apply(ths, [Arg[1],Arg[2]]);
				});
			});
		});
		return this;
	}

	/**
	 * 克隆一个元素
	 * 与jQuery用法相同
	 * @param {boolean} withs 是否需要克隆子元素
	 * @param {boolean} deepWith 是否需要克隆事件
	 * @returns {*|jQuery|HTMLElement}
	 */
	K.clone = function(withs, deepWith){
		var newObj = $();
		this.each(function(index, ele){
			var eleID = $.objectID(ele);
			var events = bindEventData[eleID];
			var newEle = ele.cloneNode(withs);
			$.objectID(newEle,'');
			//复制事件
			if(deepWith && events){
				var $newEle = $(newEle);
				$.loop(events, function(evn, evnName){
					$.loop(evn, function(ev){
						$newEle.on(evnName, ev.selector, ev.callback);
					})
				});
			}
			newObj.push(newEle);
		});
		return newObj;
	}


// ====================== 创建虚拟DOM ====================== //
	$.dom = function(code){
		var dom = createDom(code);
		return dom.length === 1 ? dom[0] : dom;
	}
// ====================== 文档操作 ====================== //

	/**
	 * 更新元素的class值
	 * @param ele 元素对象
	 * @param inClass 需要处理的class 多个以空格分割
	 * @param isDel 是否为删除
	 * @param ms 是否需要延迟 毫秒
	 */
	function eleUpdateClass(ele, inClass, isDel, ms){
		if(!inClass){
			return ;
		}
		function _clsrun() {
			var className = ele.getAttribute('class') || '';
			var newClass = {};
			$.loop($.explode(' ', (className + ' ' + inClass), ''), function (val) {
				val = val.trim();
				if (val) {
					newClass[val] = 1;
				}
			});

			if (isDel) {
				inClass = $.explode(' ', inClass, '');
				$.loop(newClass, function (val, key) {
					if ($.inArray(key, inClass)) {
						delete newClass[key];
					}
				});
			}
			newClass = $.implode(' ', Object.keys(newClass));

			if (newClass && newClass != className) {
				ele.className = newClass;
			} else if (!newClass) {
				ele.removeAttribute('class');
			}
		}
		if(ms >0){
			window.setTimeout(_clsrun,ms);
		}else{
			_clsrun();
		}
	}

	/**
	 * 添加class
	 * 最后更新 : 2020年6月19日 20:01:50
	 * 与jQuery用法相同
	 * @param name 需要添加的class值，多个以空格分割
	 * @param ms 延迟多少毫秒后添加
	 * @returns {$}
	 */
	K.addClass = function(name, ms){
		if(name){
			var msArr = ms && $.isArray(ms) ? ms : null;
			this.each(function(index, ele){
				var inms = msArr ? msArr[index] : ms;
				eleUpdateClass(ele, name, false, inms);
			});
		}
		return this;
	}

	/**
	 * 删除class
	 * 最后更新 : 2020年6月19日 20:01:50
	 * 与jQuery用法相同
	 * @param name 需要删除的class值，多个以空格分割
	 * @param ms 多少毫秒后删除
	 * @returns {$}
	 */
	K.removeClass = function(name, ms){
		if(name){
			var msArr = ms && $.isArray(ms) ? ms : null;

			this.each(function(index, ele){
				var inms = msArr ? msArr[index] : ms;
				eleUpdateClass(ele, name, true, inms);
			});
		}
		return this;
	}

	/**
	 * 检查被选元素集合中是否存在指定class
	 * 与jQuery用法相同
	 * @param cls
	 * @returns {boolean}
	 */
	K.hasClass = function(cls){
		var ele, i = 0;
		while ((ele = this[i++])) {
			if (ele.nodeType === 1){
				var cl = ele.getAttribute('class');
				if(cl && cl.length && $.inArray(cls, $.explode(' ',cl,''))){
					return true;
				}
			}
		}

		return false;
	}


	K.prop = function(key, value){
		key = $.explode(' ', key, '');
		//删除或更新
		if($.isset(value)){
			value = value ==='' ? null : value;
			this.map(function(ele){
				$.loop(key, function(k){
					//移除模式
					if(value === null){
						delete ele[k];
						//更改模式
					}else if($.isset(value)){
						var old = ele[k];
						if(old !== value){
							ele[k] = value;
							$(ele).trigger('KSADOMchange',['attr.'+k]);
						}
					}
				});
			});
			return this;
		//读取模式
		}else{
			var ele = this[0];
			if(!ele){
				return;
			}
			var dt = {};
			$.loop(key, function(k){
				dt[key] = ele[key];
			});
			if(key.length === 1){
				return dt[key[0]];
			}else{
				return dt;
			}
		}
	};


	var ElementAttrBooleanArr = ['active','checked','selected','async','autofocus','autoplay','controls','defer','disabled','hidden','ismap','loop','multiple','open','readonly','required','scoped'];

	/**
	 * 读取指定元素所有attr属性值
	 * @param {*} ele 
	 */
	$.attrs = function(ele){
		if(!ele || !ele.attributes){
			return;
		}
		var attrs = {};
		$.loop(ele.attributes, function(val){
			var v = val.value;
			if($.inArray(val.name, ElementAttrBooleanArr)){
				v = $.inArray(val.name, ['checked','selected']) ? ele[val.name] : v;
				v = v ==='' ? true  : !!v;
			}
			attrs[val.name] = v;
		});
		return attrs;
	}

	/**
	 * 设置元素原生属性与标签属性
	 * @param key 属性名
	 * @param value 属性值
	 * @param isCustom 是否为自定义属性
	 * @returns {EleAttrPropUped|boolean}
	 * @constructor
	 */
	function EleAttrPropUped(key, value, isCustom){
		var isValue = $.isset(value);
		value = !!value;
		if(!isValue){
			var ele = this[0];
			if(!ele){
				return;
			}
			if(ele.tagName ==='INPUT' && $.inArray(key, ['checked'])){
				return ele[key];
			}
			var val = ele.getAttribute(key);
			if($.isNull(val)){
				val = ele[key];
			}
			val = val ==='' ? true : val;
			return $.inArray(val, ['false','undefined','null']) ? false : !!val;
		}else if($.isset(value)){
			this.map(function(ele){
				var old = ele[key];
				if(old === value){
					return;
				}
				if(value){
					ele[key] = value;
					ele.setAttribute(key, key);
				}else{
					if(isCustom){
						delete ele[key];
					}else{
						ele[key] = false;
					}
					ele.removeAttribute(key);
				}
				$(ele).trigger('KSADOMchange',['attr.'+key, value, old]);
			});
			return this;
		}
	}

	K.checked = function(value){
		return EleAttrPropUped.call(this, 'checked', value);
	}

	K.selected = function(value){
		return EleAttrPropUped.call(this, 'selected', value);
	}

	K.disabled = function(value){
		return EleAttrPropUped.call(this, 'disabled', value);
	}
	K.active = function(value){
		return EleAttrPropUped.call(this, 'active', value, 1);
	}


	/**
	 * attr操作
	 * 与jQuery用法相同
	 * key与value都不传值时表示读取所有属性 以object方式返回
	 * 如选择器有多个节点，则根据节点序号以数组方式返回
	 * @param {string|object} key 属性名支持单个值、多个值(空格分开)、对象（写入模式，键名=属性名 键值=属性值）
	 * @param value 属性值 不传入=读取模式 null|空值=删除模式
	 * @returns {K|[]}
	 */
	K.attr = function (key, value) {
		value = value ==='' ? null : value;
		var valueIsNull = value === null;
		var isKey = $.isset(key);
		var keyIsobj = $.isObject(key);
		var isvalue = $.isset(value);
		var md = '';
		if(keyIsobj || (isKey && isvalue && !valueIsNull)){
			md = 'set';
		}else if(isKey && valueIsNull){
			md = 'del';
		}else if((!isKey || !keyIsobj) && !isvalue){
			md = 'get';
		}

		if(!keyIsobj){
			key = $.explode(' ', key, '');
		}
		var dataAttr = {};//需要变更的-data属性
		if(md =='get'){
			var ele = this[0];
			if(!ele){
				return;
			}
			var attrs = {};
			//读取所有标签属性
			if(!isvalue && !isKey){
				attrs = $.attrs(ele);
			}else{
				$.loop(key, function(k) {
					var attrV = ele.getAttribute(k);
					if(!$.isNull(attrV)){
						attrs[k] = attrV;
					}
				});
			}
			if(key.length === 1){
				return attrs[key[0]];
			}else{
				return attrs;
			}
		//写入模式
		}else if(md =='set') {
			var sets;
			if (keyIsobj) {
				sets = key;
			} else {
				sets = {};
				$.loop(key, function (k) {
					sets[k] = value;
				});
			}
			if (sets) {
				this.map(function (ele) {
					var oldAttrs = $.attrs(ele);
					var isUpdate;
					$.loop(sets, function (val, k) {
						var odV = oldAttrs[k] === '' ? true : oldAttrs[k];//如果旧值是空值 则以true表示

						//新旧值不同才更新
						if(!odV || val !== odV){
							val === '' || $.isNull(val) ? ele.removeAttribute(k) : ele.setAttribute(k, (val === true ? '' : val));
							$(ele).trigger('KSADOMchange', ['attr.'+k, val, odV]);
							if (k.indexOf('data-') === 0) {
								dataAttr[k.substr(5)] = val;
							}
							isUpdate = 1;
						}
					});
					//触发ele的属性变更事件
					isUpdate && $(ele).trigger('KSADOMchange',['attr']);
				});
			}
			if(!$.isEmpty(dataAttr)){
				this.data(dataAttr);
			}
			return this;

		}else if(md == 'del'){

			this.map(function (ele) {
				var attrs = $.attrs(ele);
				$.loop(key, function(k){
					if (k.indexOf('data-') === 0) {
						dataAttr[k.substr(5)] = null;
					}
					ele.removeAttribute(k);
					$.isset(attrs[k]) && $(ele).trigger('KSADOMchange', ['attr.'+k]);
				});
			});
			if(!$.isEmpty(dataAttr)){
				this.data(dataAttr);
			}
			return this;
		}
	}

	/**
	 * 移除元素属性
	 * 与jQuery用法相同
	 * @param key
	 * @returns {*}
	 */
	K.removeAttr = function (key) {
		if(key) {
			this.attr(key, null);
		}
		return this;
	}

	/**
	 * 设置或返回元素data-属性值
	 * 与jQuery用法相同
	 * @param key
	 * @param value
	 * @returns {{}|*}
	 */
	K.data = function(key, value){
		value = value ==='' ? null : value;
		var valueIsNull = value === null;
		var isKey = $.isset(key);
		var keyIsobj = $.isObject(key);
		var isvalue = $.isset(value);
		var md = '';
		if(keyIsobj || (isKey && isvalue && !valueIsNull)){
			md = 'set';
		}else if(isKey && valueIsNull){
			md = 'del';
		}else if((!isKey || !keyIsobj) && !isvalue){
			md = 'get';
		}

		key = key && !keyIsobj ? $.explode(' ', key, '') : key;

		if(md =='set'){
			this.map(function(ele){
				if(!ele._KSAOS_COM_ELE_DATA){
					ele._KSAOS_COM_ELE_DATA = {};
				}
				var _Attrs = ele._KSAOS_COM_ELE_DATA;
				var setData = {};
				if(keyIsobj) {
					setData = key;
				}else{
					$.loop(key, function(k){
						setData[k] = value;
					});
				}
				$.loop(setData, function(v, k){
					v = v === '' ? null : v;
					var sk = 'data-'+k;
					if(!$.isObject(v)){
						//值为null则删除
						if($.isNull(v)){
							ele.removeAttribute(sk);
							$.isset(_Attrs[k]) && delete _Attrs[k];
							$(ele).trigger('KSADOMchange', ['data.'+k]);
						//值不同才更新
						}else if(_Attrs[k] !== v){
							ele.setAttribute(sk, v);
							$(ele).trigger('KSADOMchange', ['data.'+k, v, _Attrs[k]]);
							_Attrs[k] = v;
						}
					}else{
						_Attrs[k] = v;
					}
				});
			});
			return this;

		}else if(md == 'get'){
			var ele = this[0];
			if(!ele){
				return;
			}
			if(!ele._KSAOS_COM_ELE_DATA){
				ele._KSAOS_COM_ELE_DATA = {};
			}
			if(key){
				var getdt = {};

				$.loop(key, function(k){
					var v = ele._KSAOS_COM_ELE_DATA[k];
					if(!$.isset(v)){
						v = ele.getAttribute('data-'+k);
					}
					if(!$.isNull(v)) {
						getdt[k] = v;
					}
				});
				if(key.length === 1){
					return getdt[key[0]];
				}else{
					return getdt;
				}
			}else{
				var getdt = ele._KSAOS_COM_ELE_DATA || {};
				$.loop(this.attr(), function(val, k){
					if(k.indexOf('data-') === 0){
						getdt[k.substr(5)] = val;
					}
				});
				if(!$.isEmpty(getdt)){
					return getdt;
				}
			}
		}else if(md ==='del'){
			this.map(function (ele) {
				var _Attrs = ele._KSAOS_COM_ELE_DATA;
				if(_Attrs){
					$.loop(key, function(k){
						if($.isset(_Attrs[k])){
							$(ele).trigger('KSADOMchange', ['data.'+k, undefined, _Attrs[k]]);
							ele.removeAttribute('data-'+k);
							delete _Attrs[k];
						}
						
					});
				}
			});
			return this;
		}

	}

	/**
	 * 移除data-属性
	 * 与jQuery用法相同
	 * @param key
	 * @returns {*}
	 */
	K.removeData = function(key){
		if(key) {
			this.data(key, null);
		}
		return this;
	}

	/**
	 * 清空节点
	 * 与jQuery用法相同
	 */
	K.empty = function(){
		this.map(function(ele){
			var h = ele.innerHTML;
			ele.innerHTML = '';
			$(ele).trigger('KSADOMchange', ['html', '', h]);
		});
		return this;
	}

	/**
	 * 表单值的读写
	 * 与jQuery用法相同
	 * @param value
	 * @returns {K|[]}
	 */
	K.val = function(value){
		//写入值
		if($.isset(value) && value !== null){
			this.map(function(ele, index){
				if($.inArray(ele.tagName, ['INPUT','SELECT','TEXTAREA'])) {
					if($.isFunction(value)) {
						var oldvalue = ele.value;
						if(ele.tagName == 'SELECT' && ele.multiple){
							oldvalue = [];
							$.loop(ele.options, function (e) {
								e.selected && oldvalue.push(e.value);
							});
						}
						value = value.call(ele, index, oldvalue);
					}
					//所有选中状态必须经过attr函数 否则无法完成变更事件触发
					switch (ele.tagName) {
						case 'INPUT':
							var tp = ele.getAttribute('type');
							tp = tp.indexOf('ks-') === 0 ? tp.substr(3) : tp;
							
							if(tp ==='checkbox'){
								var val = $(ele).attr('value');
								if($.isset(val)){
									$(ele).checked($.isArray(value) ? $.inArray(val, value) : val == value);
								}else{
									$(ele).checked($.isObject(value) ? $.isEmpty(value) : !!value);
								}
								
							}else if(tp ==='radio'){
								$(ele).checked($(ele).attr('value') == value);
							}else{
								ele.value = value;
							}
							break;
						case 'SELECT':
							value = $.isArray(value) ? value : [value];
							if (ele.options) {
								$.loop(ele.options, function (e) {
									var r = $.inArray(e.value, value);
									if (r != e.selected) {
										e.selected = r;
									}
								});
							}
							$(ele).trigger('ksachange');//触发内部事件
							break;
						case 'TEXTAREA':
							ele.value = value;
							break;
						default:
					}
					$(ele).trigger('KSADOMchange', ['val', value]);
				}
			});
			return this;
			
		//获取值，如果有多个对象，则按数组顺序返回对应值
		}else {
			var t = [];
			var ele = this[0];
			if(!ele || ele.disabled){
				return;
			}

			var tg = ele.tagName;
			switch (tg) {
				case 'INPUT':
					var tp = ele.getAttribute('type');
						tp = tp.indexOf('ks-') === 0 ? tp.substr(3) : tp;
					if($.inArray(tp, ['checkbox','radio'])){
						ele.checked && t.push(ele.value);
					}else{
						t.push(ele.value);
					}

					break;
				case 'SELECT':
					$(ele).find('option:selected').map(function(e){
						t.push(e.value);
					});
					break;
				case 'TEXTAREA':
					t.push(ele.value);
					break;
				default:
			}
			if(t.length === 1){
				return t[0];
			}else{
				return t;
			}
		}
	}

	/**
	 * 写入或读取文本
	 * 与jQuery用法相同
	 * @param {html|Node} value 传值表示写入
	 * @returns {string|$}
	 */
	K.text = function(value){
		if($.isset(value)){
			this.map(function(ele, index){
				if (ele.nodeType === 1 || ele.nodeType === 11 || ele.nodeType === 9) {
					var oldtxt = ele.textContent;
					if(oldtxt != value){
						ele.textContent = $.isFunction(value) ? value.call(ele, index, oldtxt) : value;
						$(ele).trigger('KSADOMchange', ['html', value, oldtxt]);
					}
				}
			});
			return this;
		}else {
			var t = [];
			this.map(function (ele) {
				t.push(ele.textContent || '');
			});
			return t.join("\n");
		}
	};

	/**
	 * 遍历所有直接子节点（包含文本节点）
	 * 与jQuery用法相同
	 * @returns {string|K}
	 */
	K.contents = function(){
		var newObj = $();
		this.map(function(ele){
			$.loop(ele.childNodes, function(e){
				newObj.push(e);
			});
		});
		return newObj;
	};

	/**
	 * 写入或读取HTML源码
	 * 与jQuery用法相同
	 * @param {html|Node} value 传值表示写入
	 * @returns {string|$}
	 */
	K.html = function(value){
		if($.isset(value)){
			this.map(function(ele, index){
				$(ele).empty().append($.isFunction(value) ? value.call(ele, index, ele.innerHTML) : value);
				$(ele).trigger('KSADOMchange', ['html']);
			});
			return this;
		}else{
			var t = [];
			this.map(function(ele){
				ele.innerHTML && t.push(ele.innerHTML || '');
			});
			return t.join("\n");
		}
	};

	/**
	 * 获取指定域中的表单数据
	 * 必须通过$选择器触发
	 * @param isFormData 是否返回FormData对象
	 * @returns {{}}
	 */
	K.formData = function(isFormData){
		var formData = {};
		var ele = this[0];
		if(isFormData){
			formData = new FormData(ele);
		}else {
			$(ele).find('input, textarea, select').each(function (i, el) {
				el = $(el);
				var name = el.attr('name');
				var val = el.val();
				var type = el.attr('type');
				if (name) {
					if (type === 'file') {
						formData[name] = el[0].files.length ? el[0].files[0] : '';
					} else if ($.inArray(type, ['radio', 'checkbox'])) {
						if (el.checked()) {
							formData[name] = val;
						}
					} else {
						if ($.isArray(val)) {
							formData[name] = [];
							$.loop(val, function (v) {
								formData[name].push(v);
							})
						} else {
							formData[name] = val;
						}
					}
				}
			});
		}

		return formData;
	}

	/**
	 * 获得一个form的表单数据
	 * 与jQuery用法相同
	 * @returns {*}
	 */
	K.serialize = function(){
		var dt = this.formData();
		return $.urlGetString(dt, true);
	}


	/**
	 * 移除节点
	 * 与jQuery用法相同
	 * @returns {$}
	 */
	K.remove = function(){
		this.map(function(ele){
			if(ele.parentNode){
				ele.parentNode.removeChild(ele);
				$(ele).trigger('KSADOMchange', ['remove']);
			}
		});
		return this;
	}

	/**
	 * 在节点之后添加
	 * 与jQuery用法相同
	 * @param {html|Node} html
	 * @returns {this}
	 */
	K.after = function (html) {
		return tempDom.call(this, html, function(ele, node){
			if(ele.parentNode){
				ele.parentNode.insertBefore(node, ele.nextSibling);
				$(ele).trigger('KSADOMchange', ['after']);
			}
		}, true);
	}

	/**
	 * 在节点之前添加
	 * 与jQuery用法相同
	 * @param {html|Node} html
	 * @returns {this}
	 */
	K.before = function (html) {
		return tempDom.call(this, html, function(ele, node){
			if(ele.parentNode){
				ele.parentNode.insertBefore(node, ele);
				$(ele).trigger('KSADOMchange', ['before']);
			}
		});
	}

	/**
	 * 在节点内部最后添加
	 * 与jQuery用法相同
	 * @param {html|Node} html
	 * @returns {this}
	 */
	K.append = function (html) {
		return tempDom.call(this, html, function(ele, node){
			if(!node){
				return;
			}
			ele.appendChild(node);
			$(ele).trigger('KSADOMchange', ['append']);
		});
	}

	/**
	 * 在节点内部最前面添加
	 * 与jQuery用法相同
	 * @param {html|Node} html
	 * @returns {this}
	 */
	K.prepend = function (html) {
		return tempDom.call(this, html, function(ele, node){
			ele.insertBefore(node, ele.firstChild);
			$(ele).trigger('KSADOMchange', ['prepend']);
		}, true);
	}

	/**
	 * 用指定dom包裹集合中的每个元素
	 * 与jQuery用法相同
	 * @param html
	 * @returns {*}
	 */
	K.wrap = function(html){
		this.map(function(e, index){
			var dom = $.dom($.isFunction(html) ? html.call(e, index) : html);
			$(e).after(dom);
			$(dom).html(e);
		});

		return this;
	}

	/**
	 * 将集合中所有元素包裹在一个节点中（第一个顺序位置）
	 * 与jQuery用法相同
	 * @param html
	 * @returns {*}
	 */
	K.wrapAll = function(html){
		var dom = $($.isFunction(html) ? html.call(e, index) : html);
		$(this[0]).before(dom);
		dom.html(this);
		return this;
	}

	/**
	 * 将集合元素内部用指定节点包裹
	 * 与jQuery用法相同
	 * @param html
	 * @returns {*}
	 */
	K.wrapInner = function(html){
		this.map(function(e){
			e = $(e);
			var dom = $($.isFunction(html) ? html.call(e, index) : html);
			dom.html(e.contents());
			e.html(dom);
		});
		return this;
	}
// ====================== 尺寸 、位置 ====================== //

	/**
	 * 设置返回元素高度
	 * @param {boolean/number} val true=返回包含padding+border
	 * @param isMargin true = 返回包含margin
	 * @returns {number}
	 */
	K.height = function(val, isMargin){
		if(!$.isset(val) || val === true){
			var dom = this[0];
			if(!dom){
				return;
			}
			if(dom === window || dom === document){
				return document.documentElement.clientHeight || document.body.clientHeight;
			}else{
				var size = dom.offsetHeight;
				var css =  $.intval(this.css('paddingBottom paddingTop borderBottomWidth borderTopWidth marginBottom marginTop'));
				//真实尺寸
				if(val !== true){
					size -= (css.paddingBottom + css.paddingTop + css.borderBottomWidth + css.borderTopWidth);
				}
				if(isMargin === true){
					size += (css.marginBottom + css.marginTop);
				}
				return size;
			}
		}else{
			this.css('height', $.isNumber(val) ? val+'px' : val);
			return this;
		}
	}

	/**
	 * 设置返回元素宽度
	 * @param {boolean/number} val true=返回包含padding+border
	 * @param isMargin true = 返回包含margin
	 * @returns {number}
	 */
	K.width = function(val, isMargin){
		if(!$.isset(val) || val === true){
			var dom = this[0];
			if(dom === window || dom === document){
				return document.documentElement.clientWidth || document.body.clientWidth;
			}else{
				var size = dom.offsetWidth;
				var css =  $.intval(this.css('paddingLeft paddingRight borderLeftWidth borderRightWidth marginLeft marginRight'));
				//真实尺寸
				if(val !== true){
					size -= (css.paddingLeft + css.paddingRight + css.borderLeftWidth + css.borderRightWidth);
				}
				if(isMargin === true){
					size += (css.marginLeft + css.marginRight);
				}
				return size;
			}

		}else{
			this.css('width', $.isNumber(val) ? val+'px' : val);
			return this;
		}
	}

	/**
	 * 返回元素坐标
	 * 用法与jQuery相同
	 * @returns {{top: number, left: number}}
	 */
	K.offset = function(){
		var ele = this[0];
		if (!ele) {
			return;
		}
		if (!ele.getClientRects().length) {
			return {
				top: 0,
				left: 0
			};
		}

		var rect = ele.getBoundingClientRect();
		var win = ele.ownerDocument.defaultView;
		return {
			top: rect.top + win.pageYOffset,
			left: rect.left + win.pageXOffset
		};
	}

	/**
	 * 显示一个元素
	 * 不支持任何参数
	 * @returns {*}
	 */
	K.show = function(){
		this.map(function(e){
			e.style.display = e.style.display ==='none' ? "block" : '';
			$(e).trigger('KSADOMchange', ['show']);
		});
		return this;
	}

	/**
	 * 隐藏一个元素
	 * 不支持任何参数
	 * @returns {*}
	 */
	K.hide = function(){
		this.map(function(e){
			e.style.display = "none";
			$(e).trigger('KSADOMchange', ['hide']);
		});
		return this;
	}



	/**
	 * 执行一个动画
	 * @param {int/arrat} numbers 需要动画的数值 数字 或 数字数组
	 * @param Atimes 动画时间 （毫秒）
	 * @param callFunc 每帧动画回调函数
	 * 				参数1 = 根据numbers参数回调当前帧下的动画偏移值
	 * 				参数2 = 当前帧顺序值
	 * 				参数3 = 距离上一次的时间间隔（毫秒）
	 * @returns {{}}
	 * @constructor
	 */
	$.AnimationFrame = function (numbers, Atimes, callFunc){
		if(!$.AnimationFrameCache) {
			$.AnimationFrameCache = {_index: 0};
		}
		if(!numbers){
			return;
		}
		Atimes = parseInt(Atimes || 0) || 2000;
		var id = $.AnimationFrameCache._index++;
		var start;
		var aObj = $.AnimationFrameCache[id] = {};
		var _Atime = 0;//每帧间隔时间
		var _Aindex = 0; //帧顺序
		var numbersIsArr = $.isArray(numbers);
		//计算步进值 = 总值 / 每帧时间间隔 * 当前帧值
		function _stepVal(val, time){
			time = parseFloat(time).toFixed(0);
			var rate = Math.min((time / Atimes).toFixed(2), 1);
			//debug('完成度：'+(rate *100)+'%');
			return parseInt(val * rate);
		}

		var lastTime;  //最后一次触发时间
		function _thisRun(timestamp) {
			if(!aObj.start){
				aObj.start = timestamp;
			}
			start = aObj.start;
			//距离第一次的时间间隔
			var progress = timestamp - start;
			//记录与上一次动画的间隔时间
			if(!_Atime){
				_Atime = timestamp - lastTime;
			}
			var callResult;
			if(_Atime >0 && progress <= Atimes){
				_Aindex ++;
				if(numbersIsArr){
					var callNumber = [];
					$.loop(numbersIsArr, function(value){
						callNumber.push(_stepVal(value, progress));
					});
				}else{
					callNumber = _stepVal(numbers, progress);
				}
				callResult = callFunc.call('', callNumber, _Aindex, _Atime);
			}
			//如果回调函数执行结果为false 或 执行时间超过限定时 终止动画
			if(callResult === false || progress >= Atimes){
				window.cancelAnimationFrame(aObj.AnimationID);
				delete $.AnimationFrameCache[id];
			}else{
				window.cancelAnimationFrame(aObj.AnimationID);
				aObj.AnimationID = window.requestAnimationFrame(_thisRun);
			}
			lastTime = timestamp;//记录最后一次触发时间
		}
		aObj.AnimationID = window.requestAnimationFrame(_thisRun);
		return aObj;
	}


	/**
	 * 设定被选元素滚动条垂直坐标
	 * @param val 需要设置的坐标值
	 * @param AnimationTime 动画时间（毫秒）
	 * @returns {*}
	 */
	K.scrollTop = function(val, AnimationTime){
		if(!$.isset(val)){
			var dom = this[0];
			if(dom === document){
				dom = dom.scrollingElement;
			}
			return dom ? dom.scrollTop : 0;
		}else{
			this.map(function(e){
				var top = e.scrollTop;
				var distance = val - top; //需要滚动的距离
				//5px内不需要动画
				if(AnimationTime && distance >= -5 && distance <=5){
					AnimationTime = false;
				}
				if(AnimationTime){
					AnimationTime = AnimationTime === true ? 500 : AnimationTime;
					$.AnimationFrame(distance, AnimationTime, function(callVal){
						if(Math.abs(callVal) > Math.abs(distance)){
							return false;
						}

						e.scrollTop = top + callVal;
					});
				}else{
					e.scrollTop = top + distance;
				}
			});
			return this;
		}
	}

	/**
	 * 设定被选元素滚动条纵向坐标
	 * @param val 需要设置的坐标值
	 * @param AnimationTime 动画时间（毫秒）
	 * @returns {*}
	 */
	K.scrollLeft = function(val, AnimationTime){
		if(!$.isset(val)){
			return this[0] ? this[0].scrollLeft : 0;
		}else{
			this.map(function(e){
				e.scrollLeft = parseFloat(val);

				var left = e.scrollLeft;
				var distance = val - left; //需要滚动的距离
				//5px内不需要动画
				if(AnimationTime && distance >= -5 && distance <=5){
					AnimationTime = false;
				}
				if(AnimationTime){
					AnimationTime = AnimationTime === true ? 500 : AnimationTime;
					$.AnimationFrame(distance, AnimationTime, function(callVal){
						if(Math.abs(callVal) > Math.abs(distance)){
							return false;
						}
						e.scrollLeft = left + callVal;
					});
				}else{
					e.scrollLeft = left + distance;
				}

			});
			return this;
		}
	}

	/**
	 * 设置或返回一个元素的css样式
	 * 用法与jQuery相同
	 * @param key css名称
	 * @param value css值
	 * @returns {{}|unknown}
	 */
	K.css = function(key, value){
		var cssNumber = [
			'animationIterationCount','columnCount','fillOpacity','flexGrow','flexShrink','fontWeight','gridArea','gridColumn','gridColumnEnd','gridColumnStart','gridRow','gridRowEnd','gridRowStart','lineHeight','opacity','order','orphans','widows','zIndex','zoom'];
		value = value ==='' ? null : value;
		var sets, gets={}, keyIsObj = $.isObject(key), isValue = $.isset(value);
		if(key) {
			if (!isValue && keyIsObj) {
				sets = key;
			} else if(isValue){
				sets = {};
				sets[key] = value;
			}
			var style = [];
			$.loop(sets, function(value, key){
				key = key.replace(/\-([a-z]{1})/g,function(_1,_2){return _2.toUpperCase()+'';});
				var soukey = key.replace(/^(-moz-|-ms-|-webkit-|-o-|\+|_|\*)/ig, '');
				if(!$.inArray(soukey, cssNumber) && $.isNumber(value)){
					value = value + 'px';
				}
				sets[key] = value;
				style.push(key+':'+value);
			});
			style = style.length ? $.implode('; ',style) : '';
			if(sets) {
				this.map(function (e) {
					var isEdit;
					$.loop(sets, function(v, k){
						if(e.style[k] != v){
							var oldv = e.style[k];
							e.style[k] = v;
							$(e).trigger('KSADOMchange', ['css.'+k, v, oldv]);
							isEdit = 1;
						}
					});
					isEdit && $(e).trigger('KSADOMchange', ['css']);
				});
				return this;
			}else{
				if(this[0]) {
					var getkeys = $.explode(' ', key, '');
					var sty = window.getComputedStyle(this[0], null);
					$.loop(getkeys, function (val) {
						gets[val] = sty[val];
					});
					if (getkeys.length === 1) {
						return gets[getkeys[0]];
					} else {
						return gets;
					}
				}
			}
		}
	}

// ====================== 遍历 ====================== //

	/**
	 * 循环函数
	 * @param {object/array/NodeList/Number} dt
	 * @param {function} fun 每次循环函数(value, key, index)
	 * @param {string} actions 取值动作 first=只取第一个 last=只取最后一个
	 * @returns {*}
	 */
	$.loop = function(dt, fun, actions){
		if(!dt){
			return;
		}
		if(dt instanceof $ || $.isArrayLike(dt)) {
			var length = dt.length;
			if(!length){
				return;
			}
			for (i = 0; i < dt.length; i++) {
				var val = dt[i];
				if ((actions && (actions === 'first' || (actions === 'last' && i === length - 1))) || fun(val, i, i) === true) {
					return val;
				}
			}

		}else if($.isNumber(dt)){
			for (i = 1; i <= dt; i++) {
				if ((actions && (actions === 'first' || (actions === 'last' && i === dt - 1))) || fun(i, i-1, i-1) === true) {
					return i;
				}
			}
		}else if($.isObject(dt)){
			var keys = Object.keys(dt),
				i=0,
				len = keys.length,
				key, val;
			if(len) {
				for (key in keys) {
					var k = keys[key];
					val = dt[k];
					if ((actions && (actions === 'first' || (actions === 'last' && i === len - 1))) || fun(val, k, i) === true) {
						return val;
					}
					i++;
				}
			}
		}
	}

	/**
	 * 循环遍历
	 * @param obj
	 * @param callback
	 * @returns {*}
	 */
	K.each = function(callback) {
		$.loop(this, function(ele, index){
			callback && callback.call(ele, index, ele);
		});
		return this;
	}

	/**
	 * 数组map方法实现
	 * @param elements
	 * @param callback
	 * @returns {[]}
	 */
	$.map = K.map = function(elements, callback){
		var isThis = false;
		if(!callback && $.isFunction(elements)){
			callback = elements;
			elements = this;
			isThis = true;
		}
		var newArr = [], i =0;
		$.loop(elements, function(val, k){
			var r = callback.call(isThis ? val : window, val, k, i);
			if(r !== null && $.isset(r)){
				newArr.push(r);
			}
			i ++;
		});
		if(isThis){
			newArr = $(newArr);
		}
		return newArr;
	}

	/**
	 * 取集合范围
	 * @returns {*[]}
	 */
	$.slice = K.slice = function(){
		var arr = $();
		$.loop([].slice.apply(this, arguments), function(e){
			arr.push(e);
		});
		return arr;
	}

	/**
	 * 在当前选择器集合中添加一个新的
	 * @param ele
	 */
	K.push = function(ele){
		var ths = this;
		var length = ths.length ? ths.length : 0;
		if(ele instanceof $){
			ele.each(function(_, e){
				ths[length] = e;
				length ++;
			});
		}else if($.isArray(ele)){
			$.loop(ele, function(e){
				ths[length] = e;
				length ++;
			});
		}else{
			ths[length] = ele;
			length ++;
		}
		if(length){
			ths.length = length;
		}
		return ths;
	}

	/**
	 * 取匹配集合 顺序为n的节点
	 * 支持以数字数组方式取
	 * 与jquery用法相同
	 * @param {number/array} n
	 * @returns {*}
	 */
	K.eq = function(n){
		var isArr = $.isArray(n);

		var obj = $();
		this.map(function(e, i){
			if((isArr && $.inArray(i, n)) || (!isArr && i == n)){
				obj.push(e);
			}
		});
		return obj;
	}

	/**
	 * 获取指定元素在父级下的索引顺序值
	 * 该方法不接受任何参数
	 * @returns {number}
	 */
	K.index = function(){
		var ele = this[0];
		var index = -1;
		if(ele) {
			$(ele).parent().children().each(function (i, e) {
				if (e == ele) {
					index = i;
				}
			});
		}
		return index;
	}

	/**
	 * 取匹配集合第一个
	 * 与jquery用法相同
	 * @returns {any}
	 */
	K.first = function(){
		return $(this[0]);
	}

	/**
	 * 取匹配集合最后一个
	 * 与jquery用法相同
	 * @returns {any}
	 */
	K.last = function(){
		var n = this.length > 1  ? this.length -1 : 0	;
		return $(this[n]);
	}

	/**
	 * 检查集合中是否存在选择器范围
	 * 与jquery用法相同
	 * @param selector
	 * @returns {boolean} 返回 false | true
	 */
	K.is = function(selector){
		var s = false;
		this.map(function(ele){

			if(isSelectDom(ele, selector)){
				s = true;
			}
		});
		return s;
	}

	/**
	 * 子孙遍历
	 * 与jquery用法相同
	 * @param selector
	 * @returns
	 */
	K.find = function(selector){
		selector = selector || '*';
		var rdom = $();
		this.map(function(ele){
			$.loop(ele.querySelectorAll(selectorStr(selector)), function(el){
					rdom.push(el);
			});
		});
		return rdom;
	}

	/**
	 * 集合内部遍历并生成新集合
	 * @param selector
	 * @returns {*[]|Uint8Array|BigInt64Array|Float64Array|Int8Array|Float32Array|Int32Array|Uint32Array|Uint8ClampedArray|BigUint64Array|Int16Array|Uint16Array}
	 */
	K.filter = function(selector){
		selector = selector || '*';
		return this.map(function(ele){
			if(isSelectDom(ele, selector)){
				return ele;
			}
		});
	}

	/**
	 * 直接子级遍历
	 * 与jquery用法相同
	 * @param selector
	 */
	K.children = function(selector){
		selector = selector || '*';
		var rdom = $(), ri =0;
		this.map(function(ele){
			$.loop(ele.childNodes, function(el){
				if (isSelectDom(el, selector)) {
					rdom[ri] = el;
					ri ++;
				}
			});
		});
		rdom.length = ri;
		return rdom;
	}

	/**
	 * 遍历所有子级（包括文本节点）
	 */
	K.childAll = function(){
		var rdom = $(), ri =0;
		this.map(function(ele){
			$.loop(ele.childNodes, function(el){
				rdom[ri] = el;
				ri ++;
			});
		});
		rdom.length = ri;
		return rdom;
	}

	/**
	 * 所有同辈
	 * 与jquery用法相同
	 * @param selector
	 * @returns {*}
	 */
	K.siblings = function(selector){
		selector = selector || '*';
		var rdom = $(), ri=0;
		this.map(function(ele){
			//同父级下所有直接子级（不包含自己）
			$.loop(ele.parentNode.childNodes, function(el){
				if (el != ele && isSelectDom(el, selector)) {
					rdom[ri] = el;
					ri ++;
				}
			});
		});
		rdom.length = ri;
		return rdom;
	}

	/**
	 * 父级
	 * 与jquery用法相同
	 * @param selector
	 * @returns {*}
	 */
	K.parent = function(selector){
		selector = selector || '*';
		var rdom = $(), ri=0;
		this.map(function(ele){
			var el = ele.parentNode;
			if (el != ele && isSelectDom(el, selector)) {
				rdom[ri] = el;
				ri ++;
			}
		});
		rdom.length = ri;
		return rdom;
	}

	/**
	 * 祖先(直到匹配选择器)
	 * 与jquery用法相同
	 * @param selector
	 * @returns {*}
	 */
	K.parents = function(selector){
		var rdom = $(), ri=0;
		$.loop(dir(this, 'parentNode', selector), function(el){
			rdom[ri] = el;
			ri ++;
		});
		rdom.length = ri;
		return rdom;
	}

	/**
	 * 前一个元素
	 * 与jquery用法相同
	 * @param selector
	 * @returns {*}
	 */
	K.prev = function(selector){
		selector = selector || '*';
		var rdom = $(), ri=0;
		this.map(function(ele, i){
			if(isSelectDom(ele.previousElementSibling, selector)){
				rdom[ri] = ele.previousElementSibling;
				ri ++;
			}
		});
		rdom.length = ri;
		return rdom;
	}

	/**
	 * 往前所有元素
	 * @param selector
	 * @returns {*}
	 */
	K.prevAll = function(selector, isAll){
		var rdom = $(), ri=0;
		$.loop(dir(this, (isAll ? 'previousSibling' : 'previousElementSibling'), selector), function(el){
			rdom[ri] = el;
			ri ++;
		});
		rdom.length = ri;
		return rdom;
	}

	/**
	 * 下一个元素
	 * 与jquery用法相同
	 * @param selector
	 * @returns {*}
	 */
	K.next = function(selector){
		selector = selector || '*';
		var rdom = $(), ri=0;
		this.map(function(ele){
			if(isSelectDom(ele.nextElementSibling, selector)){
				rdom[ri] = ele.nextElementSibling;
				ri ++;
			}
		});
		rdom.length = ri;
		return rdom;
	}

	/**
	 * 之后所有元素
	 * @param selector
	 * @returns {*}
	 */
	K.nextAll = function(selector, isAll){
		var rdom = $(), ri=0;
		this.map(dir(this, (isAll ? 'nextSibling' : 'nextElementSibling'), selector),function(ele){
			rdom[ri] = ele;
			ri ++;
		}, isAll);
		rdom.length = ri;
		return rdom;
	}



// ====================== 事件处理 ====================== //

	/**
	 * 绑定事件
	 * @param event 事件名称, 每个事件以空格分开，每个事件支持命名空间click.xx
	 * @param selector
	 * @param callback
	 * @returns {$}
	 */
	K.on = function (event, selector, callback) {
		if($.isFunction(selector) && !callback){
			callback = selector;
			selector = null;
		}
		callback = callback ? callback : function(){return false};
		event = event.split(/\s/);
		this.each(function (_, ele) {
			var kid = $.objectID(ele);
			bindEventData[kid] = bindEventData[kid] || {};
			$.loop(event, function (evn) {
				if (evn == 'ready'){
					return $(document).ready(callback);
				}
				var useCapture = false;

				var func = function(e){
						eventAddstopPropagation(e);
						//如果存在子级选择器，则检查当前事件是被哪个元素触发 如在选择器范围内则回调函数
						if(!selector || (selector && $.inArray(e.target, ele.querySelectorAll(selectorStr(selector))))){
							//回调函数并获取返回值，若返回值为false则阻止冒泡
							//this指向为 被选择器选中时为触发元素 否则为绑定事件的元素
							if(callback.apply((selector ? e.target : ele), arguments) === false){
								e.stop();
							}
						}
				};
				bindEventData[kid][evn] = bindEventData[kid][evn] || [];
				bindEventData[kid][evn].push({callback:callback, selector:selector, useCapture:useCapture, addCallback:func});
				/*
				addEventListener
				参数1 = 事件名称
				参数2 = 回调函数
				参数3 = true = 事件句柄在捕获阶段执行 false = 默认。事件句柄在冒泡阶段执行
				 */
				evn = evn.replace(/\..*/,'');
				ele.addEventListener(evn, func, useCapture);

			})
		});
		return this;
	};
	/**
	 * 解除绑定事件
	 * @param event 事件名称 on绑定的事件名称
	 * @param callback
	 * @returns {$}
	 */
	K.off = function(event, callback) {
		var isCall = callback ? 1 : 0;
		callback = callback ? callback : function(){return false};
		event = $.explode(' ', event, '');
		this.map(function (ele) {
			var kid = $.objectID(ele);
			$.loop(event, function (evn) {
				var evnDt = bindEventData[kid] && bindEventData[kid][evn] ? bindEventData[kid][evn] : null;
				evn = evn.replace(/\..*/,'');
				if(evnDt) {
					//如果没有指定 需删除的事件 则遍历删除所有
					var delN = 0;
						$.loop(evnDt, function(val, i){
							if(val && (!isCall || val.callback === callback)){
								ele.removeEventListener(evn, val.addCallback, val.useCapture);
								evnDt[i] = null;
								delN ++;
							}
						});
						if(evnDt.length === delN){
							delete bindEventData[kid][evn];
						}
				}else{
					ele.removeEventListener(evn, callback, false);
					ele.removeEventListener(evn, callback, true);
				}
			})
			$.isset(bindEventData[kid]) && $.isEmpty(bindEventData[kid]) && delete bindEventData[kid];

		});
		return this;
	};
	/**
	 * hover事件
	 * @param a
	 * @param b
	 * @returns {*}
	 */
	K.hover = function(a, b){
		return this.mouseenter(a).mouseleave(b || a);
	}

	/**
	 * 文本框文字选中事件
	 * @param func
	 */
	K.select = function(func){
		if($.isset(func)){
			if(!$.isFunction(func)){
				return;
			}
			this.on('select', function(evn){

				var txt = window.getSelection ? window.getSelection().toString() : document.selection.createRange().text;
				func.call(this, evn, txt);
			});
		}else{
			this.map(function(ele){
				if($.isFunction(ele.select)){
					ele.select();
				}
			});
		}
	}

	/**
	 * 长按事件（移动端）
	 * Author: cr180.com <cr180@cr180.com>
	 */
	K.touchlong = function(fun) {
		var S, x=0, y=0;
		this.on('touchstart touchmove touchend mousedown mouseup mouseout mouseleave', function(e){

			if($.inArray(e.type, ['touchstart','mousedown'])) {
				if (e.type == 'touchstart') {
					x = (e.targetTouches ? e.targetTouches[0].pageX : e.pageX) || 0;
					y = (e.targetTouches ? e.targetTouches[0].pageY : e.pageY) || 0;
				}
				e.stop();
				S = setTimeout(function () {
					fun.call(e.target, e);
				}, 400);
			}else if($.inArray(e.type,['touchmove','mouseleave'])){
				var x1 = (e.changedTouches ? e.changedTouches[0].pageX : e.pageX) || 0;
				var y1 = (e.changedTouches ? e.changedTouches[0].pageY : e.pageY) || 0;
				if(Math.abs(x1 - x) >25 || Math.abs(y1 -y) >25){
					clearTimeout(S);
				}
			}else{
				clearTimeout(S);
			}
		});
		return this;
	}

	/**
	 * 触摸过程回调
	 * @param startFun 触摸开始回调函数
	 * @param moveFun 触摸过程回调函数
	 * @param endFun 触摸结束回调函数
	 * @param path 触摸方向控制 X=仅横向 Y=仅纵向 null=不控制
	 * @returns {*}
	 */
	K.touch = function(startFun, moveFun, endFun, path){
		var X=0, Y=0, action, isRun, moveTime;
		var touchNames = 'ontouchstart' in document.documentElement ? 'touchstart touchmove touchend' : 'mousedown mousemove mouseup';
		var startEvent;
		this.on(touchNames, function(e){
			startEvent = e;
			var ex = 0, ey = 0, cx=0, cy=0;
			//鼠标或手指按下
			if($.inArray(e.type, ['touchstart','mousedown'])) {
				X = ex = (e.targetTouches ? e.targetTouches[0].pageX : e.pageX) || 0;
				Y = ey = (e.targetTouches ? e.targetTouches[0].pageY : e.pageY) || 0;
				startFun && startFun.call('', e, {currentX:ex, currentY:ey, startX:X, startY:Y});
				isRun = true;
				moveTime = e.timeStamp;
			//鼠标或手指在元素上移动
			}else if(isRun && $.inArray(e.type,['touchmove','mousemove'])){
				ex = (e.targetTouches ? e.targetTouches[0].pageX : e.pageX) || 0;
				ey = (e.targetTouches ? e.targetTouches[0].pageY : e.pageY) || 0;


				cx = ex-X;
				cy = ey - Y; //得到xy终点坐标
				//滑动距离必须超过10个像素时才触发
				if(!action && (Math.abs(cx) >8 || Math.abs(cy) >8)) {
					var ages = $.rightTriangleAge(cx, cy);
					//滑动角度判断 15度以内为左右滑动
					if (ages.scale < 15) {
						action = cx > 0 ? 'right' : 'left';
					} else{
						action = cy > 0 ? 'down' : 'up';
					}
				}
				//动作存在 回调
				if (action) {
					moveFun && moveFun.call('', e, {action:action, moveX:cx, moveY:cy, currentX:ex, currentY:ey, startX:X, startY:Y});
				}
				//阻止冒泡
				if(!path || (path==='X' && $.inArray(action,['left','right'])) || path==='Y' && $.inArray(action,['up','down'])){
					return false;
				}

			//鼠标或手指在元素上释放（离开）
			}else if(isRun){
				ex = (e.changedTouches ? e.changedTouches[0].pageX : e.pageX) || 0;
				ey = (e.changedTouches ? e.changedTouches[0].pageY : e.pageY) || 0;
				cx = ex - X;
				cy = ey - Y; //得到xy终点坐标
				var mTime = e.timeStamp - moveTime;//整个触摸过程的时间
				var isX = $.inArray(action,['left','right']),
					isY = $.inArray(action,['up','down']);
				var scaleX = (Math.abs(cx) / $(this).width(true) * 100), //横向移动比例
					scaleY = (Math.abs(cy) / $(this).height(true) * 100); //纵向移动比例
				//如果触摸时间超过800ms 移动比例必须超过50%才算一个动作
				if(mTime >= 800 && ((isX && scaleX <50) || (isY && scaleY <50))){
					action = '';
				}
				if(!path || (path==='X' && isX) || path==='Y' && isY) {
					endFun && endFun.call('', e, {
						action: action,
						moveX: cx,
						moveY: cy,
						currentX: ex,
						currentY: ey,
						startX: X,
						startY: Y,
						scaleX: scaleX,
						scaleY: scaleY
					});
				}


				X=0;
				Y=0;
				action = null;
				isRun = null;

			}
		});
		return this;
	}

	/**
	 * 创建一个自定义事件
	 * @param name
	 * @constructor
	 */
	$.Event = function(name){
		var events
		try{
			events = new Event(name, {bubbles:true, cancelable:true});
		}catch (e) {
			events = document.createEvent('Events');
			events.initEvent(name, true, true);
		}
		eventAddstopPropagation(events);
		return events;
	}

	/**
	 * 给指定元素绑定一个自定义事件
	 * @param name 事件名称
	 * @param func 回调函数
	 * @param useCapture  addEventListener第三个参数
	 * @param isRun 是否立即执行
	 * @param runDel 立即执行后是否删除
	 */
	K.addEvent = function(name, func, useCapture, isRun, runDel){
		this.map(function(ele){
			var eEvn = $.Event(name);
			ele.addEventListener(name, func, useCapture);
			if(isRun) {
				ele.dispatchEvent(eEvn);
			}
			if(runDel){
				$(ele).removeEvent(name, func, useCapture);
			}
		});
		return this;
	}

	/**
	 * 移除一个事件
	 * @param ele 绑定时对应的元素
	 * @param name 绑定时使用的事件名称
	 * @param func 绑定时的触发函数
	 * @param useCapture addEventListener第三个参数
	 */
	K.removeEvent = function(name, func, useCapture){
		this.map(function(ele) {
			ele.removeEventListener(name, func, useCapture);
		});
	}

	/**
	 * 触发事件
	 * @param evn
	 */
	K.trigger = function(event, args){
		this.map(function(ele){
			if ($.isFunction(ele[event.type])){
				ele[event.type]();
			}else{
				var e = $.Event(event);
				e.KSAcallbackArgs = args;
				ele.dispatchEvent(e);
			}
		});
		return this;
	}

	/**
	 * 表单submit事件
	 */
	K.submit = function(callFun){
		if(callFun){
			return this.on('submit', callFun);
		}else{
			return this.trigger('submit');
		}
	}

	/**
	 * 根据两个直角边长推测三角度数
	 * 必须是直角
	 * @param a A边长
	 * @param b B边长
	 * return {object}
	 */
	$.rightTriangleAge = function(a, b){
		//已知四个坐标组成直角四边形 根据勾股定理推测出直角三角形后得到每个角的角度
		a = Math.abs(a); //取绝对值
		b = Math.abs(b); // 取绝对值
		var c = Math.sqrt(a*a+b*b); //求c边长
		//余弦定理 求bc的弧度
		var bc = Math.acos((a*a + c*c - b*b)/(2.0*a*c));
		//bc弧度转角度 得到结束坐标端三角度数
		bc = parseInt((bc / Math.PI * 180) * 10000) / 10000;
		//ac角度 = 90 - bc角度
		var ac = 90 - bc;
		return {scale:bc, a:a, b:b, c:c, age:{ab:90, ac:ac, bc:bc}};
	}
// ====================== 当前或指定url格式化为对象 ====================== //
	$.url = function(url, param){
		var u = [];
		if(url){
			u = url.match(/^((\w+:)?\/\/)?(.+\.\w+)?(:\d+)?([^\?#]+)([^#]*)(#.*)?$/i);
		}
		var P = {
			url : url ? url : location.href,
			origin : url ? (u[1] || '') : location.origin,
			https : url ? (u[2] && u[2] ==='https' ? true : false) : location.protocol,
			host : url ? (u[3] || '') : location.hostname,
			port : url ? (u[4] ? u[4].substr(1) : '') : location.port,
			pathname : url ? (u[5] || '') : location.pathname,
			search : url ? (u[6] || '') : location.search,
			paths : [],
			get : {},
			hash : url ? (u[7] ? u[7] : '') : location.hash
		};
		P.get = $.urlGetObject(P.search);
		var isParam = false;
		if(param && !$.isEmpty(param)) {
			param = $.isString(param) ? $.urlGetObject(param) : param;
			isParam = true;
		}
		if(isParam){
			P.get = $.arrayMerge(P.get, param);
			P.search = !$.isEmpty(P.get) ? ('?'+$.urlGetString(P.get)) : '';
		}

		if(P.pathname) {
			var pn = P.pathname;
			//去掉前后/
			$.loop(pn.split("/"),function(val, k){
				if(val !== '') {
					P.paths.push(val);
				}
			});
		}

		if(isParam) {
			P.url = P.origin + P.host + (P.port ? (':' + P.port) : '') + P.pathname + P.search + P.hash;
		}
		return P;
	}

	/**
	 * 在url中添加一个参数
	 * @param url 需要添加的url
	 * @param query 参数：xxx=value
	 * @returns {string}
	 */
	$.urlAdd = function(url, query){
		return $.url(url, query).url;
	}

	/**
	 * URL GET条件转对象
	 * @param url
	 * @returns {{}}
	 */
	$.urlGetObject = function(url){
		var param = {};
		if($.isString(url)){
			if(url.substr(0,1) == '?'){
				url = url.substr(1);
			}
			$.loop(url.split("&"),function(val){
				val = val.split('=');
				if(val['1']){
					val['1'] = decodeURIComponent(val['1']);
					param[val['0']] = val['1'];
				}
			});
		}
		return param;
	}

	/**
	 * 对象转为url GET条件
	 * @param url
	 * @param isEncode 是否需要urlencode
	 * @returns {string}
	 */
	$.urlGetString = function(url, isEncode){
		var str = '';
		if($.isObject(url)){
			var u = [];
			$.loop(url, function(value, key){
				if(value === undefined){
					value = '';
				}
				if(isEncode){
					value = encodeURIComponent(value);
				}
				key && value && u.push(key + "=" + value);
			});
			str = $.implode('&',u);
		}
		return str;
	}

// ====================== AJAX ====================== //
	var jsonpID = 1;
	/**
		 * ajax方法与jQuery基本一致
	 * 注：data值不再做任何二次处理，直接放入FormData提交，所以POST时支持文件与参数同时传递，无需其他设置
	 * @param option
	 */
	$.ajax = function(option){
		var getType = option.type ? option.type.toUpperCase() : 'GET',
			headers = option.header || {},
			dataType = option.dataType ? option.dataType.toLowerCase() : 'html',
			jsonpCallback = option.jsonpCallback || '',
			jsonp = option.jsonp,
			responseData;
		option.data = option.data ? option.data : {};
		option.data.KAJAX = true;
		//JSONP直接创建script插入到dom后回调
		if(dataType =='jsonp'){
			//复制回调函数名
			var copyCallback = $.isFunction(jsonpCallback) ? ('jsonpCallback' + (jsonpID++)) : jsonpCallback;

			window[copyCallback] = function () {
				responseData = arguments;
			}
			option.data.jsonpCallback = copyCallback;
			var script = document.createElement('script');
			script.src = $.urlAdd(option.url, option.data);
			script.type = 'text/javascript';
			$(script).on('load', function(e){
				var result = responseData[0];
				$(this).remove();

				if(jsonpCallback == copyCallback) {
					window[jsonpCallback] = window[jsonpCallback];
				}
				if (responseData && $.isFunction(jsonpCallback)){
					jsonpCallback.call(this, result);
				}

				if(e.type =='error'){
					$.isFunction(option.error) && option.error.call(this, result);
				}else{
					$.isFunction(option.success) && option.success.call(this, result);
				}
				option.complete && option.complete.call(this, result); //请求完成执行回调
			});
			document.head.appendChild(script);
			copyCallback = responseData = null;

			//其他ajax请求采用XMLHttp
		}else{

			if(getType =='POST'){
				if(!(option.data instanceof FormData)) {
					var _data = new FormData();
					$.loop(option.data, function(val, k){
						_data.append(k, val);
					});
					option.data = _data;
					_data = '';
				}
			}else if(getType =='GET'){
				option.url = $.urlAdd(option.url, option.data);
			}

			var A = new XMLHttpRequest();

			A.open(getType, option.url,true);

			$.loop(headers, function(val, k){
				A.setRequestHeader(k,val);
			});

			!$.isEmpty(option.data) && A.send(option.data);

			A.onreadystatechange = function(){
				if(A.readyState === 4) {
					var result = A.responseText;
					if (A.status === 200) {
						if (dataType === 'script') {
							(1, eval)(result);
						} else if (dataType === 'xml') {
							result = A.responseXML;
						} else if (dataType === 'json') {
							result = /^\s*$/.test(result) ? null : JSON.parse(result);
						}
						$.isFunction(option.success) && option.success.call(this, result);
					} else {
						$.isFunction(option.error) && option.error.call(this, result, A.status);
					}
					option.complete && option.complete.call(this, result, A.status); //请求完成执行回调
				}
			}
			//超时处理
			var EvnTimeout;
			if (option.timeout > 0) EvnTimeout = setTimeout(function(){
				A.onreadystatechange = function(){}
				A.abort()
				$.isFunction(option.error) && option.error.call(this, result, A.status);
				option.complete && option.complete.call(this, result, A.status); //请求完成执行回调
			}, option.timeout)
		}
	}
// ====================== 元素监听 ====================== //

	/**
	 * 变量监听函数
	 * 所有监听回调必须在新值改变以前
	 */
	$.def = {
		debug : 0,
		Event : {}, //监听链
		/**
		 * 创建一个监听链
		 * @returns {{add: {}, isPush: boolean, set: {}, get: {}, run: run, delete: {}}}
		 */
		newQueue : function(){
			return {
				isPush : false,
				//set : {}, //写值监听列表
				//get : {}, //读取监听列表
				//delete : {}, //删除监听列表
				//add : {}, //新增监听列表
				//reset : {}, //重置监听列表
				//monitor : {}, //当前对象下待监听的键名列表
				run : function (ac, newObj, keyName, newV) {
					var ths = this;
					if (ths[ac]) {
						$.loop(ths[ac], function (f) {
							f(newV, keyName, newObj);//添加数据回调键名与数据 第一个回调参数必须是新值
						});
						//删除操作 重置监听列表 只保留重置reset
						if(ac ==='delete'){
							delete ths.set;
							delete ths.get;
							delete ths.add;
							delete ths.delete;
							delete ths.monitor;
						//重置事件回调后删除回调队列
						}else if(ac ==='reset'){
							delete ths.reset;
						}

						if ($.def.debug) {
							debug('def['+ac+'] / objID:' +$.objectID(newObj)+' / '+keyName+' / 值:'+JSON.stringify(newV));
						}
					}
				}
			};
		},
		/**
		 * 创建监听事件
		 * @param ac 需要监听的动作 set=值改变 get=值读取 add=值添加 delete=值删除
		 * @param obj 需要监听的对象
		 * @param keyName 需要监听的键名 多个以空格分开
		 * @param Fun 事件触发时的回调函数 参数1=最新的值
		 */
		createEvent : function(action, obj, keyName, Fun){
			var ths = this;
			//只传入三个值时 第三个参数为函数
			if(!Fun && $.isFunction(keyName)){
				Fun = keyName;
				keyName = undefined;
			}
			//obj必须是对象、数组 回调函数必须存在
			if(!$.isObject(obj)  || !$.isFunction(Fun)){
				return;
			}
			var FunID = $.objectID(Fun);
			var objID = $.objectID(obj);
			//如果没有监听事件则创建一个新的
			if(!ths.Event[objID]){
				ths.Event[objID] = ths.newQueue();
			}
			var evnObj = ths.Event[objID];

			$.loop($.explode(' ', action, ''), function(ac){
				if($.isset(keyName)){
					$.loop($.explode(' ', keyName,''),  function(val){
						evnObj.monitor = evnObj.monitor || {};
						if(!evnObj.monitor[val]){
							evnObj.monitor[val] = ths.newQueue();
						}
						evnObj.monitor[val][ac] = evnObj.monitor[val][ac] || {};
						evnObj.monitor[val][ac][FunID] = evnObj.monitor[val][ac][FunID] || Fun;
						ths.monitor(obj, val);//刷新监听队列

					});
				}else{
					evnObj[ac] = evnObj[ac] || {};
					evnObj[ac][FunID] = evnObj[ac][FunID] || Fun;
				}
			});
		},
		/**
		 * 刷新或创建监听队列
		 * @param obj
		 * @param keyName
		 */
		monitor : function(obj, keyName){
			if(!$.isObject(obj) || !$.isset(keyName)){
				return;
			}
			var ths = this;
			var objID = $.objectID(obj);

			var eventDt = ths.Event[objID] && ths.Event[objID].monitor[keyName] ? ths.Event[objID].monitor[keyName] : null;

			//如果变量已经在监听队列 则不重复监听
			if(!eventDt || eventDt.isPush){
				return;
			}

			try {
				var setTer = Object.getOwnPropertyDescriptor(obj, keyName);
				setTer = setTer ? setTer.set : null;
				var defSet = function(v){
					setTer && setTer(v);
				};

				var _Svalue = obj[keyName];
				Object.defineProperty(obj, keyName, {
					enumerable: true,
					configurable: true,
					set : function(v){

						if(v === _Svalue){//值相同时不回调函数
							return;
						}
						var oldValue = _Svalue;
						_Svalue = v;

						defSet(v); //默认事件回调
						eventDt && eventDt.run('set', obj, keyName, v, oldValue);

					},
					get : function(v){
						return _Svalue;
					}
				});

				eventDt.isPush = true; //打上监听成功标记
			}catch (e) {

			}
		},
		add : function(obj, keyName, dt){
			var ths = this,
				objID = $.objectID(obj), //当前对象ID
				events = ths.Event[objID]; //当前对象监听事件
			//触发对象add事件 父级关联的
			events && events.run('add', obj, keyName, dt);
			//给对象赋值
			obj[keyName] = dt;
		},

		/**
		 * 值被删除后的重写
		 * @param obj
		 * @param keyName
		 * @param dt
		 */
		reset : function(obj, keyName, dt){
			if(!$.isObject(obj)){
				return;
			}
			var ths = this;

			if($.isObject(dt)) {
				//当前对象ID
				var objID = $.objectID(obj);

				var originalID = $.objectID(obj[keyName]) || (ths.deleteObjectIdList[objID] ? ths.deleteObjectIdList[objID][keyName] : null);
				//同步对象ID
				originalID && $.objectID(dt, originalID);

				//触发对象reset事件 父级关联的
				var events = ths.Event[objID]; //当前对象监听事件
				if (events) {
					//从父级触发当前对象reset
					events.monitor[keyName] && events.monitor[keyName].run('reset', obj, keyName, dt);
				}
				//触发对象reset事件
				originalID && ths.Event[originalID] && ths.Event[originalID].run('reset', obj, keyName, dt);

			}
			ths.add(obj, keyName, dt);
		},
		update : function(obj, keyName, dt){
			if(!$.isObject(obj)){
				return;
			}
			var ths = this;
			if($.isObject(dt)){
				$.loop(dt, function(val, key){
					ths.update(obj[keyName], key, val);
				});
			}else if(obj[keyName] !== dt){
				obj[keyName] = dt;
			}
		},
		/**
		 * 新增或改变对象的值
		 * @param obj
		 * @param keyName
		 * @param dt
		 */
		set : function(obj, keyName, dt){
			if(!$.isObject(obj)){
				return;
			}
			var ths = this,
				objID = $.objectID(obj), //当前对象ID
				setObj = obj[keyName]; //待更新对象

			var delObj = this.deleteObjectIdList[objID];


			//值新增 空值、已删除、类型不同
			if($.isEmpty(setObj) || (delObj && delObj[keyName]) || ($.isObject(setObj) && $.isObject(dt) && setObj.__proto__.constructor !== dt.__proto__.constructor)){
				ths.reset(obj, keyName, dt);

				delObj && delObj[keyName] && delete delObj[keyName];

			//被直接重新赋值 待更新对象之前是一个对象
			}else if($.isObject(setObj)){
				//如果新值也是一个对象 则对比判断增删改
				if($.isObject(dt)){
					//遍历旧数据 不存在的直接删除
					$.loop(setObj, function(oldV, k){
						//如果新数据不存在 则删除
						if(!dt[k]){
							$.def.delete(setObj, k);
						}
					});

					//遍历新数据，判断增删改
					$.loop(dt, function(newV, k){
						//旧数据存在 则更新
						if($.isset(setObj[k])){
							$.def.update(setObj, k, newV);
						//不存在 则添加
						}else{
							$.def.add(setObj, k, newV);
						}
					});

				}else if(obj[keyName] !== dt){
					obj[keyName] = dt;
				}
			//原来的值不存在 添加
			}else if(!$.isset(setObj)){
				$.def.add(obj, keyName, dt);
			}else if(obj[keyName] !== dt){
				obj[keyName] = dt;
			}

			return obj;
		},
		//已删除对象ID列表 被删除的对象ID会保存在这里
		deleteObjectIdList : {},
		/**
		 * 删除对象某个键名
		 * @param obj 需要删除的对象
		 * @param keyName 需要删除的键名 多个以空格分开
		 */
		delete : function(obj, keyName){
			if(!$.isObject(obj) || !$.isset(keyName)){
				return;
			}
			var ths = this;
			var objID = $.objectID(obj);
			var objEvent = ths.Event[objID];

			$.loop($.explode(' ', keyName, ''), function(key){
				var delObj = obj[key];
				var delID = $.objectID(delObj);
				if(!delID){
					return;
				}
				//如果被删除的是一个对象 则保存它的ID 以便重新给它赋值时使用
				if($.isObject(delObj)){
					ths.deleteObjectIdList[objID] = ths.deleteObjectIdList[objID] || {};
					ths.deleteObjectIdList[objID][keyName] = delID;
				}

				var thsE = ths.Event[delID];
				if(thsE){
					thsE.run('delete', obj, key);
				}
				var eventDt = objEvent && objEvent.monitor[key] ? objEvent.monitor[key] : null;
				if(eventDt){
					eventDt.run('delete', obj, key);
				}
				//删除对象所有的监听事件
				ths.clearGobalEvent(obj,key);
				delete obj[key];
			});
			return obj;
		},
		/**
		 * 删除对象下所有子对象的事件
		 * @param obj
		 */
		clearGobalEvent : function(obj, keyName){
			var ths = this;
			var delObj = obj[keyName];
			if(!$.isObject(delObj)){
				return;
			}
			$.loop(delObj, function (v, k) {
				if($.isObject(v)){
					var vid = $.objectID(v);
					ths.Event[vid] && delete ths.Event[vid];
					ths.clearGobalEvent(delObj, k);
				}
			});
		}
	}
	/**
	 * 获取调用此函数的参数名与参数值
	 * @param Args
	 */
	$.getIncludeFunc = function(Args){
		var argsNames = Args.callee.toString().match(/^function(\s[^(]+)?\(([^\)]+)?\)\{/);
		if(argsNames && argsNames[2]) {
			var dt = {};
			argsNames = $.explode(',', argsNames[2], '');
			$.loop(argsNames, function (v, k) {
				v = v.trim();
				dt[v] = Args[k];
			});
			return dt;
		}
	}

	/***
	 * setTimeout防重复
	 * @param skey 唯一标示，作为防重复依据
	 * @param func 回调函数
	 * @param time 时间
	 */
	$.setTimeout = function(skey, func, time){
		if(!this.setTimeoutMap){
			this.setTimeoutMap = {};
		}
		if(this.setTimeoutMap[skey]){
			window.clearTimeout(this.setTimeoutMap[skey]);
			delete this.setTimeoutMap[skey];
		}
		this.setTimeoutMap[skey] = window.setTimeout(func, time);
	}

	var autoIDMap = {};
	/**
	 * 根据key获得一个自增ID
	 * @param key
	 * @returns {number}
	 */
	$.autoID = function(key){
		if(!autoIDMap[key]){
			autoIDMap[key] = 0;
		}
		return autoIDMap[key] ++;
	};

	/**
	 * 对象的唯一ID累加变量
	 */
	var _KSAobjectIDIndex = 1;

	/**
	 * 获取一个对象的唯一ID
	 * 支持 对象、数组、函数
	 * @param obj
	 * @returns {number}
	 */
	$.objectID = function (obj, newValue) {
		var keyName = '_uniqueID_';
		var isValue = $.isset(newValue);
		var isdel = newValue === '';
		if(obj instanceof HTMLElement){
			if(isdel){
				$.isset(obj[keyName]) && delete obj[keyName];
			}else if(isValue){
				obj[keyName] = newValue;
			}else{
				if(!obj[keyName]) {
					obj[keyName] = _KSAobjectIDIndex++;
				}
			}
			return obj[keyName];
		}else if($.isWindow(obj)){
			return 0;
		}else if($.isObject(obj)){
			if(isdel){
				$.isset(obj[keyName]) && delete obj[keyName];
			}else if(isValue){
				Object.defineProperty(obj, keyName, {
					value: newValue,
					enumerable: false,
					writable: true
				});
				return newValue;
			}else{
				if(!$.isset(obj[keyName])){
					Object.defineProperty(obj, '_uniqueIDFunc_', {
						value: function() {
							if (!$.isset(this[keyName])) {
								Object.defineProperty(this, keyName, {
									value: _KSAobjectIDIndex ++,
									enumerable: false,
									writable: true
								});
							}
							return this[keyName];
						},
						enumerable: false,
						writable: false
					});
					obj._uniqueIDFunc_();
				}
				return obj[keyName];
			}
		}else if($.isFunction(obj)){
			if(isdel){
				$.isset(obj.prototype[keyName]) && delete obj.prototype[keyName];
			}else if(isValue){
				obj.prototype[keyName] = newValue;
			}else{
				if(!obj.prototype[keyName]) {
					obj.prototype[keyName] = _KSAobjectIDIndex++;
				}
				return obj.prototype[keyName];
			}

		}
	}
// ====================== TPL模板语法 ====================== //
	$.tpl = function(Config){
		if(!Config.tpl && Config.el){
			Config.tpl = $(Config.el).html();
		}
		//匹配模板变量正则 {xxx}
		var variableReg = /\{\{((?:.|\r?\n)+?)\}\}/g;
		var extractReg = [
			/\s+([\.\(\)\[\]\:\?])[\s+]?/g,
			/\.(charAt|charCodeAt|concat|fromCharCode|indexOf|includes|lastIndexOf|match|repeat|replace|search|slice|split|startsWith|substr|substring|toLowerCase|toUpperCase|trim|toLocaleLowerCase|toLocaleUpperCase|valueOf|toString|anchor|big|blink|bold|fixed|fontcolor|fontsize|italics|link|small|strike|sub|sup)(\(.*?\))/g,
			/[\(\)\+\-\*\/\=\%\?\|\&\>\<\:\!\~\s]/
		]

		//将换行符替换为实体
		function torn(str){
			if(str){
				str = str.replace(/(\r\n|\r|\n)/g, function (_1) {
					return _1 === "\r\n" ? '\\r\\n' : (_1 === "\r" ? '\\r' : '\\n');
				});
			}
			return str;
		}
		//将字符串用双引号包裹
		function strToQuotes(str) {
			return '"'+str+'"';
		}

		/**
		 * 对象变量名分割为主变量名 索引名
		 * 例：
		 * data.user[1] = [data.user, 1]
		 * data.user = [data, user]
		 * @param kname 需要处理的变量名
		 * @returns {[string, string]}
		 */
		var keyNameMap = {};
		/**
		 *
		 * @param kname
		 * @param isOne 数组第一个只返回第一个变量名
		 * @returns {*}
		 */
		function keyName(kname, isOne){
			var kmapI = kname+'{'+isOne+'}';
			if(!keyNameMap[kmapI]) {
				var keys = '', p = kname;
				var dn = !isOne ? kname.lastIndexOf('.') : kname.indexOf('.'), qn =0;
				if(dn === -1){
					qn = !isOne ? kname.lastIndexOf('[') : kname.indexOf('[');
				}
				var vlast = Math.max(qn, dn);
				if(vlast >0){
					p = kname.substr(0,vlast);
					keys = kname.substr(dn>0 ? vlast+1 : vlast);
				}
				keyNameMap[kmapI] = [p, keys, kname];
			}
			return keyNameMap[kmapI];
		}

		var ksaTpl = {
			EL : $(Config.el)[0],
			isMonitor : $.isset(Config.isMonitor) ? Config.isMonitor : true,
			data : Config.data || {},
			methods : Config.methods || {},
			Template : Config.tpl,
			debug : Config.debug,
			Html : '', //解析完成的HTML
			cache : {},
			ECODE : [],
			init : function(){
				var ths = this;
				ths.markMethods(ths.methods);
				if(ths.Template) {
					ths.ECODE = ths.vdom(ths.formatHTML());
					var newDom = ths.parseVDOMcode(ths.ECODE);
					ths.Html = $(newDom).html();
					if (newDom) {
						delete ths.ECODE;
						if (ths.EL) {
							if (ths.EL.tagName === 'SCRIPT') {
								$(ths.EL).after(newDom).remove();
							} else {
								$(ths.EL).html(newDom);
							}
						}
					}
				}

				return {
					el : ths.EL,
					cache : ths.cache,
					tpl : ths.Template,
					data : ths.data,
					methods : ths.methods,
					dom : newDom,
					html : ths.Html,
					isMonitor : ths.isMonitor,
					set : function(){
						$.def.set.apply($.def,arguments)
					},
					delete : function(){
						$.def.delete.apply($.def, arguments)
					}
				};
			},
			formatHTML : function () {
				var code = this.Template;
				//规整语法 去掉{{}}里面的空白字符
				code = code.replace(/\{\{(.*?)\}\}/g, function(){
					return '{{'+arguments[1].trim()+'}}';
				});

				var zIndex = 0; //标记累加记号
				var indexMap = {
					loop : [],
					if : []
				};
				code = code.replace(/\{\{(((if|loop)(\s+.*?))|(\/(if|loop)))\}\}/g, function(){
					var arg = arguments;
					if(arg[1].substr(0,1) === '/'){
						return '<!--'+arg[1]+'-'+indexMap[arg[6]].pop()+'-->';
					}else{
						zIndex ++;
						if(!indexMap[arg[3]]){
							indexMap[arg[3]] = [];
						}
						indexMap[arg[3]].push(zIndex);
						return '<!--'+arg[3]+'-'+zIndex+''+arg[4]+'-->';
					}
				});
				code = code.replace(/\{\{(else|elseif\s.*?)\}\}/g, function(){
					return '<!--'+arguments[1]+'-->';
				});
				code = code.replace(/\{\{eval\s+(.*?)\}\}/g, function(){
					return '<!--eval '+arguments[1]+'-->';
				});
				code = code.replace(/\{\{eval\}\}([\s\S]*?)\{\{\/eval\}\}/g, function(){
					return '<!--eval '+arguments[1].trim()+'-->';
				});
				var dom = $.dom(code);
				if(!$.isArray(dom)){
					dom = [dom];
				}
				return dom;
			},
			setAttrs : function(ele, key, value){
				if(!ele){
					return;
				}
				if(!ele._KSA){
					ele._KSA = {};
				}
				if(!$.isset(key)){
					return;
				}
				if(!$.isset(value) && $.isset(ele._KSA[key])){
					delete ele._KSA[key];
				}else{
					ele._KSA[key] = value;
				}
			},
			getAttrs : function(ele, key){
				if(!ele._KSA){
					ele._KSA = {};
				}
				return $.isset(key) && $.isset(ele._KSA[key]) ? ele._KSA[key] : null;
			},
			/**
			 * 获取节点loop属性值
			 * @param ele
			 * @returns {[list, key, value]} undefined=非loop节点
			 */
			vdom_loop : function(ele){
				if(ele.nodeType === 8 && ele.textContent.indexOf('loop-') ===0){
					ele.isKsaNode = 1;
					var farr = $.explode(' ', ele.textContent, '');
					farr[2] = farr[2] || '__value';
					var loopExp = [farr[0], farr[1], farr[3] ? farr[2] : '__', farr[3] ? farr[3] : farr[2]];
					var rcode = '_$$_.LOOP(' + loopExp[1] + ', function(' + loopExp[2] + ', ' + loopExp[3] + '){ return ';
					var scop = [], scopEnd = 0;
					$(ele).nextAll('', true).each(function (i, e) {
						if (!scopEnd) {
							if (e.nodeType === 8 && e.textContent.indexOf('/' + loopExp[0]) === 0) {
								scopEnd = 1;
							} else {
								scop.push(e);
							}
						}
					});
					rcode += this.vdom(scop);
					rcode += '})';
					return rcode;
				}
				return '';
			},
			vdom_if : function(ele){
				var ths = this;
				if(ele.nodeType === 8 && ele.textContent.indexOf('if-') ===0){
					ele.isKsaNode = 1;
					var scop = {}, scopEnd = 0;
					var ifName = ele.textContent.substr(0, ele.textContent.indexOf(' '));
					var scopIndex = 0;
					var factor = ele.textContent.substr(ifName.length);
					var nodeName = 'if';
					$(ele).nextAll('', true).each(function (i, e) {
						var nodeVal = e.textContent;
						var nodeType = e.nodeType;
						if (!scopEnd) {
							if (nodeType === 8 && nodeVal.indexOf('/' + ifName) === 0) {
								scopEnd = 1;
							} else {
								if(nodeType === 8 && (nodeVal.indexOf('elseif ') ===0 || nodeVal === 'else')){
									scopIndex ++;
									if(nodeVal === 'else'){
										factor = '';
										nodeName = 'else';
									}else{
										factor = nodeVal.substr(7);
										nodeName = 'elseif';
									}
									e.isKsaNode = 1;
								}
								if(!scop[scopIndex]){
									scop[scopIndex] = {name:nodeName, dom:[], factor: factor};
								}
								scop[scopIndex].dom.push(e);
							}
						}
					});

					var rcode = [];
					$.loop(scop, function(value){
						var exp = ths.parseText('{{'+value.factor+'}}');
						var factor = [];
						$.loop(exp[1], function(v, k){
							if($.isObject(v)){
								factor.push('['+k+', ["'+Object.keys(v).join('","')+'"]]');
							}else{
								factor.push('[null, "'+k+'"]');
							}
						});
						if(factor.length){
							factor = '['+factor.join(',')+']';
						}else{
							factor = '""';
						}
						var code = '';
						if(value.name ==='else'){
							code = '["else","", function(){return';
						}else{
							code = '[function(){ return '+value.factor+'}, '+factor+', function(){return ';
						}
						code += ths.vdom(value.dom);
						code += '}]';
						rcode.push(code);
					});
					if(rcode.length){
						return '_$$_.IF('+rcode.join(', ')+')';
					}
					return '';
				}
			},
			vdomAttr : function(ele){
				var ths = this;
				var attrs;
				//遍历属性名
				if (ele.nodeType === 1 && ele.attributes && ele.attributes.length) {
					attrs = [];
					var attrsIsP = [];
					$.loop(ele.attributes, function (v) {
						var value = v.value, key = v.name;
						if(key.substr(0,1) ==='@'){
							return;
						}
						var ep = ths.parseText(value);
						value = ep[0];
						if($.isObject(ep[1])){
							$.loop(ep[1], function(kv, kn){
								//组合需要监听的键名、执行函数、监听的变量(多个逗号隔开)
								if($.isObject(kv)){
									attrsIsP.push("['"+key+"', "+kn+", '" + Object.keys(kv).join(',')+"']");
								}else{
									attrsIsP.push("['"+key+"', null, '"+kn+"']");
								}
							});
						}
						if(key ==='v-model' || key ==='v-modeltext') {
							var upbj = keyName(v.value);
							if (upbj[0]) {
								if (!upbj[1]) {
									upbj[1] = upbj[0];
									upbj[0] = '_$data_';
								}
								attrs.push('"v-model":[(typeof(' + upbj[0] + '.' + (upbj[1]) + ') !=="undefined" ? ' + upbj[0] + ' : ""), "' + upbj[1] + '", ' + (key === 'v-modeltext') + ']');
							}
						//动态绑定attr
						}else if(key.substr(0,1) ===':'){
							attrs.push('"'+key+'":function(){ return '+(value || '""')+'}');
						}else{
							attrs.push('"'+key+'":'+(value || '""')+'');
						}
					});
					if(attrs.length>0){
						attrs = '{'+attrs.join(',')+'}';
						//如果attr有待监控变量时 以数组方式传递
						if(attrsIsP.length){
							attrs = '[function(){return '+attrs+'}, ['+attrsIsP.join(',')+']]';
						}
					}else{
						attrs = '';
					}
				}
				return attrs;
			},
			vdomEval : function(ele){
				if(ele.nodeType === 8 && ele.textContent.indexOf('eval') === 0){
					return ele.textContent.substr(4);
				}
			},
			vdom : function(eleList, isScore){
				var ths = this;
				var Enode = [];
				$.loop(eleList, function(ele){
					var nodeType = ele.nodeType;
					if(ele._vdomBreak || (nodeType === 8 && (ele.textContent.indexOf('/if') ===0 || ele.textContent.indexOf('/loop') ===0))){
						return;
					}
					ele._vdomBreak = true;
					var tag = ele.tagName ? ele.tagName : ''; //标签名小写 文本节点为空

					var rcode = '', monitor = '';
					var EvalCode = ths.vdomEval(ele);
					if(EvalCode){
						rcode += '_$$_.F(function(){'+EvalCode+" \n\nreturn _$$_.D(";
						rcode += ths.vdom($(ele).nextAll('', true) );
						rcode += ');})';
						nodeType = 1;
					}else {
						var attrs = ths.vdomAttr(ele);
						if ($.inArray(nodeType, [3, 8])) {
							if(nodeType === 8){
								var tmprcode = ths.vdom_loop(ele);
								if(!tmprcode){
									tmprcode = ths.vdom_if(ele);
								}
								if(tmprcode){
									rcode += tmprcode;
									tmprcode = null;
									nodeType = 1;
								}
							}
							if(!ele.isKsaNode){
								var exp = ths.parseText(ele.textContent, ele);
								if (exp && exp[0]) {
									rcode += exp[0];
									if (exp[1]) {
										//添加监听
										$.loop(exp[1], function (skv, vname) {
											if ($.isObject(skv)) {
												monitor += "_$$_.M(arguments[0], " + vname + ", '" + Object.keys(skv).join(' ') + "');\n";
											} else if (typeof (ths.data[vname]) !== "undefined") {
												monitor += "_$$_.M(arguments[0], _$data_, '" + vname + "');\n";
											} else if (typeof (window[vname]) !== "undefined") {
												monitor += "_$$_.M(arguments[0], window, '" + vname + "');\n";
											}
										});
									}
								}
								exp = null;
							}
						}

						//遍历子节点
						if (ele.childNodes && ele.childNodes.length) {
							rcode += ths.vdom(ele.childNodes);
						}
					}
					monitor = monitor ? ('function(){' + monitor) + '}' : '""';

					var events = [];
					$.loop(ele.attributes, function(val){
						if(val.name.substr(0,1) === '@'){
							if(!events){
								events = {};
							}
							events.push('"'+(val.name.substr(1))+'": function(){return '+val.value+'}');
						}
					});
					events = events.length ? '{'+events.join(',')+'}' : '""';
					rcode = '_$$_.F(function(){return _$$_.C((arguments[0]||"' + tag + '"), ' + nodeType + ', ' + (attrs || '""') + ', ' + (rcode || '""') + ')}, ' + monitor + ', '+events+')';
					Enode.push(rcode);

				});
				var length = Enode.length;
				if(length === 1){
					Enode = Enode[0];
				}else if(isScore){
					Enode = Enode.join('');
				}else if(!isScore && length >1){
					Enode = '['+Enode.join(', ')+']';
				}else{
					Enode = '';
				}
				return Enode;
			},
			/**
			 * 双向绑定
			 */
			vUpdateModel : function(){
				var ele = $(arguments[0]),
					tag = ele[0].tagName,
					type = ele.attr('type'),
					obj = arguments[1][0],
					key = arguments[1][1],
					isText = !!arguments[1][2];
				type = type && type.indexOf('ks-') === 0 ? type.substr(3) : type;
				if($.isObject(obj)){
					var ths = this;
					var objID = $.objectID(obj);
					ths.cache.vUpdateModelinput = ths.cache.vUpdateModelinput || {};
					var cache = ths.cache.vUpdateModelinput;
					cache[objID] = cache[objID] || {};
					if(!cache[objID][key]){
						cache[objID][key] = {
							ele : {}, //监听的表单列表
							isPush : false, //是否已经监听
							//监听回调函数
							func : function(value , k){
								$.loop(ths.cache.vUpdateModelinput[objID][k].ele, function(e, tp){
									$(e).val(value);
								});
							}
						};
					}
					cache[objID][key].ele[type] = cache[objID][key].ele[type] || [];
					cache[objID][key].ele[type].push(ele[0]);

					if(tag ==='INPUT' && $.inArray(type,['checkbox','radio'])){
						ele.change(function(){
							var v = [];
							$(cache[objID][key].ele[type]).map(function(e){
								if(e.checked){
									v.push(isText && e.parentElement.nodeName ==='LABEL' ? e.parentElement.textContent : $(e).attr('value'));
								}
							});
							obj[key] = v;
						});
					}else if(tag ==='INPUT' || tag ==='TEXTAREA'){
						ele.on('inpu KSADOMchange', function(){
							obj[key] = ele.val();
						});
					}else if(tag ==='SELECT'){
						ele.change(function(){
							obj[key] = isText ? ele.find('option:selected').text() : ele.val();
						});
					}
					ele.val(obj[key]);
					//监听值改变 同时改变表单
					if(!cache[objID][key].isPush){
						$.def.createEvent('set', obj, key, cache[objID][key].func);
						cache[objID][key].isPush = true;
					}
				}
			},
			//给沙箱函数打上标记
			markMethods : function(methods){
				if(!methods){
					return;
				}
				var ths = this;
				//写入内部沙箱事件
				$.loop(methods, function(value, key){
					if($.isFunction(value)){
						Object.defineProperty(value, '_isKSAtplEvent', {
							value: true,
							enumerable: false,
							writable: true
						});
					}else if($.isObject(value)){
						ths.markMethods(value);
					}
				});
			},
			/**
			 * 统一解析VDOM虚拟树中的变量
			 */
			parseVDOMcode : function(_EvalCodes){
				var ths = this;

				//===================================================
				var invars = [];
				var ginvars = [];
				$.loop(this.data, function( value, key){
					var svs = "_$data_"+($.isNumber(key) ? ("["+key+"]") : ("."+key));
					invars.push("var "+key+" = "+svs+";");
					ths.isMonitor && ginvars.push("_$$_.G(_$data_, '"+key+"', function(v){"+key+"= v;})");
				});
				//写入沙箱对象
				$.loop(this.methods, function(value, key){
					invars.push("var "+key+" = _$methods_."+key+";");
				});
				invars = invars.join("\n");
				ginvars = ginvars.join("\n");
				_EvalCodes = invars+"\n"+ginvars+" \n return _$$_.D("+_EvalCodes+")";
				if(ths.debug){
					_EvalCodes = "console.error(new Error('Evalcode回调'));"+_EvalCodes;
				}
				var Es = new Function('_$tpl_, _$data_ , _$methods_', 'var _$$_ = this; '+_EvalCodes+'');

				/**
				 * 创建节点并创建变量监听
				 * @param Cfunc 创建元素节点语句
				 * @param Mfunc 监听元素节点语句
				 * @param event 元素绑定的事件
				 * @returns {*}
				 */
				Es.prototype.F = function(Cfunc, Mfunc, event){
					var ele = Cfunc();
					ths.setAttrs(ele, 'renderFunction', function(){
						Cfunc(ele);
					});

					//监听函数
					Mfunc && Mfunc(ele);

					//绑定事件
					$.loop(event, function(func, name){
						$(ele).on(name, function(){
							var R = func.call(this);
							//可能绑定的是一个函数变量名 这时返回的就是一个函数 所以需要判断是否是沙箱内的函数
							if(R && $.isFunction(R) && R._isKSAtplEvent){
								R.call(this);
							}
						})
					});
					return ele;
				}


				/**
				 * 创建节点
				 * @returns {Comment | DocumentFragment}
				 * @private
				 */
				Es.prototype.C = function(){
					var _ts = this;
					var tag = arguments[0];

					var nodeType = arguments[1],
						attrs = arguments[2],
						textContent = arguments[3],
						monitorFunc = arguments[4];

					//最终结果如果是空值则为空
					if($.isNull(textContent) || textContent === undefined){
						textContent = '';
					}
					if($.isObject(tag) && tag.nodeType){
						tag.textContent = textContent;
						return tag;
					}
					var ele;
					if($.isArray(tag)){
						ele = document.createDocumentFragment();
						$.loop(tag, function(e){
							if($.isArray(e)){
								e = _ts.C(e);
							}
							e && ele.appendChild(e);
						});
					}else if(nodeType === 11){

					}else{
						switch (nodeType) {
							case 3:
								ele = document.createTextNode(textContent);
								break;
							case 8:
								ele = document.createComment(textContent);
								break;
							default:
								if(!tag){
									ele = document.createDocumentFragment();
								}else{
									ele = document.createElement(tag);
								}

								if($.isArray(textContent)){
									$.loop(textContent, function(e){
										if(e){
											ele.appendChild(e);
										}
									});
								}else if(textContent && $.isObject(textContent) && textContent.nodeType){
									ele.appendChild(textContent);
								}
						}
						if(attrs){
							var insetattr;
							//attr属性存在需要监听的变量名
							if($.isArray(attrs)){
								insetattr = attrs[0]();
								if(attrs[1]) {
									$.loop(attrs[1], function (v) {
										if(!v[1]){
											v[1] = $.isset(ths.data[v[2]]) ? ths.data : window;
										}
										$.def.createEvent('set', v[1], v[2], function () {
											var e = $(ele);

											$.loop(attrs[0](), function(attrV, attrK){
												attrV = attrV ==='' ? attrK : attrV;
												if(attrK === v[0]){

													//动态绑定attr 单独处理 attrv肯定是一个function
													if(attrK.substr(0,1) ===':'){
														var sAv = attrV();
														e.attr(attrK.substr(1), sAv ? sAv : '');
													}else{
														e.attr(attrK, attrV);
													}
												}
											})
										});
									});
								}
							}else{
								insetattr = attrs;
							}

							if($.isObject(insetattr)){
								var el = $(ele);
								$.loop(insetattr, function(v, k){
									//双向绑定
									if(k ==='v-model') {
										ths.vUpdateModel(ele, v);
									//动态属性处理
									}else if(k.substr(0,1) === ':'){
										var sval = v();
										el.attr(k.substr(1), sval ? sval : '');
									//事件绑定
									}else if(k.substr(0,1) == '@'){
										//ths.bindEvent(ele, k.substr(1), v);
									}else{
										v = v ==='' ? true : v;
										el.attr(k, v);
									}
								});
							}
						}
					}
					if(monitorFunc){
						monitorFunc(ele);
					}

					return ele;
				}

				/**
				 * vdom变量监听绑定函数
				 *
				 * 每个需要监听的对象键名都交给monitor
				 *
				 * @param ele 对应VDOM树
				 * @param obj 需要监听的对象
				 * @param objKey 需要监听的键名
				 * @param at 动作 默认为写nodevalue
				 */
				Es.prototype.M = function M(ele, obj, objKey, at){
					var func = [], func = ths.getAttrs(ele,'renderFunction');
					if(!func){
						return;
					}

					$.def.createEvent('set', obj, objKey, function(){
						func(ele)
					});
				}

				//将DOM写到页面中
				Es.prototype.D = function (element){
					if(!element){
						return;
					}
					var dom = document.createDocumentFragment();
					if($.isArray(element)){
						$.loop(element, function(e){
							if(e) {
								if ($.isArray(e)) {
									$.loop(e, function(v){
										dom.appendChild(v);
									});
								} else {
									dom.appendChild(e);
								}
							}
						});
					}else{
						dom.appendChild(element);
					}

					return [].slice.call(dom.childNodes);
				}

				//收集监控变量
				Es.prototype.G = function (obj, objKey, func){
					if(func) {
						$.def.createEvent('set reset add delete', obj, objKey, func);
					}
				}

				//循环回调
				Es.prototype.LOOP = function (dt, func){
					if(!dt){
						return;
					}
					var _ts = this;
					var loopKey = $.autoID('ktpl-parseLoop');
					if(!ths.cache.loopscope){
						ths.cache.loopscope = {};
					}
					var cache = ths.cache.loopscope[loopKey] = {};

					var newEle = document.createDocumentFragment();
					var valueOld = {};

					//用数据解析一个循环
					function pushNode(value, key){
						var node = func.call('', key, value);
						if($.isArray(node)){
							node = _ts.C(node);
						}
						//loop删除数据监听

						$.def.createEvent('delete', dt, key, function(){

							//如果缓存中只有一个循环时 先创建占位节点
							var lastDom;
							if($.count(cache) === 1){
								var objkeys = Object.keys(cache);
								lastDom = cache[objkeys[objkeys.length -1]][0];
								if(lastDom){
									_loopcreateCom();
									$(lastDom).before(cache.Placeholder);
								}
							}

							//删除当前循环中的元素
							$.loop(cache[key], function(e){
								$(e).remove();
							});
							//从缓存中删除当前元素信息
							delete cache[key];
						});

						valueOld[key] = value;
						return node;
					}

					//如果loop没有数据 则创建一个占位节点
					function _loopcreateCom(){
						var node = document.createComment('KSA-Placeholder:loop');
						node._KSA_Placeholder = 1;
						cache.Placeholder = node;
						return node;
					}



					$.loop(dt, function(value, key){
						cache[key] = cache[key] || [];
						var node = pushNode(value, key);
						var nodes;
						if(node.nodeType === 11){
							nodes = [].slice.call(node.childNodes);
						}else{
							nodes = [node];
						}
						newEle.appendChild(node);

						$.loop(nodes, function(v){
							cache[key].push(v);
						});
					});



					//监听 loop添加数据动作
					$.def.createEvent('add', dt, function(value, key){
						var lastDom = cache.Placeholder;
							//跳过无变化的数据
							if(value === dt[key] && cache[key]){
								return;
							}

							cache[key] = [];
							//根据数据创建节点
							var node = pushNode(value, key);
							//节点信息push到缓存
							if (node.nodeType === 11) {
								$.loop(node.childNodes, function (v) {
									cache[key].push(v);
								});
							} else {
								cache[key].push(node);
							}

							if (!lastDom) {
								//重新遍历cache在对应位置节点上添加 目的是保持顺序
								var objKeys = Object.keys(cache);
								var prevV;
								$.loop(objKeys, function (sv, sk) {
									if (sv == key) {//找到当前顺序
										if (sk === 0) {
											lastDom = cache[objKeys[sk + 1]][0]; //添加位置 取 下一个列表第一个
											$(lastDom).before(cache[key]);
										} else {
											lastDom = prevV[prevV.length - 1]; //添加位置 取 上一个列表最后一个
											$(lastDom).after(cache[key]);
										}
										return true; //跳出循环
									}
									prevV = cache[sv];//记录上一次的元素列表
								});
								prevV = null;
							} else {
								$(lastDom).after(cache[key]);
							}

							//如果存在占位节点则删除
							if (cache.Placeholder) {
								$(lastDom).remove();
								delete cache.Placeholder;
							}
					});

					$.def.createEvent('reset', dt, function(value){
						var newKey = [];
						$.loop(value, function(val, k){
							newKey.push(k);
						});
						$.loop(cache, function(v, k){
							if(!$.inArray(k, newKey)){
								$(v).remove();
								delete cache[k];
							}
						});
						ths.cache.loopscope[loopKey] = cache;
					});
					$.def.createEvent('delete', dt, function(){
						$.loop(cache, function(v, k){
							$(v).remove();
							delete cache[k];
						});
						ths.cache.loopscope[loopKey] = cache;
					});
					//如果loop没有数据 则创建一个占位符
					if(!$.count(cache)){
						newEle.appendChild(_loopcreateCom());
					}
					ths.cache.loopscope[loopKey] = cache;
					//添加数据后增加更新事件
					return newEle;
				}

				/**
				 * if判断节点回调处理
				 * 每个参数代表一个判断条件
				 * 每个参数内的参数：
				 * 1 = 条件判断函数
				 * 2 = 监听变量数组 [  ]
				 * 3 = DOM生成函数
				 */
				Es.prototype.IF = function (){
					//生成当前执行ID
					var ifKey = $.autoID('ktpl-parseIF');
					//缓存中存放当前if域有效元素列表
					if(!ths.cache.ifscope){
						ths.cache.ifscope = {};
					}
					//var cache = ths.cache.ifscope[ifKey];
					var Args = arguments;


					//解析当前域的条件 返回 为真的条件顺序
					function _factor(){
						var index = null;
						$.loop(Args, function(value , i){
							//如果是else 或者条件结果为真 则跳出循环 不再执行下一个if条件
							if(value[0] ==='else' || value[0]()){
								index = i;
								return true; //跳出loop循环
							}
						});
						return index;
					}
					//根据条件顺序 生成DOM
					function _parse(index){
						var dom;
						if(index !== null) {
							dom = Args[index][2]();
						}
						//如果没有生成节点 则创建占位节点
						if (!dom) {
							dom = [document.createComment('KSA-Placeholder:if')];
						//如果生成了节点 但不是数组时 转为数组
						}else if(!$.isArray(dom)){
							dom = [dom];
						}
						return dom;
					}

					var monObj = {};
					//提取if条件中 待监听变量
					$.loop(arguments, function(value){
						$.loop(value[1], function (val) {
							var objID;
							//如果第一个参数为null 表示变量可能是一个顶级变量或者window变量
							if(val[0] === null){
								//找变量的父级
								var f = $.isset(ths.data[val[1]]) ? ths.data : window;
								objID = $.objectID(f);
								monObj[objID] = monObj[objID] || [f , []];
								monObj[objID][1].push(val[1]);
							}else {
								objID = $.objectID(val[0]);
								monObj[objID] = monObj[objID] || [val[0], []];
								$.loop(val[1], function (kname) {
									monObj[objID][1].push(kname);
								});
							}
						});
					});

					//判断条件为真的 语句块索引值
					var ifIndex = _factor();
					//push到dom中的元素列表
					var pushDom = _parse(ifIndex);

					function monFunc(){
						var index = _factor(); //得到当前为真的条件顺序
						if(index !== ifIndex){
							var lastDom = pushDom[pushDom.length-1];
							var dom = _parse(index);
							//当前节点后添加新节点
							$(lastDom).after(dom);
							$(pushDom).remove();
							pushDom = dom;
							ifIndex = index;
						}
					}
					//监听变量变化
					$.loop(monObj, function (value) {
						$.loop(value[1], function(kname){
							$.def.createEvent('set reset add delete', value[0], kname, monFunc);
						})
					});
					return pushDom;
				}

				return new Es(ths, ths.data, ths.methods);
			},
			/**
			 * 提取字符串中的变量名
			 * @param str
			 * @returns {[]}
			 */
			extractParamName : function(str){
				if(!this.cache.extractParamName){
					this.cache.extractParamName = {};
				}
				var cacheK = str;
				if(!this.cache.extractParamName[cacheK]) {
					var strArr = [];
					//滤掉转义引号、空白
					str = str.replace(/['"]/g, '').replace(extractReg[0], '$1');
					//滤掉原生方法
					str = str.replace(extractReg[1], '|$2');
					var S = ''; //连续字符串
					for (var i = 0; i < str.length; i++) {
						var value = str[i];
						//如果碰到圆括号、运算符等特殊符号 直接拆行
						if (extractReg[2].test(value)) {
							strArr.push([S, value]);
							S = '';
							//跳过运算符、空格
						} else {
							S += value;
						}
					}
					if (S) {
						strArr.push([S, '']);
					}

					var Vars = {};
					//提取变量名
					for (var i = 0; i < strArr.length; i++) {
						var value = strArr[i], val = value[0];
						val = val.trim();
						if (val !== '') {
							//滤掉字符串 引号之间的内容
							val = val.replace(/^('.*?')|(".*?")$/g, '');
						}
						//检查中括号中是否存在变量名
						val.replace(/\[([a-z\$_][^\]]+)\]/ig, function () {
							Vars[arguments[1]] = arguments[1];
						});
						//不是起始括号 且第一个字符符合变量名要求
						if (val && value[1] !== '(' && /^[a-z\$_]/i.test(val)) {
							Vars[val] = val;
						}
					}
					this.cache.extractParamName[cacheK] = Object.keys(Vars);
				}
				return this.cache.extractParamName[cacheK];
			},
			/**
			 * 解析文本节点内容
			 * @param text
			 * @returns {{expression: string, tokens: []}}
			 */
			parseText : function  (text, ele) {
				if(!this.cache.parseTextIndex){
					this.cache.parseTextIndex = {};
				}
				var ths = this;
				var parseDt = [];
				var parseTextIndex = this.cache.parseTextIndex;
				if(text && text.trim()) {
					if (parseTextIndex[text]) {
						parseDt = parseTextIndex[text];
					} else {

						var parseCode = [];
						var variableList = {};

						var tagRE = variableReg;

						var lastIndex = tagRE.lastIndex = 0;
						var match, index;
						while ((match = tagRE.exec(text))) {
							index = match.index;
							if (index > lastIndex) {
								parseCode.push( strToQuotes(text.slice(lastIndex, index)) );
							}
							var kname = match[1].trim();
							$.loop(ths.extractParamName(kname), function (v) {
								var skv = keyName(v);
								if(ths.isMonitor && !$.inArray(skv[0],['false','true','null','undefined'])){
									if (skv[1]) {
										variableList[skv[0]] = $.isObject(variableList[skv[0]]) ? variableList[skv[0]] : {};
										variableList[skv[0]][skv[1]] = 1;
									} else {
										variableList[skv[0]] = 1;
									}
								}
							});
							parseCode.push(kname);

							lastIndex = index + match[0].length;
						}
						if (lastIndex < text.length) {
							parseCode.push(JSON.stringify(text.slice(lastIndex)))
						}
						parseCode = parseCode.length ? parseCode.join('+') : null;
						if (parseCode) {
							parseCode = torn(parseCode);
						}
						variableList = $.isEmpty(variableList) ? null : variableList;
						parseDt = [parseCode, variableList];
						parseTextIndex[text] = parseDt;
					}
					if (ele) {
						ths.setAttrs(ele, 'parseCode', parseDt[0]);
						ths.setAttrs(ele, 'variableList', parseDt[1]);
					}
				}else{
					text = torn(text);
					parseDt = [strToQuotes(text)];
				}
				return parseDt;
			},
		};
		return ksaTpl.init();
	}

// ====================== 判断与重写函数类 ====================== //

	$.isWindow = function isWindow(obj) {
		return $.isObject(obj) && obj === obj.window;
	};

	$.isDocument = function(obj){
		return $.isObject(obj) && obj.nodeType == obj.DOCUMENT_NODE;
	}

	$.isArray = function(v){
		return $.isObject(v) && v.constructor == Array;
	}

	/**
	 * 模拟php isset
	 * @param key
	 * @param str 指定需要检测的字符串 可选
	 * @returns {boolean}
	 */
	$.isset = function(key, str){
		if(str !== undefined){
			return key.indexOf(str) === -1;
		}else{
			return typeof(key) !== 'undefined';
		}
	}
	$.isTrue = function(v) {
		return v === true;
	}
	$.isFalse = function(v) {
		return v === false;
	}
	$.isArrayLike = function(obj) {

		if ($.isFunction(obj) || $.isWindow(obj) || $.isString(obj) || $.isNumber(obj)) {
			return false;
		}

		var length = !!obj && "length" in obj && obj.length, type = typeof(obj);
		return type === "array" || length === 0 || (typeof length === "number" && length > 0 && (length - 1) in obj);
	};

	$.isLoop = function(obj) {
		var length = !!obj && "length" in obj && obj.length, type = typeof(obj);
		return type === "array" || length === 0 || (typeof length === "number" && length > 0 && (length - 1) in obj);
	};

	$.isNumber = function(v){
		var tp = typeof(v);
		return (tp ==='string' || tp ==='number') && !isNaN(v);
	}

	$.isBool = function(v){
		return typeof(v) === 'boolean';
	}

	$.isObject = function(v){
		return v && typeof(v) === 'object';
	}

	$.isObjectPlain = function(v) {
		return $.isObject(v) && !$.isWindow(v) && Object.getPrototypeOf(v) === Object.prototype;
	}

	$.isString = function(v){
		return typeof(v) === 'string';
	}
	$.isFunction = function(v){
		return v && typeof(v) === 'function';
	}


	$.isEmpty = function(v){
		if($.isObjectPlain(v)){
			return Object.keys(v).length === 0;
		}else if($.isArray(v)){
			return v.length === 0;
		}else{
			return v === '' || v === undefined;
		}
	}

	/**
	 * 判断是否是一个元素节点
	 * @param dom
	 * @returns {boolean}
	 */
	$.isDomAll = function(dom){
		if(!dom || $.isString(dom)){
			return;
		}
		return dom instanceof HTMLElement ||
			dom instanceof Node ||
			dom instanceof  NodeList ||
			($.isObject(dom) && dom.nodeType && $.isString(dom.nodeName))
	}

	/**
	 * 判断元素节点是否在当前document中
	 * @param e
	 * @returns {*|boolean}
	 */
	$.isIndom = function(e){
		return e && e instanceof HTMLElement && !$.inArray(document.compareDocumentPosition(e), [35, 37]);
	}

	$.isNull = function(v){
		return v === null;
	}

	$.inArray = function(val, dt, rkey){
		var S = false, valisArr = $.isArray(val);
		$.loop(dt,function(v, k){
			if((valisArr && $.inArray(v, val)) || (!valisArr && val == v)){
				S = rkey ? k : true;
				return S;
			}
		});
		return S;
	}

	$.count = function(dt){
		if($.isArray(dt)){
			return dt.length;
		}else if($.isObject(dt)){
			var S = 0, k;
			for(k in dt){
				S ++;
			}
			return S;
		}
	}

	$.arrayMerge = function(){
		var arr = arguments[0] || {};
		$.loop(arguments, function(value, key){
			if(key > 0 && $.isObject(value)){
				$.loop(value,function(val, k){
					arr[k] = val;
				});
			}
		});
		return arr;
	}

	/**
	 * 将任何数据转为数组
	 * @param dt
	 */
	$.toArray = function(dt){
		var tp = typeof(dt);
		if($.isArray(dt)){
			return dt;
		}else if(tp ==='object'){
			if(dt instanceof HTMLElement || dt instanceof Node){
				return [dt];
			}else if(dt instanceof  NodeList){
				return [].slice.call(dt);
			}else if(dt instanceof  $){
				var newdt = [];
				dt.each(function(_, e){
					newdt.push(e);
				});
				return newdt;
			}
		}else{
			return [dt];
		}
	}

	/**
	 * 字符串转数组
	 * @param ft 分隔符
	 * @param str 需要转换的字符串
	 * @param notemp 需要排除的值
	 * @returns {[]}
	 */
	$.explode = function(ft, str, notemp){
		str = ft && str ? str.toString().split(ft) : [];
		if(!str.length){
			return [];
		}
		//如果需要排除空值
		if($.isset(notemp)){
			var news = [];
			$.loop(str, function(v){
				if(v != notemp){
					news.push(v);
				}
			});
			str = news;
		}
		return str;
	}

	$.implode = function(n, arr){
		var s = '', str = '';
		$.loop(arr, function(v){
			str += s+v;
			s = n;
		});
		return str;
	}

	$.unset = function(dt,keys){
		var at = $.isObject(dt) ? 'object' : ($.isArray(dt) ? 'array' : null);
		if(at){
			keys = $.explode(' ', keys, '');

			$.loop(dt,function(v, k){
				if($.inArray(k,keys)){
					if(at =='object'){
						delete dt[k];
					}else{
						dt.splice(k,1);
					}
				}
			});
		}
		return dt;
	}

	$.trim = function(str, char){
		str = str.toString();
		if(char){
			str = str.replace(new RegExp('^\\'+char+'+', 'g'),'');
			str = str.replace(new RegExp('\\'+char+'+$', 'g'),'')
		}else{
			str = str.trim();
		}
		return str;
	}

	function _intval(value, isFloat){
		if($.isObject(value) || $.isArray(value)){
			$.loop(value, function(v, k){
				value[k] = _intval(v, isFloat);
			});
		}else{
			value = (isFloat ? parseFloat(value) : parseInt(value)) || 0;
		}
		return value;
	}

	$.intval = function(value){
		return _intval(value);
	}

	$.floatval = function(value){
		return _intval(value, true);
	}

	$.strpos = function(str, val, len){
		str = str.toString();
		str = len > 0 ? str.substr(len) : str;
		return str.indexOf(val) !== -1;
	}

	$.strlen = function(value){
		return value.toString().length;
	}

	K.focus = function(fun){
		if(fun){
			this.on('focus', fun);
		}else{
			this[0] && this[0].focus();
		}
		return this;
	}

	/**
	 * 触发一个JS字符串代码
	 * 必须通过apply|call触发才能正确调整this指向
	 *
	 * @param code 需要触发的代码
	 * @param param 传递的参数 支持数组
	 * @returns {*}
	 */
	$.callStrEvent = function(code, param){
		code = code.trim();
		var fun = window[code] ? window[code] : new Function('return '+code);
		return fun && $.isArray(param) ? fun.apply(this, param) : fun.call(this, param);
	}

	$.loop(('input blur focusin focusout resize scroll click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change keydown keypress keyup contextmenu touchstart touchmove touchend').split(' '),function (name) {
		K[name] = function(func, fn) {
			return arguments.length > 0 ? this.on(name, null, func, fn) : this.trigger(name);
		};
	});

	$(document).on('DOMContentLoaded.ksa', function(){
		$.loop(DocumentReadyFunction, function(func){
			func();
		});
		DocumentReadyFunction = [];
		$(document).off('DOMContentLoaded.ksa');
	});
	$.extend = $.arrayMerge;
	K.innerWidth = function(){
		return this.width(true);
	}
	K.innerHeight = function(){
		return this.height(true);
	}
	K.outerWidth = function(){
		return this.width(true,true);
	}
	K.outerHeight = function(){
		return this.height(true,true);
	}
	
	
	var requireScript = document.currentScript ? document.currentScript : document.scripts[document.scripts.length-1];
	var requireDir = requireScript.src.substr(0, requireScript.src.lastIndexOf('/')+1);
	$.require = function(){
		var args = arguments;
		if(!args.length){
			args = $.explode(' ', requireScript.getAttribute('module'),'');
			if(!args.length){
				return;
			}
		}
		$.loop(args, function(value){
			var exp = value.substr(value.lastIndexOf('.'));
			exp = exp ? exp.toLowerCase() : exp;
			var isCSS = exp === '.css';
			value = 'module/'+value+(exp ? '' :  '.js');
			var file = document.createElement(isCSS ? 'link' : 'script');
			if(isCSS){
				file.href = requireDir+value;
				file.type = 'text/css';
				file.rel = 'stylesheet';
			}else{
				file.src = requireDir+value;
				file.type = 'text/javascript';
			}
			$(requireScript).after(file);
		});
	}
	$.require();
	
	//插件钩子 $.plugin.xxx = xxx;
	$.plugin = $.prototype;
	window.KSA = window.$ = $;
	return $;
})(document);